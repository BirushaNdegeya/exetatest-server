import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionResponseDto } from './dto/question-response.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List questions',
    description:
      'Returns questions with optional filters by section, category, exam, year, and text search.',
  })
  @ApiQuery({
    name: 'section_id',
    required: false,
    description: 'Filter by section slug for section-specific categories',
    schema: { type: 'string', example: 'mathematique' },
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filter by category ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({
    name: 'exam_id',
    required: false,
    description: 'Filter by exam ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by numeric exam year through the year block',
    schema: { type: 'number', example: 2024 },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search inside question text',
    schema: { type: 'string', example: 'capitale' },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    schema: { type: 'number', example: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of questions to return per page',
    schema: { type: 'number', example: 20, default: 20 },
  })
  @ApiResponse({
    status: 200,
    description: 'Questions returned successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            text: 'Le dialogue social aide surtout a :',
            options: ['A. Aggraver', 'B. Trouver des solutions'],
            correct_answer: 'B',
            category_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            exam_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            section_id: null,
            explanation: 'Il permet de trouver des solutions communes.',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
        },
      },
    },
  })
  async getAllQuestions(
    @Query('section_id') sectionId?: string,
    @Query('category_id') categoryId?: string,
    @Query('exam_id') examId?: string,
    @Query('year') year?: number,
    @Query('limit') limit: number = 20,
    @Query('page') page: number = 1,
    @Query('search') search?: string,
  ) {
    return this.questionsService.getAllQuestions(
      sectionId,
      categoryId,
      examId,
      year,
      Number(limit),
      Number(page),
      search,
    );
  }

  @Get('random')
  @ApiOperation({
    summary: 'Get random questions',
    description:
      'Returns a shuffled question subset, optionally filtered by subject or year.',
  })
  @ApiQuery({
    name: 'section_id',
    required: false,
    description: 'Filter random questions by section slug',
    schema: { type: 'string', example: 'mathematique' },
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filter random questions by category ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({
    name: 'exam_id',
    required: false,
    description: 'Filter random questions by exam ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter random questions by exam year',
    schema: { type: 'number', example: 2024 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of random questions to return',
    schema: { type: 'number', example: 7, default: 7 },
  })
  @ApiResponse({
    status: 200,
    description: 'Random questions returned successfully',
    type: QuestionResponseDto,
    isArray: true,
  })
  async getRandomQuestions(
    @Query('section_id') sectionId?: string,
    @Query('category_id') categoryId?: string,
    @Query('exam_id') examId?: string,
    @Query('year') year?: number,
    @Query('limit') limit: number = 7,
  ) {
    return this.questionsService.getRandomQuestions(
      sectionId,
      categoryId,
      examId,
      year,
      Number(limit),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a question by ID',
    description:
      'Returns one question with its year block and subject context.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Question returned successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionById(@Param('id') id: string) {
    return this.questionsService.getQuestionById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a question',
    description:
      'Creates a question linked to category/exam and applies universal-vs-section-specific rules from the category.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          example: 'Le dialogue social aide surtout a :',
        },
        options: {
          type: 'array',
          items: { type: 'string' },
        },
        correct_answer: {
          type: 'string',
          example: 'B',
        },
        category_id: {
          type: 'string',
          format: 'uuid',
        },
        exam_id: {
          type: 'string',
          format: 'uuid',
          nullable: true,
        },
        section_id: {
          type: 'string',
          nullable: true,
        },
        explanation: { type: 'string', example: 'Kinshasa est la capitale.' },
      },
      required: ['text', 'options', 'correct_answer', 'category_id'],
      example: {
        text: 'Le dialogue social aide surtout a :',
        options: ['A. Aggraver', 'B. Trouver des solutions'],
        correct_answer: 'B',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        exam_id: '550e8400-e29b-41d4-a716-446655440000',
        section_id: null,
        explanation: 'Le dialogue social cherche un compromis.',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.createQuestion(createQuestionDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create multiple questions',
    description:
      'Bulk creates questions and validates universal-vs-section-specific category rules for each row.',
  })
  @ApiBody({ type: CreateQuestionDto, isArray: true })
  @ApiResponse({
    status: 201,
    description: 'Questions created successfully',
    type: QuestionResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createBulkQuestions(@Body() createQuestionDtos: CreateQuestionDto[]) {
    return this.questionsService.createBulkQuestions(createQuestionDtos);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a question',
    description:
      'Updates an existing question with the same universal-vs-section-specific validation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(id, updateQuestionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a question',
    description: 'Deletes a single question.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
    schema: {
      example: {
        message: 'Question deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(@Param('id') id: string) {
    await this.questionsService.deleteQuestion(id);
    return { message: 'Question deleted successfully' };
  }
}
