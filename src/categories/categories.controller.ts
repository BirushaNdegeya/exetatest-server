import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description:
      'Returns question categories. Use is_universal to filter universal vs section-specific categories.',
  })
  @ApiQuery({
    name: 'is_universal',
    required: false,
    description: 'Optional boolean filter',
    schema: { type: 'boolean', example: true },
  })
  @ApiResponse({
    status: 200,
    description: 'Categories returned successfully',
    type: CategoryResponseDto,
    isArray: true,
  })
  async getAllCategories(@Query('is_universal') isUniversal?: string) {
    const parsed =
      isUniversal === undefined ? undefined : isUniversal === 'true';
    return this.categoriesService.getAllCategories(parsed);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a category by ID',
    description: 'Returns one category and its question count.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Category returned successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Get(':id/question-count')
  @ApiOperation({
    summary: 'Get the total number of questions for a category',
    description: 'Counts questions linked to this category.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Question count returned successfully',
    schema: {
      example: {
        count: 120,
      },
    },
  })
  async getQuestionCount(@Param('id') id: string) {
    const count = await this.categoriesService.getQuestionCount(id);
    return { count };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a category',
    description: 'Creates a category.',
  })
  @ApiBody({
    type: CreateCategoryDto,
    description:
      'Provide the category name, universality flag, and optional description.',
    examples: {
      createCategory: {
        summary: 'Create Culture generale category',
        value: {
          name: 'Culture generale',
          is_universal: true,
          description: 'Questions communes',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates category fields.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Send the updated category fields.',
    examples: {
      updateCategory: {
        summary: 'Rename or change category scope',
        value: {
          name: 'Sciences',
          is_universal: false,
          description: 'Questions specifiques a chaque section',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Deletes a category and its linked questions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      example: {
        message: 'Category deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}
