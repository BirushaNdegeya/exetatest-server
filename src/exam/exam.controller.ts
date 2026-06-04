import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RandomExamQueryDto } from './dto/random-exam-query.dto';
import { RandomExamResponseDto } from './dto/random-exam-response.dto';
import { ExamService } from './exam.service';

@ApiTags('exam')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @ApiOperation({
    summary: 'Random practice questions by category code',
    description:
      'Returns a shuffled practice set for one category (cg, sc, co, la, di, jof, jo, joa). Section-specific categories use section_id from the authenticated user profile.',
  })
  @ApiQuery({
    name: 'category',
    required: true,
    description: 'Category code',
    enum: ['cg', 'sc', 'co', 'la', 'di', 'jof', 'jo', 'joa'],
    example: 'cg',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      'Question count (1–50), or "all" for every matching question. Not used for Langues.',
    example: 5,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by exam year',
    example: 2024,
  })
  @ApiQuery({
    name: 'exam_id',
    required: false,
    description: 'Filter by exam UUID',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Random practice set',
    type: RandomExamResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({
    description: 'Missing section for a section-specific category',
  })
  @ApiNotFoundResponse({
    description: 'Category or questions not found',
  })
  async getRandomExam(
    @CurrentUser() user: { id: string },
    @Query() query: RandomExamQueryDto,
  ): Promise<{ data: RandomExamResponseDto; message: string }> {
    const data = await this.examService.getRandomExam(user.id, query.category, {
      limit: query.limit,
      year: query.year,
      examId: query.exam_id,
    });

    return {
      data,
      message: 'Success',
    };
  }
}
