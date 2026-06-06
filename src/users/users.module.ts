import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../models/user.model';
import { UserAuthController } from './user-auth.controller';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [SequelizeModule.forFeature([User]), SectionsModule],
  providers: [UsersService],
  controllers: [UsersController, UserAuthController],
  exports: [UsersService],
})
export class UsersModule {}
