import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { User } from '../models/user.model';
import { ItemCourseService } from './item-course.service';
import { ItemCourseController } from './item-course.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([ItemCourse, Item, User])],
  providers: [ItemCourseService, RolesGuard],
  controllers: [ItemCourseController],
  exports: [ItemCourseService],
})
export class ItemCourseModule {}
