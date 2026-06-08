import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { ItemCourse } from '../models/item-course.model';
import { ItemQuestion } from '../models/item-question.model';
import { AdminCreateItemQuestionDto } from './dto/admin-create-item-question.dto';
import { CreateItemQuestionDto } from './dto/create-item-question.dto';
import { UpdateItemQuestionDto } from './dto/update-item-question.dto';
import { ItemQuestionQueryDto } from './dto/item-question-query.dto';
import { ItemQuestionResponseDto } from './dto/item-question-response.dto';

@Injectable()
export class ItemQuestionService {
  constructor(
    @InjectModel(ItemQuestion)
    private readonly itemQuestionModel: typeof ItemQuestion,
    @InjectModel(ItemCourse)
    private readonly itemCourseModel: typeof ItemCourse,
  ) {}

  private toResponse(itemQuestion: ItemQuestion): ItemQuestionResponseDto {
    return {
      id: itemQuestion.id,
      question: itemQuestion.question,
      item_course_id: itemQuestion.item_course_id,
      options: itemQuestion.options,
      answer: itemQuestion.answer,
      created_at: itemQuestion.createdAt,
      updated_at: itemQuestion.updatedAt,
    };
  }

  private normalizeQuestion(question: string): string {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new BadRequestException('question est requis');
    }
    return trimmed;
  }

  private normalizeOptions(options: string[]): string[] {
    const normalized = options.map((option) => option.trim()).filter(Boolean);
    if (normalized.length < 2) {
      throw new BadRequestException(
        'options doit contenir au moins 2 choix valides',
      );
    }
    return normalized;
  }

  private validateAnswerIndex(answer: number, options: string[]): void {
    if (answer < 0 || answer >= options.length) {
      throw new BadRequestException(
        `answer doit être un index entre 0 et ${options.length - 1}`,
      );
    }
  }

  private async ensureItemCourseExists(itemCourseId: string): Promise<void> {
    const itemCourse = await this.itemCourseModel.findByPk(itemCourseId);
    if (!itemCourse) {
      throw new BadRequestException('Cours introuvable');
    }
  }

  private async getItemQuestionOrFail(id: string): Promise<ItemQuestion> {
    const itemQuestion = await this.itemQuestionModel.findByPk(id);
    if (!itemQuestion) {
      throw new NotFoundException('Question introuvable');
    }
    return itemQuestion;
  }

  private buildWhereClause(
    query: ItemQuestionQueryDto,
  ): WhereOptions<ItemQuestion> {
    const where: WhereOptions<ItemQuestion> = {};

    if (query.item_course_id !== undefined) {
      where.item_course_id = query.item_course_id;
    }

    return where;
  }

  async create(dto: CreateItemQuestionDto): Promise<ItemQuestionResponseDto> {
    await this.ensureItemCourseExists(dto.item_course_id);
    const options = this.normalizeOptions(dto.options);
    this.validateAnswerIndex(dto.answer, options);

    const itemQuestion = await this.itemQuestionModel.create({
      question: this.normalizeQuestion(dto.question),
      item_course_id: dto.item_course_id,
      options,
      answer: dto.answer,
    });
    return this.toResponse(itemQuestion);
  }

  async findAll(query: ItemQuestionQueryDto): Promise<{
    data: ItemQuestionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const options: FindOptions<ItemQuestion> = {
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    };

    const { rows, count } =
      await this.itemQuestionModel.findAndCountAll(options);

    return {
      data: rows.map((itemQuestion) => this.toResponse(itemQuestion)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ItemQuestionResponseDto> {
    const itemQuestion = await this.getItemQuestionOrFail(id);
    return this.toResponse(itemQuestion);
  }

  async update(
    id: string,
    dto: UpdateItemQuestionDto,
  ): Promise<ItemQuestionResponseDto> {
    const itemQuestion = await this.getItemQuestionOrFail(id);
    const updates: Partial<
      Pick<ItemQuestion, 'question' | 'item_course_id' | 'options' | 'answer'>
    > = {};

    if (dto.question !== undefined) {
      updates.question = this.normalizeQuestion(dto.question);
    }
    if (dto.item_course_id !== undefined) {
      await this.ensureItemCourseExists(dto.item_course_id);
      updates.item_course_id = dto.item_course_id;
    }
    if (dto.options !== undefined) {
      updates.options = this.normalizeOptions(dto.options);
    }
    if (dto.answer !== undefined) {
      updates.answer = dto.answer;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Aucun champ à mettre à jour');
    }

    const finalOptions = updates.options ?? itemQuestion.options;
    const finalAnswer = updates.answer ?? itemQuestion.answer;
    this.validateAnswerIndex(finalAnswer, finalOptions);

    await itemQuestion.update(updates);
    return this.toResponse(itemQuestion);
  }

  async findByCourseId(courseId: string): Promise<ItemQuestionResponseDto[]> {
    await this.ensureItemCourseExists(courseId);
    const questions = await this.itemQuestionModel.findAll({
      where: { item_course_id: courseId },
      order: [['createdAt', 'ASC']],
    });
    return questions.map((question) => this.toResponse(question));
  }

  async createForCourse(
    courseId: string,
    dto: AdminCreateItemQuestionDto,
  ): Promise<ItemQuestionResponseDto> {
    return this.create({
      item_course_id: courseId,
      question: dto.question,
      options: dto.options,
      answer: dto.answer,
    });
  }

  async remove(questionId: string): Promise<void> {
    const itemQuestion = await this.getItemQuestionOrFail(questionId);
    await itemQuestion.destroy();
  }
}
