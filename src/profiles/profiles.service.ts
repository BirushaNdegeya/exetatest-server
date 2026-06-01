import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
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

  private resolveSectionLabel(profile: Profile): string | null {
    if (profile.section_id) {
      const catalog = this.sectionsService.findById(profile.section_id);
      if (catalog) {
        return catalog.title;
      }
    }
    return profile.section ?? null;
  }

  private toProfileResponse(profile: Profile, user: User): ProfileResponseDto {
    return {
      id: profile.id,
      email: user.email,
      section: this.resolveSectionLabel(profile),
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
    const sections = this.sectionsService.getAllSections();
    const match = findSectionMatchingLegacyLabel(profile.section, sections);
    if (match) {
      await profile.update({ section_id: match.id, section: match.title });
    }
  }

  /**
   * Persists section_id when legacy text matches (safety net for GET /practice after matcher improvements).
   */
  async persistMatchedLegacySection(
    userId: string,
    sectionId: string,
    canonicalTitle: string,
  ): Promise<void> {
    await this.profileModel.update(
      { section_id: sectionId, section: canonicalTitle },
      { where: { userId } },
    );
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);

    let profile = await this.profileModel.findOne({
      where: { userId },
    });

    if (!profile) {
      await this.profileModel.create({
        userId,
      });
      profile = await this.profileModel.findOne({
        where: { userId },
      });
    }

    if (!profile) {
      throw new NotFoundException('Profil introuvable');
    }

    await this.backfillSectionIdFromLegacyString(profile);
    await profile.reload();

    return this.toProfileResponse(profile, user);
  }

  /**
   * Partial PATCH. `section_id` is validated against the DRC catalog; legacy `section` string column
   * is kept in sync for display. `users.name` is updated for session UI.
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);

    let profile = await this.profileModel.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = await this.profileModel.create({
        userId,
      });
      profile = await this.profileModel.findOne({
        where: { userId },
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
      const resolved = this.sectionsService.resolveSectionIdForProfile(
        patch.section_id as string | null,
      );
      updatePayload.section_id = resolved;
      if (resolved) {
        const sec = this.sectionsService.getSectionById(resolved);
        updatePayload.section = sec.title;
      } else {
        updatePayload.section = null;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await profile.update(updatePayload);
      await profile.reload();
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
