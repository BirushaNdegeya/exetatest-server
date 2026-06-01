import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';

@Module({
  imports: [SequelizeModule.forFeature([Question, User, UserRole])],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
