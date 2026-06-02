import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { StreaksService } from '../streaks/streaks.service';
import { CustomSetsService } from '../custom-sets/custom-sets.service';

export interface DashboardPageResponse {
  current_streak: number;
  longest_streak: number;
  custom_set_count: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly streaksService: StreaksService,
    private readonly customSetsService: CustomSetsService,
  ) {}

  async getDashboardPage(userId: string): Promise<DashboardPageResponse> {
    const [, streak, customSetCount] = await Promise.all([
      this.profilesService.getProfileByUserId(userId),
      this.streaksService.getStreakByUserId(userId),
      this.customSetsService.getUserCustomSetCount(userId),
    ]);

    return {
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      custom_set_count: customSetCount,
    };
  }
}
