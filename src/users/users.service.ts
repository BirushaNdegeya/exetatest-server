import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { UserRole, UserRoleEnum } from '../models/user-role.model';
import { User } from '../models/user.model';
import { isConfiguredAdminEmail } from '../auth/utils/admin-access.util';
import { ProfilesService } from '../profiles/profiles.service';
import { StreaksService } from '../streaks/streaks.service';

type UserAuthState = {
  id: string;
  email: string;
  name: string;
  hasSelectedSections: boolean;
  isFirstLogin: boolean;
  section_id: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
};

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectModel(UserRole)
    private userRoleModel: typeof UserRole,
    @InjectModel(User)
    private userModel: typeof User,
    private readonly profilesService: ProfilesService,
    private readonly streaksService: StreaksService,
  ) {}

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleModel.findAll({
      where: { userId },
    });
  }

  async isAdmin(userId: string): Promise<boolean> {
    const adminRole = await this.userRoleModel.findOne({
      where: { userId, role: UserRoleEnum.ADMIN },
    });
    if (adminRole) {
      return true;
    }

    const user = await this.userModel.findByPk(userId);
    return isConfiguredAdminEmail(
      user?.email,
      this.configService.get<string>('ADMIN_EMAILS'),
    );
  }

  async getAllAdmins(): Promise<any[]> {
    const admins = await this.userRoleModel.findAll({
      where: { role: UserRoleEnum.ADMIN },
      include: [User],
    });
    return admins.map((admin) => ({
      user_id: admin.userId,
      display_name: admin.user.name,
    }));
  }

  async getUserAuthState(userId: string): Promise<UserAuthState> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [profile, streak] = await Promise.all([
      this.profilesService.getProfileByUserId(userId),
      this.streaksService.updateStreak(userId),
    ]);

    const hasSelectedSections = Boolean(profile.section_id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: profile.section_id ?? null,
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      last_activity_date: streak.last_activity_date ?? null,
    };
  }

  async setUserSections(
    userId: string,
    sectionId: string,
  ): Promise<UserAuthState> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [updatedProfile, streak] = await Promise.all([
      this.profilesService.updateProfile(userId, {
        section_id: sectionId,
      }),
      this.streaksService.updateStreak(userId),
    ]);

    const hasSelectedSections = Boolean(updatedProfile.section_id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: updatedProfile.section_id ?? null,
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      last_activity_date: streak.last_activity_date ?? null,
    };
  }
}
