import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamResponseDto } from './dto/exam-response.dto';
import { ExamsService } from './exams.service';

@ApiTags('Exams')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({
    summary: 'List exams',
    description: 'Returns global exam years used by questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exams returned successfully',
    type: ExamResponseDto,
    isArray: true,
  })
  async getExams() {
    return this.examsService.getAllExams();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create exam',
    description: 'Creates a global exam year. The year must be unique.',
  })
  @ApiBody({ type: CreateExamDto })
  @ApiResponse({
    status: 201,
    description: 'Exam created successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'An exam year with the same value already exists',
  })
  async createExam(@Body() createExamDto: CreateExamDto) {
    return this.examsService.createExam(createExamDto.year);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update exam',
    description: 'Updates the numeric year for an exam.',
  })
  @ApiParam({
    name: 'id',
    description: 'Exam identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: UpdateExamDto })
  @ApiResponse({
    status: 200,
    description: 'Exam updated successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Year is required and must be a valid integer',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({
    status: 409,
    description: 'An exam year with the same value already exists',
  })
  async updateExam(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    if (updateExamDto.year === undefined) {
      throw new BadRequestException('year is required');
    }
    return this.examsService.updateExam(id, updateExamDto.year);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete exam',
    description:
      'Deletes an exam year and unbinds exam_id from linked questions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Exam identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Exam year deleted successfully',
    schema: {
      example: {
        message: 'Exam year deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async deleteExam(@Param('id') id: string) {
    await this.examsService.deleteExam(id);
    return { message: 'Exam year deleted successfully' };
  }
}
