import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Item } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { CreateItemCourseDto } from './dto/create-item-course.dto';
import { UpdateItemCourseDto } from './dto/update-item-course.dto';
import { ItemCourseQueryDto } from './dto/item-course-query.dto';
import { ItemCourseResponseDto } from './dto/item-course-response.dto';

@Injectable()
export class ItemCourseService {
  constructor(
    @InjectModel(ItemCourse)
    private readonly itemCourseModel: typeof ItemCourse,
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
  ) {}

  private toResponse(itemCourse: ItemCourse): ItemCourseResponseDto {
    return {
      id: itemCourse.id,
      course: itemCourse.course,
      item_id: itemCourse.item_id,
      passage: itemCourse.passage,
      created_at: itemCourse.createdAt,
      updated_at: itemCourse.updatedAt,
    };
  }

  private normalizeCourse(course: string): string {
    const trimmed = course.trim();
    if (!trimmed) {
      throw new BadRequestException('course est requis');
    }
    return trimmed;
  }

  private async ensureItemExists(itemId: string): Promise<void> {
    const item = await this.itemModel.findByPk(itemId);
    if (!item) {
      throw new BadRequestException('Item introuvable');
    }
  }

  private async getItemCourseOrFail(id: string): Promise<ItemCourse> {
    const itemCourse = await this.itemCourseModel.findByPk(id);
    if (!itemCourse) {
      throw new NotFoundException('Cours introuvable');
    }
    return itemCourse;
  }

  private buildWhereClause(
    query: ItemCourseQueryDto,
  ): WhereOptions<ItemCourse> {
    const where: WhereOptions<ItemCourse> = {};

    if (query.item_id !== undefined) {
      where.item_id = query.item_id;
    }
    if (query.course !== undefined) {
      where.course = query.course.trim();
    }

    return where;
  }

  async create(dto: CreateItemCourseDto): Promise<ItemCourseResponseDto> {
    await this.ensureItemExists(dto.item_id);
    const itemCourse = await this.itemCourseModel.create({
      course: this.normalizeCourse(dto.course),
      item_id: dto.item_id,
      passage: dto.passage?.trim() ?? null,
    });
    return this.toResponse(itemCourse);
  }

  async findAll(query: ItemCourseQueryDto): Promise<{
    data: ItemCourseResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const options: FindOptions<ItemCourse> = {
      where,
      order: [
        ['course', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    };

    const { rows, count } = await this.itemCourseModel.findAndCountAll(options);

    return {
      data: rows.map((itemCourse) => this.toResponse(itemCourse)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ItemCourseResponseDto> {
    const itemCourse = await this.getItemCourseOrFail(id);
    return this.toResponse(itemCourse);
  }

  async update(
    id: string,
    dto: UpdateItemCourseDto,
  ): Promise<ItemCourseResponseDto> {
    const itemCourse = await this.getItemCourseOrFail(id);
    const updates: Partial<Pick<ItemCourse, 'course' | 'item_id' | 'passage'>> =
      {};

    if (dto.course !== undefined) {
      updates.course = this.normalizeCourse(dto.course);
    }
    if (dto.item_id !== undefined) {
      await this.ensureItemExists(dto.item_id);
      updates.item_id = dto.item_id;
    }
    if (dto.passage !== undefined) {
      updates.passage =
        dto.passage === null ? null : dto.passage.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Aucun champ à mettre à jour');
    }

    await itemCourse.update(updates);
    return this.toResponse(itemCourse);
  }
}
