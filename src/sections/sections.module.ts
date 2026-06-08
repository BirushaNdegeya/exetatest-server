import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { AdminSectionsController } from './admin.controller';
import { Item } from '../models/item.model';
import { User } from '../models/user.model';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Item, User])],
  providers: [SectionsService, RolesGuard],
  controllers: [SectionsController, AdminSectionsController],
  exports: [SectionsService],
})
export class SectionsModule {}
