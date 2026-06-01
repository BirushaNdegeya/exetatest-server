import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { SectionsService } from '../sections/sections.service';
import { StreaksService } from '../streaks/streaks.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TestYearsService } from '../test-years/test-years.service';
import { ProfileResponseDto } from '../profiles/dto/profile-response.dto';
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
  branch_type: string;
  icon: string | null;
  question_count: number;
  years: PracticeYearBlock[];
}

export interface PracticePageResponse {
  profile: ProfileResponseDto;
  sections: Pick<DrcSection, 'id' | 'title'>[];
  streak: {
    current_streak: number;
    longest_streak: number;
    last_activity_date: Date | null;
  };
  selected_section_id: string | null;
  subjects: PracticeSubjectRow[];
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly sectionsService: SectionsService,
    private readonly streaksService: StreaksService,
    private readonly subjectsService: SubjectsService,
    private readonly testYearsService: TestYearsService,
  ) {}

  async getPracticePage(userId: string): Promise<PracticePageResponse> {
    const [profile, sectionEntities, streakEntity] = await Promise.all([
      this.profilesService.getProfileByUserId(userId),
      Promise.resolve(this.sectionsService.getAllSections()),
      this.streaksService.getStreakByUserId(userId),
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
        await this.profilesService.persistMatchedLegacySection(
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
      last_activity_date: streakEntity.last_activity_date ?? null,
    };

    if (!matchingSection) {
      return {
        profile: profileOut,
        sections,
        streak,
        selected_section_id: null,
        subjects: [],
      };
    }

    const sectionSubjects = await this.subjectsService.getAllSubjects(
      matchingSection.id,
    );

    const subjects: PracticeSubjectRow[] = await Promise.all(
      sectionSubjects.map(async (sub) => {
        const yearsRaw = await this.testYearsService.getYearsBySubject(sub.id);
        const years: PracticeYearBlock[] = yearsRaw
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
          branch_type: sub.branch_type ?? 'Culture Générale',
          icon: (sub as { icon?: string | null }).icon ?? null,
          question_count: Number(sub.question_count ?? 0),
          years,
        };
      }),
    );

    return {
      profile: profileOut,
      sections,
      streak,
      selected_section_id: matchingSection.id,
      subjects,
    };
  }
}
