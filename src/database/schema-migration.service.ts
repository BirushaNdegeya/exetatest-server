import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';
import { Question } from '../models/question.model';
import { TestYear } from '../models/test-year.model';
import { SUBJECT_BRANCH_TYPES } from '../subjects/dto/create-subject.dto';

interface LegacyQuestionRow {
  id: string;
  subject_id: string;
  year: number;
}

interface DbSectionRow {
  id: string;
  name: string;
}

@Injectable()
export class SchemaMigrationService implements OnModuleInit {
  private readonly logger = new Logger(SchemaMigrationService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(TestYear)
    private readonly testYearModel: typeof TestYear,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
  ) {}

  async onModuleInit(): Promise<void> {
    const runStartupMigrations = this.getBooleanEnv(
      'RUN_STARTUP_MIGRATIONS',
      true,
    );
    if (!runStartupMigrations) {
      this.logger.log(
        'Skipping startup schema migrations because RUN_STARTUP_MIGRATIONS=false',
      );
      return;
    }

    await this.migrateSectionsTableToStaticCatalog();
    await this.ensureProfileSectionIdColumn();
    await this.ensureUserStreakInactivityEmailColumn();
    await this.testYearModel.sync();
    await this.questionModel.sync();
    await this.removeSubjectIconColumn();
    await this.ensureSubjectBranchTypeColumn();
    await this.ensureQuestionTestYearColumn();
    await this.ensureQuestionMetadataColumns();

    const runStartupBackfills = this.getBooleanEnv(
      'RUN_STARTUP_BACKFILLS',
      false,
    );
    if (!runStartupBackfills) {
      this.logger.log(
        'Skipping startup data backfills; set RUN_STARTUP_BACKFILLS=true to enable them',
      );
      return;
    }

    await this.backfillProfilesLegacySectionTextToIds();
    await this.backfillTestYearsFromLegacyQuestions();
  }

  private getBooleanEnv(name: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(name);
    if (value === undefined) {
      return fallback;
    }

    return value === 'true';
  }

