import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { UserRole, UserRoleEnum } from '../models/user-role.model';
import { User } from '../models/user.model';
import { isConfiguredAdminEmail } from '../auth/utils/admin-access.util';
import { ProfilesService } from '../profiles/profiles.service';

type UserAuthState = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  hasSelectedSections: boolean;
  isFirstLogin: boolean;
  section_id: string | null;
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

    const profile = await this.profilesService.getProfileByUserId(userId);
    const hasSelectedSections = Boolean(profile.section_id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: profile.section_id ?? null,
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

    const updatedProfile = await this.profilesService.updateProfile(userId, {
      section_id: sectionId,
    });

    const hasSelectedSections = Boolean(updatedProfile.section_id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: updatedProfile.section_id ?? null,
    };
  }
}
