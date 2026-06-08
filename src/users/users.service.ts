import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { User, UserRoleEnum } from '../models/user.model';
import {
  AdminUserSortField,
  AdminUsersQueryDto,
  SortOrder,
} from './dto/admin-users-query.dto';
import { isConfiguredAdminEmail } from '../auth/utils/admin-access.util';
import { SectionsService } from '../sections/sections.service';
import { findSectionMatchingLegacyLabel } from '../sections/section-legacy-match.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

type UserAuthState = {
  id: string;
  email: string;
  hasSelectedSections: boolean;
  isFirstLogin: boolean;
  section_id: string | null;
  current_streak: number;
  longest_streak: number;
};

export type UserStreakSnapshot = {
  current_streak: number;
  longest_streak: number;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  country: string | null;
  region: string | null;
  section: string | null;
  section_id: string | null;
  role: UserRoleEnum;
  current_streak: number;
  longest_streak: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    private readonly sectionsService: SectionsService,
  ) {}

  private resolveSectionLabel(user: User): string | null {
    if (user.section_id) {
      const catalog = this.sectionsService.findById(user.section_id);
      if (catalog) {
        return catalog.title;
      }
    }
    return user.section ?? null;
  }

  private toProfileResponse(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      section: this.resolveSectionLabel(user),
      section_id: user.section_id ?? null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  private async getUserOrFail(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  private async backfillSectionIdFromLegacyString(user: User): Promise<void> {
    if (user.section_id || !user.section?.trim()) {
      return;
    }
    const sections = this.sectionsService.getAllSections();
    const match = findSectionMatchingLegacyLabel(user.section, sections);
    if (match) {
      await user.update({ section_id: match.id, section: match.title });
    }
  }

  private toUserAuthState(user: User): UserAuthState {
    const hasSelectedSections = Boolean(user.section_id);
    return {
      id: user.id,
      email: user.email,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: user.section_id ?? null,
      current_streak: user.current_streak ?? 0,
      longest_streak: user.longest_streak ?? 0,
    };
  }

  async getUserRoles(userId: string): Promise<{ role: UserRoleEnum }[]> {
    const user = await this.getUserOrFail(userId);
    return [{ role: user.role }];
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserOrFail(userId);
    if (user.role === UserRoleEnum.ADMIN) {
      return true;
    }

    return isConfiguredAdminEmail(
      user.email,
      this.configService.get<string>('ADMIN_EMAILS'),
    );
  }

  async getAllAdmins(): Promise<{ user_id: string; email: string }[]> {
    const admins = await this.userModel.findAll({
      where: { role: UserRoleEnum.ADMIN },
    });
    return admins.map((admin) => ({
      user_id: admin.id,
      email: admin.email,
    }));
  }

  async promoteToAdmin(userId: string): Promise<void> {
    const user = await this.getUserOrFail(userId);
    if (user.role !== UserRoleEnum.ADMIN) {
      await user.update({ role: UserRoleEnum.ADMIN });
    }
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);
    await this.backfillSectionIdFromLegacyString(user);
    await user.reload();
    return this.toProfileResponse(user);
  }

  async persistMatchedLegacySection(
    userId: string,
    sectionId: string,
    canonicalTitle: string,
  ): Promise<void> {
    await this.userModel.update(
      { section_id: sectionId, section: canonicalTitle },
      { where: { id: userId } },
    );
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.getUserOrFail(userId);

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
      await user.update(updatePayload);
      await user.reload();
    }

    return this.toProfileResponse(user);
  }

  async getStreakByUserId(userId: string): Promise<UserStreakSnapshot> {
    const user = await this.getUserOrFail(userId);
    return {
      current_streak: user.current_streak ?? 0,
      longest_streak: user.longest_streak ?? 0,
    };
  }

  async updateStreak(userId: string): Promise<UserStreakSnapshot> {
    return this.getStreakByUserId(userId);
  }

  async getUserAuthState(userId: string): Promise<UserAuthState> {
    const user = await this.getUserOrFail(userId);
    const streak = await this.updateStreak(userId);
    return {
      ...this.toUserAuthState(user),
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
    };
  }

  async setUserSections(
    userId: string,
    sectionId: string,
  ): Promise<UserAuthState> {
    await this.updateProfile(userId, { section_id: sectionId });
    return this.getUserAuthState(userId);
  }

  private toAdminUserSummary(user: User): AdminUserSummary {
    return {
      id: user.id,
      email: user.email,
      country: user.country,
      region: user.region,
      section: user.section,
      section_id: user.section_id,
      role: user.role,
      current_streak: user.current_streak,
      longest_streak: user.longest_streak,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAllAdmin(query: AdminUsersQueryDto): Promise<{
    users: AdminUserSummary[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<User> = {};

    if (query.email?.trim()) {
      where.email = { [Op.iLike]: `%${query.email.trim()}%` };
    }
    if (query.role !== undefined) {
      where.role = query.role;
    }

    const sortBy = query.sortBy ?? AdminUserSortField.CREATED_AT;
    const order = query.order ?? SortOrder.DESC;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      order: [[sortBy, order]],
      limit,
      offset,
    });

    const total = count;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users: rows.map((user) => this.toAdminUserSummary(user)),
      total,
      page,
      totalPages,
    };
  }

  async updateUserRole(
    userId: string,
    role: UserRoleEnum,
  ): Promise<AdminUserSummary> {
    const user = await this.getUserOrFail(userId);
    await user.update({ role });
    return this.toAdminUserSummary(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUserOrFail(userId);
    await user.destroy();
  }
}
