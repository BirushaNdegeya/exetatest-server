import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col } from 'sequelize';
import { Item } from '../models/item.model';
import { User, UserRoleEnum } from '../models/user.model';
import { DRC_SECTIONS, DrcSection } from './drc-sections.constants';

export type AdminStatsResponse = {
  totalItems: number;
  totalSections: number;
  totalUsers: number;
  totalAdmins: number;
};

export type AdminSectionSummary = {
  section_id: string;
  title: string;
  itemCount: number;
};

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}
  /**
   * Validates a section id for profile PATCH. Returns null to clear. Throws if id is not found.
   */
  resolveSectionIdForProfile(raw: string | null | undefined): string | null {
    if (
      raw === null ||
      raw === undefined ||
      (typeof raw === 'string' && !raw.trim())
    ) {
      return null;
    }
    const id = String(raw).trim();
    if (!this.findById(id)) {
      throw new BadRequestException('Section introuvable');
    }
    return id;
  }

  getAllSections(): DrcSection[] {
    return [...DRC_SECTIONS];
  }

  getSectionCount(): number {
    return DRC_SECTIONS.length;
  }

  findById(id: string): DrcSection | undefined {
    return DRC_SECTIONS.find((section) => section.id === id);
  }

  getSectionById(id: string): DrcSection {
    const section = this.findById(id);
    if (!section) {
      throw new NotFoundException('Section introuvable');
    }
    return section;
  }

  async getAdminStats(): Promise<AdminStatsResponse> {
    const [totalItems, totalSections, totalUsers, totalAdmins] =
      await Promise.all([
        this.itemModel.count(),
        this.itemModel.count({ distinct: true, col: 'section_id' }),
        this.userModel.count(),
        this.userModel.count({ where: { role: UserRoleEnum.ADMIN } }),
      ]);

    return { totalItems, totalSections, totalUsers, totalAdmins };
  }

  async getAdminSections(): Promise<AdminSectionSummary[]> {
    const rows = (await this.itemModel.findAll({
      attributes: ['section_id', [fn('COUNT', col('id')), 'itemCount']],
      group: ['section_id'],
      raw: true,
    })) as unknown as Array<{ section_id: string; itemCount: string | number }>;

    const itemCountBySectionId = new Map(
      rows.map((row) => [row.section_id, Number(row.itemCount)]),
    );

    return DRC_SECTIONS.map((section) => ({
      section_id: section.id,
      title: section.title,
      itemCount: itemCountBySectionId.get(section.id) ?? 0,
    }));
  }
}
