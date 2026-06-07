import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from '../models/item.model';
import { User } from '../models/user.model';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { SectionsModule } from '../sections/sections.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Item, User]), SectionsModule],
  providers: [ItemService, RolesGuard],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
