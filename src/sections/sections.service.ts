import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRC_SECTIONS, DrcSection } from './drc-sections.constants';

@Injectable()
export class SectionsService {
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
      throw new BadRequestException('Section introuvable.');
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
}
