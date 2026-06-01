import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
import { SectionsService } from './sections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user-role.model';
import { CreateSectionDto } from './dto/create-section.dto';

@ApiTags('sections')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List sections',
    description:
      'Returns the top level of the hierarchy. Each section contains subjects, each subject contains test-year blocks, and each test-year block contains questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all sections',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Mathematics' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getAllSections() {
    return this.sectionsService.getAllSections();
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get section count',
    description: 'Returns how many top-level sections exist in the hierarchy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns total number of sections',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 12 },
      },
    },
  })
  async getSectionCount() {
    return { count: await this.sectionsService.getSectionCount() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a section',
    description:
      'Creates a top-level section that can later contain multiple subjects.',
  })
  @ApiBody({ type: CreateSectionDto })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Mathematics' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createSection(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.createSection(createSectionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a section',
    description:
      'Updates the name of a top-level section that groups subjects.',
  })
  @ApiParam({
    name: 'id',
    description: 'Section ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: CreateSectionDto })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Mathematics' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async updateSection(
    @Param('id') id: string,
    @Body() updateSectionDto: CreateSectionDto,
  ) {
    return this.sectionsService.updateSection(id, updateSectionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a section',
    description:
      'Deletes a top-level section. Any dependent subject hierarchy rules are handled by the service layer and database constraints.',
  })
  @ApiParam({
    name: 'id',
    description: 'Section ID',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Section deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Section deleted successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async deleteSection(@Param('id') id: string) {
    await this.sectionsService.deleteSection(id);
    return { message: 'Section deleted successfully' };
  }
}
