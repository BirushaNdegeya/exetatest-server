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
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user-role.model';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'List subjects',
    description:
      'Returns subjects in the learning hierarchy. Use section_id to list only the subjects that belong to one section. Flow: section -> subject -> test year blocks -> questions.',
  })
  @ApiQuery({
    name: 'section_id',
    required: false,
    description:
      'Optional section ID to return only the subjects that belong to that section',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Subjects returned successfully',
    type: SubjectResponseDto,
    isArray: true,
  })
  async getAllSubjects(@Query('section_id') sectionId?: string) {
    return this.subjectsService.getAllSubjects(sectionId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a subject by ID',
    description:
      'Returns one subject with hierarchy metadata, including counts that help the admin understand how many test-year blocks and questions are attached.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Subject returned successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getSubjectById(@Param('id') id: string) {
    return this.subjectsService.getSubjectById(id);
  }

  @Get(':id/question-count')
  @ApiOperation({
    summary: 'Get the total number of questions for a subject',
    description:
      'Counts questions across every test-year block that belongs to the subject.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject identifier',
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
    const count = await this.subjectsService.getQuestionCount(id);
    return { count };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a subject',
    description:
      'Creates a subject under an existing section. After creation, that subject becomes the parent of its test-year blocks, and each test-year block becomes the parent of its questions.',
  })
  @ApiBody({
    type: CreateSubjectDto,
    description:
      'Provide the subject name, an optional description, and the parent section_id.',
    examples: {
      createSubject: {
        summary: 'Create Culture Generale under a section',
        value: {
          name: 'Culture Generale',
          description: 'Gerer les questions par categorie et par annee',
          section_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.createSubject(createSubjectDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a subject',
    description:
      'Updates the editable subject fields. A subject remains linked to a section and continues to own its test-year blocks and questions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({
    type: CreateSubjectDto,
    description:
      'Send the updated subject name, optional description, and section_id.',
    examples: {
      updateSubject: {
        summary: 'Move or rename a subject',
        value: {
          name: 'Culture Generale',
          description: 'Questions classees par section, sujet et annee',
          section_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: CreateSubjectDto,
  ) {
    return this.subjectsService.updateSubject(id, updateSubjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a subject',
    description:
      'Deletes a subject and cleans up every test-year block and question attached to it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Subject deleted successfully',
    schema: {
      example: {
        message: 'Subject deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async deleteSubject(@Param('id') id: string) {
    await this.subjectsService.deleteSubject(id);
    return { message: 'Subject deleted successfully' };
  }
}
