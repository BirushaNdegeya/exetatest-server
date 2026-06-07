import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ItemCourse } from '../models/item-course.model';
import { ItemQuestion } from '../models/item-question.model';
import { User } from '../models/user.model';
import { ItemQuestionService } from './item-question.service';
import { ItemQuestionController } from './item-question.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([ItemQuestion, ItemCourse, User])],
  providers: [ItemQuestionService, RolesGuard],
  controllers: [ItemQuestionController],
  exports: [ItemQuestionService],
})
export class ItemQuestionModule {}
