import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecordProgressDto } from './dto/record-progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserProgress(
    @CurrentUser() user: any,
    @Query('question_id') questionId?: string,
  ) {
    return this.progressService.getUserProgress(user.id, questionId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async recordProgress(
    @CurrentUser() user: any,
    @Body() recordProgressDto: RecordProgressDto,
  ) {
    return this.progressService.recordProgress(
      user.id,
      recordProgressDto.question_id,
      recordProgressDto.is_correct,
    );
  }
}
