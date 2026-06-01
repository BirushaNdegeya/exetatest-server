import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [SequelizeModule.forFeature([Profile, User]), SectionsModule],
  providers: [ProfilesService],
  controllers: [ProfilesController],
  exports: [ProfilesService],
})
export class ProfilesModule {}
