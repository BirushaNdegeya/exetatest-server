import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../models/question.model';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { User } from '../models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Question, Category, Exam, User])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
