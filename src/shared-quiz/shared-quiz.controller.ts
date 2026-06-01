import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SharedQuizService } from './shared-quiz.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shared-quiz')
export class SharedQuizController {
  constructor(private readonly sharedQuizService: SharedQuizService) {}

  @Get(':setId')
  @UseGuards(JwtAuthGuard)
  async getSharedQuiz(@CurrentUser() user: any, @Param('setId') setId: string) {
    return this.sharedQuizService.getSharedQuiz(user.id, setId);
  }
}
