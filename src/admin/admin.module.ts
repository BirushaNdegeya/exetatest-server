import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Question, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
