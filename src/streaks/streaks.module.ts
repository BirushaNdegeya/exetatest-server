import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { UserStreak } from '../models/user-streak.model';
import { EmailModule } from '../email/email.module';
import { InactivityReminderService } from './inactivity-reminder.service';
import { User } from '../models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([UserStreak, User]), EmailModule],
  providers: [StreaksService, InactivityReminderService],
  controllers: [StreaksController],
  exports: [StreaksService],
})
export class StreaksModule {}
