import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { Subject } from '../models/subject.model';
import { TestYear } from '../models/test-year.model';
import { UserRole } from '../models/user-role.model';
import { User } from '../models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Subject, TestYear, UserRole, User])],
  providers: [SubjectsService],
  controllers: [SubjectsController],
  exports: [SubjectsService],
})
export class SubjectsModule {}
