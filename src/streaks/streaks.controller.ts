import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyStreak(@CurrentUser() user: any) {
    return this.streaksService.getStreakByUserId(user.id);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateMyStreak(@CurrentUser() user: any) {
    return this.streaksService.updateStreak(user.id);
  }
}
