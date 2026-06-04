import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { LanguagePassage } from '../models/language-passage.model';
import { LanguageQuestion } from '../models/language-question.model';
import { Question } from '../models/question.model';
import { ProfilesModule } from '../profiles/profiles.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Question,
      Category,
      Exam,
      LanguagePassage,
      LanguageQuestion,
    ]),
    ProfilesModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