  /**
   * Replaces the old `sections` table with the in-code DRC catalog:
   * maps UUID FKs to catalog slugs, drops FKs, and removes the table.
   */
  private async migrateSectionsTableToStaticCatalog(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let sectionsTable: Record<string, unknown> | null = null;

    try {
      sectionsTable = await queryInterface.describeTable('sections');
    } catch {
      await this.ensureSectionIdColumnsAreStringSlugs();
      return;
    }

    if (!sectionsTable) {
      return;
    }

    try {
      const dbSections = await this.sequelize.query<DbSectionRow>(
        'SELECT id, name FROM sections',
        { type: QueryTypes.SELECT },
      );

      const catalog = DRC_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
      }));

      for (const row of dbSections) {
        const match = findSectionMatchingLegacyLabel(row.name, catalog);
        if (!match) {
          this.logger.warn(
            `No DRC catalog match for legacy section "${row.name}" (${row.id})`,
          );
          continue;
        }

        await this.sequelize.query(
          `UPDATE subjects SET section_id = :slug WHERE section_id::text = :oldId`,
          { replacements: { slug: match.id, oldId: row.id } },
        );
        await this.sequelize.query(
          `UPDATE profiles SET section_id = :slug, section = :title WHERE section_id::text = :oldId`,
          {
            replacements: {
              slug: match.id,
              title: match.title,
              oldId: row.id,
            },
          },
        );
      }

      await this.dropSectionForeignKeys(queryInterface);
      await this.ensureSectionIdColumnsAreStringSlugs();
      await queryInterface.dropTable('sections');
      this.logger.log(
        'Dropped sections table; section_id now uses DRC catalog slugs',
      );
    } catch (e) {
      this.logger.warn(
        `migrateSectionsTableToStaticCatalog skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async dropSectionForeignKeys(
    queryInterface: ReturnType<Sequelize['getQueryInterface']>,
  ): Promise<void> {
    const constraints: Array<{ table: string; name: string }> = [
      { table: 'profiles', name: 'profiles_section_id_fkey' },
      { table: 'subjects', name: 'subjects_section_id_fkey' },
    ];

    for (const { table, name } of constraints) {
      try {
        await queryInterface.removeConstraint(table, name);
      } catch {
        // Constraint may already be absent or use a different name.
      }
    }
  }

  private async ensureSectionIdColumnsAreStringSlugs(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();

    for (const table of ['profiles', 'subjects'] as const) {
      try {
        const described = await queryInterface.describeTable(table);
        const column = described.section_id;
        if (!column) {
          continue;
        }

        const typeKey = String(column.type);
        if (!typeKey.includes('uuid') && !typeKey.includes('UUID')) {
          continue;
        }

        await queryInterface.changeColumn(table, 'section_id', {
          type: DataTypes.STRING(64),
          allowNull: table === 'profiles',
        });
        this.logger.log(`Converted ${table}.section_id to VARCHAR(64) slug`);
      } catch (e) {
        this.logger.warn(
          `ensureSectionIdColumnsAreStringSlugs(${table}) skipped: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  /**
   * Ensures `profiles.section_id` exists as a string slug (no FK).
   */
  private async ensureProfileSectionIdColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let profileTable: Record<string, unknown>;
    try {
      profileTable = await queryInterface.describeTable('profiles');
    } catch {
      this.logger.warn(
        'profiles table not found yet; skip section_id migration',
      );
      return;
    }

    if (profileTable.section_id) {
      return;
    }

    await queryInterface.addColumn('profiles', 'section_id', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    this.logger.log('Added profiles.section_id column (DRC catalog slug)');
  }

  /**
   * Ensures `user_streaks.last_inactivity_email_sent_at` exists to prevent
   * duplicate inactivity reminders.
   */
  private async ensureUserStreakInactivityEmailColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let streakTable: Record<string, unknown>;
    try {
      streakTable = await queryInterface.describeTable('user_streaks');
    } catch {
      this.logger.warn(
        'user_streaks table not found yet; skip inactivity email column migration',
      );
      return;
    }

    if (streakTable.last_inactivity_email_sent_at) {
      return;
    }

    await queryInterface.addColumn(
      'user_streaks',
      'last_inactivity_email_sent_at',
      {
        type: DataTypes.DATE,
        allowNull: true,
      },
    );
    this.logger.log('Added user_streaks.last_inactivity_email_sent_at column');
  }

  /** Links profiles.section_id from legacy profiles.section when labels match the catalog. */
  private async backfillProfilesLegacySectionTextToIds(): Promise<void> {
    try {
      const catalog = DRC_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
      }));

      const profiles = await this.sequelize.query<{
        id: string;
        section: string;
      }>(
        `SELECT id, section FROM profiles WHERE section_id IS NULL AND section IS NOT NULL AND TRIM(section) <> ''`,
        { type: QueryTypes.SELECT },
      );

      let updated = 0;
      for (const profile of profiles) {
        const match = findSectionMatchingLegacyLabel(profile.section, catalog);
        if (match) {
          await this.sequelize.query(
            `UPDATE profiles SET section_id = :sid, section = :stitle WHERE id = :pid`,
            {
              replacements: {
                sid: match.id,
                stitle: match.title,
                pid: profile.id,
              },
            },
          );
          updated += 1;
        }
      }
      if (updated > 0) {
        this.logger.log(
          `Backfilled section_id on ${updated} profile row(s) from legacy section text`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `backfillProfilesLegacySectionTextToIds skipped: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async removeSubjectIconColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const subjectTable = await queryInterface.describeTable('subjects');

    if (subjectTable.icon) {
      await queryInterface.removeColumn('subjects', 'icon');
      this.logger.log('Removed subjects.icon column');
    }
  }

  private async ensureQuestionTestYearColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const questionTable = await queryInterface.describeTable('questions');

    if (!questionTable.test_year_id) {
      await queryInterface.addColumn('questions', 'test_year_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      this.logger.log('Added questions.test_year_id column');
    }
  }

  private async ensureSubjectBranchTypeColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const subjectTable = await queryInterface.describeTable('subjects');

    if (!subjectTable.branch_type) {
      await queryInterface.addColumn('subjects', 'branch_type', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: SUBJECT_BRANCH_TYPES[0],
      });
      this.logger.log('Added subjects.branch_type column');
    }
  }

  private async ensureQuestionMetadataColumns(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const questionTable = await queryInterface.describeTable('questions');

    if (!questionTable.question_type) {
      await queryInterface.addColumn('questions', 'question_type', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'standard',
      });
      this.logger.log('Added questions.question_type column');
    }

    if (!questionTable.language) {
      await queryInterface.addColumn('questions', 'language', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      this.logger.log('Added questions.language column');
    }

    if (!questionTable.passage_group) {
      await queryInterface.addColumn('questions', 'passage_group', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      this.logger.log('Added questions.passage_group column');
    }
  }

  private async backfillTestYearsFromLegacyQuestions(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    const questionTable = await queryInterface.describeTable('questions');

    if (
      !questionTable.subject_id ||
      !questionTable.year ||
      !questionTable.test_year_id
    ) {
      return;
    }

    const legacyQuestions = await this.sequelize.query<LegacyQuestionRow>(
      `
        SELECT id, subject_id, year
        FROM questions
        WHERE test_year_id IS NULL
          AND subject_id IS NOT NULL
          AND year IS NOT NULL
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    for (const question of legacyQuestions) {
      const [testYear] = await this.testYearModel.findOrCreate({
        where: {
          subject_id: question.subject_id,
          year: Number(question.year),
        },
        defaults: {
          subject_id: question.subject_id,
          year: Number(question.year),
        },
      });

      await this.sequelize.query(
        `
          UPDATE questions
          SET test_year_id = :testYearId
          WHERE id = :questionId
        `,
        {
          replacements: {
            testYearId: testYear.id,
            questionId: question.id,
          },
        },
      );
    }

    if (legacyQuestions.length > 0) {
      this.logger.log(
        `Backfilled ${legacyQuestions.length} legacy questions into test_year blocks`,
      );
    }
  }
}
