import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { User } from '../models/user.model';
import { SectionsModule } from '../sections/sections.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([User]), SectionsModule],
  providers: [UsersService, RolesGuard],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
