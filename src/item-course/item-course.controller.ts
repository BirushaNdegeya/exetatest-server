import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemCourseService } from './item-course.service';
import { CreateItemCourseDto } from './dto/create-item-course.dto';
import { UpdateItemCourseDto } from './dto/update-item-course.dto';
import { ItemCourseResponseDto } from './dto/item-course-response.dto';
import { ItemCourseQueryDto } from './dto/item-course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('item-courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('item-courses')
export class ItemCourseController {
  constructor(private readonly itemCourseService: ItemCourseService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Create an item course (admin only)',
    description:
      'Creates a course block (e.g. chimie, math) linked to a quiz item. Requires admin role.',
  })
  @ApiBody({ type: CreateItemCourseDto })
  @ApiCreatedResponse({
    description: 'Item course created successfully',
    type: ItemCourseResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() createItemCourseDto: CreateItemCourseDto) {
    return this.itemCourseService.create(createItemCourseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List item courses',
    description:
      'Returns paginated course blocks. Optional filters: item_id, course.',
  })
  @ApiOkResponse({
    description: 'Item courses returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemCourseResponseDto' },
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(@Query() query: ItemCourseQueryDto) {
    return this.itemCourseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one item course by id' })
  @ApiOkResponse({
    description: 'Item course returned successfully',
    type: ItemCourseResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemCourseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Update an item course (admin only)',
    description: 'Partial update. Send only fields to change.',
  })
  @ApiBody({ type: UpdateItemCourseDto })
  @ApiOkResponse({
    description: 'Item course updated successfully',
    type: ItemCourseResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemCourseDto: UpdateItemCourseDto,
  ) {
    return this.itemCourseService.update(id, updateItemCourseDto);
  }
}
