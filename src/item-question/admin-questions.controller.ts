import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemQuestionService } from './item-question.service';
import { AdminCreateItemQuestionDto } from './dto/admin-create-item-question.dto';
import { UpdateItemQuestionDto } from './dto/update-item-question.dto';
import { ItemQuestionResponseDto } from './dto/item-question-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin')
export class AdminQuestionsController {
  constructor(private readonly itemQuestionService: ItemQuestionService) {}

  @Get('courses/:courseId/questions')
  @ApiOperation({ summary: 'List questions for a course (admin only)' })
  @ApiOkResponse({
    description: 'Questions returned successfully',
    type: [ItemQuestionResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.itemQuestionService.findByCourseId(courseId);
  }

  @Post('courses/:courseId/questions')
  @ApiOperation({ summary: 'Create a question for a course (admin only)' })
  @ApiBody({ type: AdminCreateItemQuestionDto })
  @ApiCreatedResponse({
    description: 'Question created successfully',
    type: ItemQuestionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  createForCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: AdminCreateItemQuestionDto,
  ) {
    return this.itemQuestionService.createForCourse(courseId, dto);
  }

  @Put('questions/:questionId')
  @ApiOperation({ summary: 'Update a question (admin only)' })
  @ApiBody({ type: UpdateItemQuestionDto })
  @ApiOkResponse({
    description: 'Question updated successfully',
    type: ItemQuestionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateItemQuestionDto,
  ) {
    return this.itemQuestionService.update(questionId, dto);
  }

  @Delete('questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question (admin only)' })
  @ApiNoContentResponse({ description: 'Question deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('questionId', ParseUUIDPipe) questionId: string) {
    await this.itemQuestionService.remove(questionId);
  }
}
