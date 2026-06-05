import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { Question } from '../models/question.model';
import { TestYear } from '../models/test-year.model';

const DEFAULT_CATEGORIES = [
  { name: 'Culture generale', is_universal: true },
  { name: 'Sciences', is_universal: false },
  { name: "Cours d'options", is_universal: false },
  { name: 'Langues', is_universal: true },
] as const;

const BRANCH_TYPE_CATEGORY_NAMES: Record<string, string> = {
  'culture générale': 'Culture generale',
  'culture generale': 'Culture generale',
  sciences: 'Sciences',
  "cours d'options": "Cours d'options",
  'cours d options': "Cours d'options",
  langues: 'Langues',
};

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
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Exam)
    private readonly examModel: typeof Exam,
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
    await this.categoryModel.sync();
    await this.examModel.sync();
    await this.seedDefaultCategories();
    await this.questionModel.sync();
    await this.removeSubjectIconColumn();
    await this.ensureSubjectBranchTypeColumn();
    await this.ensureQuestionTestYearColumn();
    await this.ensureQuestionMetadataColumns();
    await this.ensureQuestionsNewSchemaColumns();
    await this.backfillQuestionsFromLegacySchema();

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
        defaultValue: 'Culture Générale',
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

    if (!questionTable.passage) {
      await queryInterface.addColumn('questions', 'passage', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
      this.logger.log('Added questions.passage column');
    }
  }

  private async seedDefaultCategories(): Promise<void> {
    for (const category of DEFAULT_CATEGORIES) {
      await this.categoryModel.findOrCreate({
        where: { name: category.name },
        defaults: {
          name: category.name,
          is_universal: category.is_universal,
        },
      });
    }
  }

  private async ensureQuestionsNewSchemaColumns(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let questionTable: Record<string, unknown>;
    try {
      questionTable = await queryInterface.describeTable('questions');
    } catch {
      this.logger.warn(
        'questions table not found yet; skip new schema column migration',
      );
      return;
    }

    if (!questionTable.category_id) {
      await queryInterface.addColumn('questions', 'category_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      this.logger.log('Added questions.category_id column');
    }

    if (!questionTable.exam_id) {
      await queryInterface.addColumn('questions', 'exam_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      this.logger.log('Added questions.exam_id column');
    }

    if (!questionTable.section_id) {
      await queryInterface.addColumn('questions', 'section_id', {
        type: DataTypes.STRING(64),
        allowNull: true,
      });
      this.logger.log('Added questions.section_id column');
    }

    if (!questionTable.text) {
      await queryInterface.addColumn('questions', 'text', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
      this.logger.log('Added questions.text column');
    }
  }

  private async backfillQuestionsFromLegacySchema(): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    let questionTable: Record<string, unknown>;
    try {
      questionTable = await queryInterface.describeTable('questions');
    } catch {
      return;
    }

    if (!questionTable.category_id) {
      return;
    }

    if (questionTable.question_text && questionTable.text) {
      const [, textBackfillMeta] = await this.sequelize.query(
        `
          UPDATE questions
          SET text = question_text
          WHERE text IS NULL
            AND question_text IS NOT NULL
            AND TRIM(question_text) <> ''
        `,
      );
      const textBackfillCount = this.getAffectedRowCount(textBackfillMeta);
      if (textBackfillCount > 0) {
        this.logger.log(
          `Backfilled questions.text from question_text on ${textBackfillCount} row(s)`,
        );
      }
    }

    if (questionTable.year && questionTable.exam_id) {
      const years = await this.sequelize.query<{ year: number }>(
        `
          SELECT DISTINCT year
          FROM questions
          WHERE year IS NOT NULL
        `,
        { type: QueryTypes.SELECT },
      );

      for (const row of years) {
        await this.examModel.findOrCreate({
          where: { year: Number(row.year) },
          defaults: { year: Number(row.year) },
        });
      }

      const [, examBackfillMeta] = await this.sequelize.query(
        `
          UPDATE questions q
          SET exam_id = e.id
          FROM exams e
          WHERE q.exam_id IS NULL
            AND q.year IS NOT NULL
            AND e.year = q.year
        `,
      );
      const examBackfillCount = this.getAffectedRowCount(examBackfillMeta);
      if (examBackfillCount > 0) {
        this.logger.log(
          `Backfilled questions.exam_id on ${examBackfillCount} row(s)`,
        );
      }
    }

    if (!questionTable.subject_id) {
      return;
    }

    const categories = await this.categoryModel.findAll();
    const categoryByName = new Map(
      categories.map((category) => [category.name, category]),
    );

    const subjects = await this.sequelize.query<{
      id: string;
      branch_type: string;
      section_id: string | null;
    }>(
      `
        SELECT id, branch_type, section_id
        FROM subjects
      `,
      { type: QueryTypes.SELECT },
    );

    let categoryBackfillCount = 0;
    let sectionBackfillCount = 0;

    for (const subject of subjects) {
      const normalizedBranch = subject.branch_type.trim().toLowerCase();
      const categoryName = BRANCH_TYPE_CATEGORY_NAMES[normalizedBranch];
      if (!categoryName) {
        this.logger.warn(
          `No category mapping for subject branch_type "${subject.branch_type}" (${subject.id})`,
        );
        continue;
      }

      const category = categoryByName.get(categoryName);
      if (!category) {
        continue;
      }

      const [, categoryMeta] = await this.sequelize.query(
        `
          UPDATE questions
          SET category_id = :categoryId
          WHERE subject_id = :subjectId
            AND category_id IS NULL
        `,
        {
          replacements: {
            categoryId: category.id,
            subjectId: subject.id,
          },
        },
      );
      categoryBackfillCount += this.getAffectedRowCount(categoryMeta);

      if (!category.is_universal && subject.section_id) {
        const [, sectionMeta] = await this.sequelize.query(
          `
            UPDATE questions
            SET section_id = :sectionId
            WHERE subject_id = :subjectId
              AND category_id = :categoryId
              AND section_id IS NULL
          `,
          {
            replacements: {
              sectionId: subject.section_id,
              subjectId: subject.id,
              categoryId: category.id,
            },
          },
        );
        sectionBackfillCount += this.getAffectedRowCount(sectionMeta);
      }
    }

    if (categoryBackfillCount > 0) {
      this.logger.log(
        `Backfilled questions.category_id on ${categoryBackfillCount} row(s)`,
      );
    }
    if (sectionBackfillCount > 0) {
      this.logger.log(
        `Backfilled questions.section_id on ${sectionBackfillCount} row(s)`,
      );
    }
  }

  private getAffectedRowCount(metadata: unknown): number {
    if (
      metadata &&
      typeof metadata === 'object' &&
      'rowCount' in metadata &&
      typeof metadata.rowCount === 'number'
    ) {
      return metadata.rowCount;
    }

    return 0;
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
