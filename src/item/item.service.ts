import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, WhereOptions, fn, col } from 'sequelize';
import { Item } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { AdminSectionItemsQueryDto } from './dto/admin-section-items-query.dto';
import { SectionsService } from '../sections/sections.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemQueryDto } from './dto/item-query.dto';
import { ItemResponseDto } from './dto/item-response.dto';

export type AdminItemSummary = {
  id: string;
  type: Item['type'];
  universal: boolean;
  year: number;
  courseCount: number;
};

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
    @InjectModel(ItemCourse)
    private readonly itemCourseModel: typeof ItemCourse,
    private readonly sectionsService: SectionsService,
  ) {}

  private toResponse(item: Item): ItemResponseDto {
    return {
      id: item.id,
      type: item.type,
      section_id: item.section_id,
      year: item.year,
      universal: item.universal,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private validateSectionId(sectionId: string): string {
    const trimmed = sectionId.trim();
    if (!trimmed) {
      throw new BadRequestException('section_id est requis');
    }
    if (!this.sectionsService.findById(trimmed)) {
      throw new BadRequestException('Section introuvable');
    }
    return trimmed;
  }

  private async getItemOrFail(id: string): Promise<Item> {
    const item = await this.itemModel.findByPk(id);
    if (!item) {
      throw new NotFoundException('Item introuvable');
    }
    return item;
  }

  private buildWhereClause(query: ItemQueryDto): WhereOptions<Item> {
    const where: WhereOptions<Item> = {};

    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.section_id !== undefined) {
      where.section_id = query.section_id.trim();
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }
    if (query.universal !== undefined) {
      where.universal = query.universal;
    }

    return where;
  }

  async create(dto: CreateItemDto): Promise<ItemResponseDto> {
    const section_id = this.validateSectionId(dto.section_id);
    const item = await this.itemModel.create({
      type: dto.type,
      section_id,
      year: dto.year,
      universal: dto.universal ?? false,
    });
    return this.toResponse(item);
  }

  async findAll(query: ItemQueryDto): Promise<{
    data: ItemResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const options: FindOptions<Item> = {
      where,
      order: [
        ['year', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    };

    const { rows, count } = await this.itemModel.findAndCountAll(options);

    return {
      data: rows.map((item) => this.toResponse(item)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ItemResponseDto> {
    const item = await this.getItemOrFail(id);
    return this.toResponse(item);
  }

  async findRandom(query: ItemQueryDto): Promise<ItemResponseDto> {
    const where = this.buildWhereClause(query);
    const item = await this.itemModel.findOne({
      where,
      order: [fn('RANDOM')],
    });

    if (!item) {
      throw new NotFoundException('No item found matching the criteria');
    }

    return this.toResponse(item);
  }

  async update(id: string, dto: UpdateItemDto): Promise<ItemResponseDto> {
    const item = await this.getItemOrFail(id);
    const updates: Partial<
      Pick<Item, 'type' | 'section_id' | 'year' | 'universal'>
    > = {};

    if (dto.type !== undefined) {
      updates.type = dto.type;
    }
    if (dto.section_id !== undefined) {
      updates.section_id = this.validateSectionId(dto.section_id);
    }
    if (dto.year !== undefined) {
      updates.year = dto.year;
    }
    if (dto.universal !== undefined) {
      updates.universal = dto.universal;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Aucun champ à mettre à jour');
    }

    await item.update(updates);
    return this.toResponse(item);
  }

  private async getCourseCountsByItemIds(
    itemIds: string[],
  ): Promise<Map<string, number>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const rows = (await this.itemCourseModel.findAll({
      attributes: ['item_id', [fn('COUNT', col('id')), 'courseCount']],
      where: { item_id: { [Op.in]: itemIds } },
      group: ['item_id'],
      raw: true,
    })) as unknown as Array<{ item_id: string; courseCount: string | number }>;

    return new Map(rows.map((row) => [row.item_id, Number(row.courseCount)]));
  }

  async findBySectionAdmin(
    sectionId: string,
    query: AdminSectionItemsQueryDto,
  ): Promise<{
    items: AdminItemSummary[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Item> = { section_id: sectionId.trim() };

    if (query.universal !== undefined) {
      where.universal = query.universal;
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }

    const { rows, count } = await this.itemModel.findAndCountAll({
      where,
      order: [
        ['year', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    const courseCounts = await this.getCourseCountsByItemIds(
      rows.map((item) => item.id),
    );
    const total = count;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map((item) => ({
        id: item.id,
        type: item.type,
        universal: item.universal,
        year: item.year,
        courseCount: courseCounts.get(item.id) ?? 0,
      })),
      total,
      page,
      totalPages,
    };
  }
}
