import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserStreak } from '../models/user-streak.model';

@Injectable()
export class StreaksService {
  constructor(
    @InjectModel(UserStreak)
    private userStreakModel: typeof UserStreak,
  ) {}

  async getStreakByUserId(userId: string): Promise<UserStreak> {
    let streak = await this.userStreakModel.findOne({
      where: { userId },
    });

    if (!streak) {
      // Create default streak if doesn't exist
      streak = await this.userStreakModel.create({
        userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
      });
    }

    return streak;
  }

  async updateStreak(userId: string): Promise<UserStreak> {
    let streak = await this.userStreakModel.findOne({
      where: { userId },
    });

    if (!streak) {
      streak = await this.userStreakModel.create({
        userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: new Date(),
      });
      return streak;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = streak.last_activity_date
      ? new Date(streak.last_activity_date)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
    }

    let newCurrentStreak = streak.current_streak;

    // If last activity was today, don't increment
    if (lastActivity && lastActivity.getTime() === today.getTime()) {
      // Already counted for today
    } else if (lastActivity) {
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      // If exactly 1 day difference, increment streak
      if (daysDiff === 1) {
        newCurrentStreak += 1;
      } else {
        // More than 1 day, reset streak
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(newCurrentStreak, streak.longest_streak);

    await streak.update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today,
      last_inactivity_email_sent_at: null,
    });

    return streak;
  }
}
