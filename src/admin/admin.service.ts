import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from '../models/question.model';
import { User, UserRoleEnum } from '../models/user.model';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Question)
    private questionModel: typeof Question,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async getStats(): Promise<{
    totalQuestions: number;
    totalSections: number;
    totalUsers: number;
    totalAdmins: number;
    adminList: { user_id: string; email: string }[];
  }> {
    const totalQuestions = await this.questionModel.count();
    const totalSections = DRC_SECTIONS.length;
    const totalUsers = await this.userModel.count();

    const admins = await this.userModel.findAll({
      where: { role: UserRoleEnum.ADMIN },
    });

    const totalAdmins = admins.length;
    const adminList = admins.map((admin) => ({
      user_id: admin.id,
      email: admin.email,
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
