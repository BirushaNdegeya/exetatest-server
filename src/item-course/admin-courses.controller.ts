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
import { ItemCourseService } from './item-course.service';
import { AdminCreateItemCourseDto } from './dto/admin-create-item-course.dto';
import { AdminUpdateItemCourseDto } from './dto/admin-update-item-course.dto';
import { ItemCourseResponseDto } from './dto/item-course-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin')
export class AdminCoursesController {
  constructor(private readonly itemCourseService: ItemCourseService) {}

  @Get('items/:itemId/courses')
  @ApiOperation({ summary: 'List courses for an item (admin only)' })
  @ApiOkResponse({
    description: 'Courses returned successfully',
    type: [ItemCourseResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  findByItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.itemCourseService.findByItemId(itemId);
  }

  @Post('items/:itemId/courses')
  @ApiOperation({ summary: 'Create a course for an item (admin only)' })
  @ApiBody({ type: AdminCreateItemCourseDto })
  @ApiCreatedResponse({
    description: 'Course created successfully',
    type: ItemCourseResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  createForItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: AdminCreateItemCourseDto,
  ) {
    return this.itemCourseService.createForItem(itemId, dto);
  }

  @Get('courses/:courseId')
  @ApiOperation({
    summary: 'Get a course with its questions (admin only)',
  })
  @ApiOkResponse({ description: 'Course returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  findOne(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.itemCourseService.findOneWithQuestions(courseId);
  }

  @Put('courses/:courseId')
  @ApiOperation({ summary: 'Update a course (admin only)' })
  @ApiBody({ type: AdminUpdateItemCourseDto })
  @ApiOkResponse({
    description: 'Course updated successfully',
    type: ItemCourseResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: AdminUpdateItemCourseDto,
  ) {
    return this.itemCourseService.updateAdmin(courseId, dto);
  }

  @Delete('courses/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a course and its questions (admin only)',
  })
  @ApiNoContentResponse({ description: 'Course deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('courseId', ParseUUIDPipe) courseId: string) {
    await this.itemCourseService.remove(courseId);
  }
}
