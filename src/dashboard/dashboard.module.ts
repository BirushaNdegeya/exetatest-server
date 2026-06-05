import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { StreaksModule } from '../streaks/streaks.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProfilesModule, StreaksModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
