import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Section } from '../models/section.model';

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section)
    private sectionModel: typeof Section,
  ) {}

  /**
   * Validates a section UUID for profile PATCH. Returns null to clear. Throws if id is not found.
   */
  async resolveSectionIdForProfile(
    raw: string | null | undefined,
  ): Promise<string | null> {
    if (
      raw === null ||
      raw === undefined ||
      (typeof raw === 'string' && !raw.trim())
    ) {
      return null;
    }
    const id = String(raw).trim();
    const row = await this.sectionModel.findByPk(id);
    if (!row) {
      throw new BadRequestException('Section introuvable.');
    }
    return row.id;
  }

  async getAllSections(): Promise<Section[]> {
    return this.sectionModel.findAll();
  }

  async getSectionCount(): Promise<number> {
    return this.sectionModel.count();
  }

  async getSectionById(id: string): Promise<Section> {
    const section = await this.sectionModel.findByPk(id);
    if (!section) {
      throw new NotFoundException('Section introuvable');
    }
    return section;
  }

  async createSection(data: { name: string }): Promise<Section> {
    return this.sectionModel.create(data);
  }

  async updateSection(id: string, data: { name: string }): Promise<Section> {
    const section = await this.getSectionById(id);
    await section.update(data);
    return section;
  }

  async deleteSection(id: string): Promise<void> {
    const section = await this.getSectionById(id);
    await section.destroy();
  }
}
