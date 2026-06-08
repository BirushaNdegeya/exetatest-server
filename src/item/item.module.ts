import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { User } from '../models/user.model';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { AdminItemsController } from './admin-items.controller';
import { SectionsModule } from '../sections/sections.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([Item, ItemCourse, User]),
    SectionsModule,
  ],
  providers: [ItemService, RolesGuard],
  controllers: [ItemController, AdminItemsController],
  exports: [ItemService],
})
export class ItemModule {}
