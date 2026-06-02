import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { StreaksModule } from '../streaks/streaks.module';
import { CustomSetsModule } from '../custom-sets/custom-sets.module';

@Module({
  imports: [ProfilesModule, StreaksModule, CustomSetsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
