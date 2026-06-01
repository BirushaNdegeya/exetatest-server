import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../models/question.model';
import { Subject } from '../models/subject.model';
import { TestYear } from '../models/test-year.model';
import { UserRole } from '../models/user-role.model';
import { User } from '../models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Question, Subject, TestYear, UserRole, User]),
  ],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
