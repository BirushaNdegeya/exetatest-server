import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { Question } from '../models/question.model';

type CreateQuestionPayload = {
  exam_id?: string | null;
  section_id?: string | null;
  category_id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
};

type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Exam)
    private readonly examModel: typeof Exam,
  ) {}

  async getAllQuestions(
    sectionId?: string,
    categoryId?: string,
    examId?: string,
    year?: number,
    limit: number = 20,
    page: number = 1,
    search?: string,
  ): Promise<{
    data: Question[];
    meta: { total: number; page: number; limit: number };
  }> {
    const normalizedLimit = Number(limit) > 0 ? Number(limit) : 20;
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const where: Record<string, unknown> = {};
    const include: any[] = [
      { model: Category },
      { model: Exam, required: false },
    ];

    if (categoryId) {
      const category = await this.ensureCategoryExists(categoryId);
      where.category_id = category.id;
      if (category.is_universal) {
        where.section_id = null;
      } else if (sectionId) {
        where.section_id = sectionId;
      }
    } else if (sectionId) {
      where.section_id = sectionId;
    }

    if (examId) {
      where.exam_id = examId;
    }
    if (year) {
      include[1].required = true;
      include[1].where = { year: Number(year) };
    }
    if (search) {
      where.text = { [Op.iLike]: `%${search}%` };
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
    sectionId?: string,
    categoryId?: string,
    examId?: string,
    year?: number,
    limit: number = 7,
  ): Promise<Question[]> {
    const { data } = await this.getAllQuestions(
      sectionId,
      categoryId,
      examId,
      year,
      500,
      1,
    );
    const normalizedLimit = Number(limit) > 0 ? Number(limit) : 7;
    return data.sort(() => 0.5 - Math.random()).slice(0, normalizedLimit);
  }

  async getQuestionById(id: string): Promise<Question> {
    const question = await this.questionModel.findByPk(id, {
      include: [Category, Exam],
    });
    if (!question) {
      throw new NotFoundException('Question introuvable');
    }
    return question;
  }

  async createQuestion(data: CreateQuestionPayload): Promise<Question> {
    await this.validateQuestionScope(data.category_id, data.section_id);
    if (data.exam_id) {
      await this.ensureExamExists(data.exam_id);
    }
    return this.questionModel.create(data);
  }

  async createBulkQuestions(
    data: CreateQuestionPayload[],
  ): Promise<Question[]> {
    for (const item of data) {
      await this.validateQuestionScope(item.category_id, item.section_id);
      if (item.exam_id) {
        await this.ensureExamExists(item.exam_id);
      }
    }
    return this.questionModel.bulkCreate(data);
  }

  async updateQuestion(
    id: string,
    data: UpdateQuestionPayload,
  ): Promise<Question> {
    const question = await this.getQuestionById(id);
    const resolvedCategoryId = data.category_id ?? question.category_id;
    const resolvedSectionId =
      data.section_id === undefined ? question.section_id : data.section_id;
    await this.validateQuestionScope(resolvedCategoryId, resolvedSectionId);
    if (data.exam_id) {
      await this.ensureExamExists(data.exam_id);
    }
    await question.update(data);
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    const question = await this.getQuestionById(id);
    await question.destroy();
  }

  private async ensureCategoryExists(categoryId: string): Promise<Category> {
    const category = await this.categoryModel.findByPk(categoryId);
    if (!category) {
      throw new NotFoundException('Categorie introuvable');
    }
    return category;
  }

  private async ensureExamExists(examId: string): Promise<Exam> {
    const exam = await this.examModel.findByPk(examId);
    if (!exam) {
      throw new NotFoundException('Examen introuvable');
    }
    return exam;
  }

  private async validateQuestionScope(
    categoryId: string,
    sectionId?: string | null,
  ): Promise<void> {
    const category = await this.ensureCategoryExists(categoryId);
    if (category.is_universal && sectionId) {
      throw new BadRequestException(
        'Les categories universelles ne doivent pas fournir section_id',
      );
    }
    if (!category.is_universal && !sectionId) {
      throw new BadRequestException(
        'Les categories specifiques doivent fournir section_id',
      );
    }
  }
}
