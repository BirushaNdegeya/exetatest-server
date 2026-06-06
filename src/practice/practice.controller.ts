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
import { PracticeService } from './practice.service';

@ApiTags('practice')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get()
  @ApiOperation({
    summary: 'Practice page bootstrap',
    description:
      'Returns profile, sections, streak, and categories (with exam years and counts) for the user selected profile section.',
  })
  @ApiOkResponse({
    description: 'Aggregated practice data',
    schema: {
      example: {
        profile: {
          id: '…',
          email: 'student@example.com',
          section: 'MECANIQUE GENERALE',
        },
        sections: [{ id: 'mecanique-generale', title: 'MÉCANIQUE GÉNÉRALE' }],
        streak: {
          current_streak: 3,
          longest_streak: 10,
        },
        selected_section_id: '…',
        categories: [
          {
            id: '…',
            name: 'Culture generale',
            description: null,
            is_universal: true,
            question_count: 42,
            years: [{ id: '…', year: 2024, question_count: 20 }],
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPracticePage(@CurrentUser() user: { id: string }) {
    return this.practiceService.getPracticePage(user.id);
  }
}
