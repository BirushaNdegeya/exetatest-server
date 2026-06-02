import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRole } from '../models/user-role.model';
import { User } from '../models/user.model';
import { ProfilesModule } from '../profiles/profiles.module';
import { UserAuthController } from './user-auth.controller';

@Module({
  imports: [SequelizeModule.forFeature([UserRole, User]), ProfilesModule],
  providers: [UsersService],
  controllers: [UsersController, UserAuthController],
  exports: [UsersService],
})
export class UsersModule {}
