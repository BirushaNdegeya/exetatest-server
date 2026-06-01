import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from '../models/question.model';
import { Subject } from '../models/subject.model';
import { TestYear } from '../models/test-year.model';
import { Op } from 'sequelize';

type QuestionOptions = {
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5: string;
};

type CreateQuestionPayload = {
  question_text: string;
  options: QuestionOptions;
  correctAnswer: number;
  explanation: string;
  test_year_id: string;
  passage?: string | null;
  passage_group?: string | null;
  question_type?: string;
  language?: string | null;
};

type CreateQuestionForYearPayload = Omit<CreateQuestionPayload, 'test_year_id'>;
type UpdateQuestionPayload = Partial<CreateQuestionPayload>;
type QuestionPersistencePayload = CreateQuestionPayload & {
  subject_id: string;
  year: number;
};

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question)
    private questionModel: typeof Question,
    @InjectModel(TestYear)
    private testYearModel: typeof TestYear,
  ) {}

  async getAllQuestions(
    subjectId?: string,
    year?: number,
    testYearId?: string,
    limit: number = 20,
    page: number = 1,
    search?: string,
  ): Promise<{
    data: Question[];
    meta: { total: number; page: number; limit: number };
  }> {
    const normalizedLimit = Number(limit) > 0 ? Number(limit) : 20;
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const where: any = {};
    if (testYearId) where.test_year_id = testYearId;
    if (search) where.question_text = { [Op.iLike]: `%${search}%` };

    const include: any[] = [
      {
        model: TestYear,
        include: [Subject],
      },
    ];

    if (subjectId || year) {
      include[0].where = {};
      if (subjectId) include[0].where.subject_id = subjectId;
      if (year) include[0].where.year = Number(year);
    }

    const offset = (normalizedPage - 1) * normalizedLimit;
    const { rows, count } = await this.questionModel.findAndCountAll({
      where,
      include,
      limit: normalizedLimit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: normalizedPage,
        limit: normalizedLimit,
      },
    };
  }

  async getRandomQuestions(
    subjectId?: string,
    year?: number,
    limit: number = 7,
  ): Promise<Question[]> {
    const normalizedLimit = Number(limit) > 0 ? Number(limit) : 7;
    const questions = await this.questionModel.findAll({
      include: [
        {
          model: TestYear,
          include: [Subject],
          ...(subjectId || year
            ? {
                where: {
                  ...(subjectId ? { subject_id: subjectId } : {}),
                  ...(year ? { year } : {}),
                },
              }
            : {}),
        },
      ],
    });

    // Shuffle and limit
    return questions.sort(() => 0.5 - Math.random()).slice(0, normalizedLimit);
  }

  async getQuestionById(id: string): Promise<Question> {
    const question = await this.questionModel.findByPk(id, {
      include: [
        {
          model: TestYear,
          include: [Subject],
        },
      ],
    });
    if (!question) {
      throw new NotFoundException('Question introuvable');
    }
    return question;
  }

  async getQuestionsByYear(
    yearId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{
    data: Question[];
    meta: { total: number; page: number; limit: number };
  }> {
    await this.ensureYearExists(yearId);
    return this.getAllQuestions(
      undefined,
      undefined,
      yearId,
      limit,
      page,
      search,
    );
  }

  async createQuestion(data: CreateQuestionPayload): Promise<Question> {
    const testYear = await this.ensureYearExists(data.test_year_id);
    return this.questionModel.create(this.attachSubjectId(data, testYear));
  }

  async createQuestionForYear(
    yearId: string,
    data: CreateQuestionForYearPayload,
  ): Promise<Question> {
    const testYear = await this.ensureYearExists(yearId);

    return this.questionModel.create(
      this.attachSubjectId(
        {
          ...data,
          test_year_id: yearId,
        },
        testYear,
      ),
    );
  }

  async createBulkQuestions(
    data: CreateQuestionPayload[],
  ): Promise<Question[]> {
    const rows: QuestionPersistencePayload[] = [];

    for (const item of data) {
      const testYear = await this.ensureYearExists(item.test_year_id);
      rows.push(this.attachSubjectId(item, testYear));
    }

    return this.questionModel.bulkCreate(rows);
  }

  async updateQuestion(
    id: string,
    data: UpdateQuestionPayload,
  ): Promise<Question> {
    const question = await this.getQuestionById(id);
    if (data.test_year_id) {
      const testYear = await this.ensureYearExists(data.test_year_id);
      Object.assign(data, {
        subject_id: testYear.subject_id,
        year: testYear.year,
      });
    }
    await question.update(data);
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    const question = await this.getQuestionById(id);
    await question.destroy();
  }

  private async ensureYearExists(testYearId: string): Promise<TestYear> {
    const testYear = await this.testYearModel.findByPk(testYearId);

    if (!testYear) {
      throw new NotFoundException('Bloc année introuvable');
    }

    return testYear;
  }

  private attachSubjectId(
    data: CreateQuestionPayload,
    testYear: TestYear,
  ): QuestionPersistencePayload {
    return {
      ...data,
      subject_id: testYear.subject_id,
      year: testYear.year,
    };
  }
}
