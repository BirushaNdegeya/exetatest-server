import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

export interface DashboardPageResponse {
  current_streak: number;
  longest_streak: number;
  custom_set_count: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly usersService: UsersService) {}

  async getDashboardPage(userId: string): Promise<DashboardPageResponse> {
    const [, streak] = await Promise.all([
      this.usersService.getProfileByUserId(userId),
      this.usersService.getStreakByUserId(userId),
    ]);

    return {
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      custom_set_count: 0,
    };
  }
}
