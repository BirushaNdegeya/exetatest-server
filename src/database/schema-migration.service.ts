import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';
import { Question } from '../models/question.model';
import { TestYear } from '../models/test-year.model';
import { SUBJECT_BRANCH_TYPES } from '../subjects/dto/create-subject.dto';

interface LegacyQuestionRow {
  id: string;
  subject_id: string;
  year: number;
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
    const runStartupMigrations = this.getBooleanEnv('RUN_STARTUP_MIGRATIONS', true);
    if (!runStartupMigrations) {
      this.logger.log('Skipping startup schema migrations because RUN_STARTUP_MIGRATIONS=false');
      return;
    }

    await this.ensureProfileSectionIdColumn();
    await this.testYearModel.sync();
    await this.questionModel.sync();
    await this.removeSubjectIconColumn();
    await this.ensureSubjectBranchTypeColumn();
    await this.ensureQuestionTestYearColumn();
    await this.ensureQuestionMetadataColumns();

    const runStartupBackfills = this.getBooleanEnv('RUN_STARTUP_BACKFILLS', false);
    if (!runStartupBackfills) {
      this.logger.log('Skipping startup data backfills; set RUN_STARTUP_BACKFILLS=true to enable them');
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
   * Sequelize sync does not always ALTER existing `profiles` when a new FK is added;
   * ensures `profiles.section_id` exists (FK → sections.id).
   */
  private async ensureProfileSectionIdColumn(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let profileTable: Record<string, unknown>;
    try {
      profileTable = await queryInterface.describeTable('profiles');
    } catch {
      this.logger.warn('profiles table not found yet; skip section_id migration');
      return;
    }

    if (profileTable.section_id) {
      return;
    }

    await queryInterface.addColumn('profiles', 'section_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    this.logger.log('Added profiles.section_id column (FK → sections.id)');
  }

  /** Links profiles.section_id from legacy profiles.section when names match (spacing / case / accents). */
  private async backfillProfilesLegacySectionTextToIds(): Promise<void> {
    try {
      const sections = await this.sequelize.query<{ id: string; name: string }>(
        'SELECT id, name FROM sections',
        { type: QueryTypes.SELECT },
      );
      if (sections.length === 0) {
        return;
      }

      const profiles = await this.sequelize.query<{ id: string; section: string }>(
        `SELECT id, section FROM profiles WHERE section_id IS NULL AND section IS NOT NULL AND TRIM(section) <> ''`,
        { type: QueryTypes.SELECT },
      );

      let updated = 0;
      for (const p of profiles) {
        const match = findSectionMatchingLegacyLabel(p.section, sections);
        if (match) {
          await this.sequelize.query(
            `UPDATE profiles SET section_id = :sid, section = :sname WHERE id = :pid`,
            { replacements: { sid: match.id, sname: match.name, pid: p.id } },
          );
          updated += 1;
        }
      }
      if (updated > 0) {
        this.logger.log(`Backfilled section_id on ${updated} profile row(s) from legacy section text`);
      }
    } catch (e) {
      this.logger.warn(`backfillProfilesLegacySectionTextToIds skipped: ${e instanceof Error ? e.message : String(e)}`);
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

    if (!questionTable.subject_id || !questionTable.year || !questionTable.test_year_id) {
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
      this.logger.log(`Backfilled ${legacyQuestions.length} legacy questions into test_year blocks`);
    }
  }
}
