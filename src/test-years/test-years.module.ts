import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Question } from '../models/question.model';
import { Subject } from '../models/subject.model';
import { TestYear } from '../models/test-year.model';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';
import { TestYearsController } from './test-years.controller';
import { TestYearsService } from './test-years.service';

@Module({
  imports: [
    SequelizeModule.forFeature([TestYear, Subject, Question, UserRole, User]),
  ],
  providers: [TestYearsService],
  controllers: [TestYearsController],
  exports: [TestYearsService],
})
export class TestYearsModule {}
