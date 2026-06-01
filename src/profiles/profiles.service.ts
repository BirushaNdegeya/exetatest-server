import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { Section } from '../models/section.model';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { SectionsService } from '../sections/sections.service';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile)
    private readonly profileModel: typeof Profile,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly sectionsService: SectionsService,
  ) {}

  private toProfileResponse(profile: Profile, user: User): ProfileResponseDto {
    const sectionName = profile.sectionEntity?.name ?? profile.section ?? null;
    return {
      id: profile.id,
      email: user.email,
      section: sectionName,
      section_id: profile.section_id ?? null,
      xp: profile.xp ?? 0,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
  }

  private async getUserOrFail(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  private async backfillSectionIdFromLegacyString(
    profile: Profile,
  ): Promise<void> {
    if (profile.section_id || !profile.section?.trim()) {
      return;
    }
    const sections = await this.sectionsService.getAllSections();
    const match = findSectionMatchingLegacyLabel(profile.section, sections);
    if (match) {
      await profile.update({ section_id: match.id, section: match.name });
    }
  }

  /**
   * Persists section_id when legacy text matches (safety net for GET /practice after matcher improvements).
   */
  async persistMatchedLegacySection(
    userId: string,
    sectionId: string,
    canonicalName: string,
  ): Promise<void> {
    await this.profileModel.update(
      { section_id: sectionId, section: canonicalName },
      { where: { userId } },
    );
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);

    let profile = await this.profileModel.findOne({
      where: { userId },
      include: [{ model: Section, required: false }],
    });

    if (!profile) {
      await this.profileModel.create({
        userId,
      });
      profile = await this.profileModel.findOne({
        where: { userId },
        include: [{ model: Section, required: false }],
      });
    }

    if (!profile) {
      throw new NotFoundException('Profil introuvable');
    }

    await this.backfillSectionIdFromLegacyString(profile);
    await profile.reload({ include: [{ model: Section, required: false }] });

    return this.toProfileResponse(profile, user);
  }

  /**
   * Partial PATCH. `section_id` is validated against `sections`; legacy `section` string column
   * is kept in sync for display. `users.name` is updated for session UI.
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);

    let profile = await this.profileModel.findOne({
      where: { userId },
      include: [{ model: Section, required: false }],
    });

    if (!profile) {
      profile = await this.profileModel.create({
        userId,
      });
      profile = await this.profileModel.findOne({
        where: { userId },
        include: [{ model: Section, required: false }],
      });
      if (!profile) {
        throw new NotFoundException('Profil introuvable');
      }
    }

    const patch = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(
        ([, v]) => v !== undefined,
      ),
    ) as UpdateProfileDto & Record<string, unknown>;

    const updatePayload: Record<string, unknown> = { ...patch };

    if (Object.prototype.hasOwnProperty.call(patch, 'section_id')) {
      const resolved = await this.sectionsService.resolveSectionIdForProfile(
        patch.section_id as string | null,
      );
      updatePayload.section_id = resolved;
      if (resolved) {
        const sec = await this.sectionsService.getSectionById(resolved);
        updatePayload.section = sec.name;
      } else {
        updatePayload.section = null;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await profile.update(updatePayload);
      await profile.reload({ include: [{ model: Section, required: false }] });
    }

    await user.reload();

    return this.toProfileResponse(profile, user);
  }

  async createProfile(userId: string): Promise<Profile> {
    return this.profileModel.create({
      userId,
    });
  }
}
