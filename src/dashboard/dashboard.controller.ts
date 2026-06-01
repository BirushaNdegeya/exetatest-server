import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Student dashboard bootstrap',
    description:
      'Returns the aggregated counters needed by the student dashboard in a single request.',
  })
  @ApiOkResponse({
    description: 'Aggregated dashboard data',
    schema: {
      example: {
        xp: 120,
        current_streak: 4,
        longest_streak: 9,
        total_answered: 87,
        correct_answers: 63,
        custom_set_count: 5,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDashboardPage(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getDashboardPage(user.id);
  }
}
