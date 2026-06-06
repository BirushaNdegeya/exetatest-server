import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SectionsService } from '../sections/sections.service';
import { CategoriesService } from '../categories/categories.service';
import { ExamsService } from '../exams/exams.service';
import { ProfileResponseDto } from '../users/dto/profile-response.dto';
import { DrcSection } from '../sections/drc-sections.constants';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';

export interface PracticeYearBlock {
  id: string;
  year: number;
  question_count: number;
}

export interface PracticeSubjectRow {
  id: string;
  name: string;
  description: string | null;
  is_universal: boolean;
  question_count: number;
  years: PracticeYearBlock[];
}

export type PracticeCategoryRow = PracticeSubjectRow;

export interface PracticePageResponse {
  profile: ProfileResponseDto;
  sections: Pick<DrcSection, 'id' | 'title'>[];
  streak: {
    current_streak: number;
    longest_streak: number;
  };
  selected_section_id: string | null;
  categories: PracticeCategoryRow[];
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sectionsService: SectionsService,
    private readonly categoriesService: CategoriesService,
    private readonly examsService: ExamsService,
  ) {}

  async getPracticePage(userId: string): Promise<PracticePageResponse> {
    const [profile, sectionEntities, streakEntity] = await Promise.all([
      this.usersService.getProfileByUserId(userId),
      Promise.resolve(this.sectionsService.getAllSections()),
      this.usersService.getStreakByUserId(userId),
    ]);

    const sections = sectionEntities.map((s) => ({
      id: s.id,
      title: s.title,
    }));

    let profileOut: ProfileResponseDto = profile;
    if (!profile.section_id && profile.section?.trim()) {
      const legacyMatch = findSectionMatchingLegacyLabel(
        profile.section,
        sectionEntities,
      );
      if (legacyMatch) {
        await this.usersService.persistMatchedLegacySection(
          userId,
          legacyMatch.id,
          legacyMatch.title,
        );
        profileOut = {
          ...profile,
          section_id: legacyMatch.id,
          section: legacyMatch.title,
        };
      }
    }

    const matchingSection = profileOut.section_id
      ? (sectionEntities.find((s) => s.id === profileOut.section_id) ?? null)
      : null;

    const streak = {
      current_streak: streakEntity.current_streak ?? 0,
      longest_streak: streakEntity.longest_streak ?? 0,
    };

    if (!matchingSection) {
      return {
        profile: profileOut,
        sections,
        streak,
        selected_section_id: null,
        categories: [],
      };
    }

    const [categories, exams] = await Promise.all([
      this.categoriesService.getAllCategories(),
      this.examsService.getAllExams(),
    ]);

    const categoriesRows: PracticeCategoryRow[] = await Promise.all(
      categories.map(async (sub) => {
        const shouldAttachSectionSpecific =
          !sub.is_universal && Boolean(matchingSection.id);
        const years: PracticeYearBlock[] = exams
          .map((y) => ({
            id: y.id,
            year: Number(y.year),
            question_count: Number(y.question_count ?? 0),
          }))
          .sort((a, b) => b.year - a.year);

        return {
          id: sub.id,
          name: sub.name,
          description: sub.description ?? null,
          is_universal: sub.is_universal,
          question_count: Number(sub.question_count ?? 0),
          years: shouldAttachSectionSpecific || sub.is_universal ? years : [],
        };
      }),
    );

    return {
      profile: profileOut,
      sections,
      streak,
      selected_section_id: matchingSection.id,
      categories: categoriesRows,
    };
  }
}
