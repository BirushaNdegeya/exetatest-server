import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { LanguagePassage } from '../models/language-passage.model';
import { LanguageQuestion } from '../models/language-question.model';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';
import { ProfilesModule } from '../profiles/profiles.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { ExamAdminController } from './exam-admin.controller';
import { ExamAdminService } from './exam-admin.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Question,
      Category,
      Exam,
      LanguagePassage,
      LanguageQuestion,
      // Required by RolesGuard
      User,
      UserRole,
    ]),
    ProfilesModule,
  ],
  controllers: [ExamController, ExamAdminController],
  providers: [ExamService, ExamAdminService],
  exports: [ExamService],
})
export class ExamModule {}
