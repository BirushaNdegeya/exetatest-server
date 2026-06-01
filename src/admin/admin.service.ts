import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Question)
    private questionModel: typeof Question,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(UserRole)
    private userRoleModel: typeof UserRole,
  ) {}

  async getStats(): Promise<{
    totalQuestions: number;
    totalSections: number;
    totalUsers: number;
    totalAdmins: number;
    adminList: { user_id: string; display_name: string }[];
  }> {
    const totalQuestions = await this.questionModel.count();
    const totalSections = DRC_SECTIONS.length;
    const totalUsers = await this.userModel.count();

    const adminRoles = await this.userRoleModel.findAll({
      where: { role: 'admin' },
      include: [User],
    });

    const totalAdmins = adminRoles.length;
    const adminList = adminRoles.map((role) => ({
      user_id: role.userId,
      display_name: role.user.name,
    }));

    return {
      totalQuestions,
      totalSections,
      totalUsers,
      totalAdmins,
      adminList,
    };
  }
}
