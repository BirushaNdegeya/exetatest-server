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
import { UserRoleEnum } from '../models/user-role.model';
import { CreateTestYearDto } from './dto/create-test-year.dto';
import { UpdateTestYearDto } from './dto/update-test-year.dto';
import { TestYearsService } from './test-years.service';
import { TestYearResponseDto } from './dto/test-year-response.dto';

@ApiTags('Test Years')
@Controller()
export class TestYearsController {
  constructor(private readonly testYearsService: TestYearsService) {}

  @Get('subjects/:subjectId/years')
  @ApiOperation({
    summary: 'List year blocks for a subject',
    description:
      'Returns the test-year blocks that belong to one subject. This is the next level after subject in the hierarchy: section -> subject -> test year blocks -> questions.',
  })
  @ApiParam({
    name: 'subjectId',
    description: 'Subject identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Year blocks returned successfully',
    type: TestYearResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getYearsBySubject(@Param('subjectId') subjectId: string) {
    return this.testYearsService.getYearsBySubject(subjectId);
  }

  @Post('subjects/:subjectId/years')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a year block under a subject',
    description:
      'Creates a new test-year block under a subject. The year must be unique within that subject, and the new block becomes the parent of its questions.',
  })
  @ApiParam({
    name: 'subjectId',
    description: 'Subject identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: CreateTestYearDto })
  @ApiResponse({
    status: 201,
    description: 'Year block created successfully',
    type: TestYearResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({
    status: 409,
    description:
      'A year block with the same year already exists for this subject',
  })
  async createYear(
    @Param('subjectId') subjectId: string,
    @Body() createTestYearDto: CreateTestYearDto,
  ) {
    return this.testYearsService.createYear(subjectId, createTestYearDto.year);
  }

  @Put('years/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Rename a year block',
    description:
      'Updates the numeric year label for an existing test-year block under its subject.',
  })
  @ApiParam({
    name: 'id',
    description: 'Year block identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: UpdateTestYearDto })
  @ApiResponse({
    status: 200,
    description: 'Year block updated successfully',
    type: TestYearResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Year is required and must be a valid integer',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Year block not found' })
  @ApiResponse({
    status: 409,
    description:
      'A year block with the same year already exists for this subject',
  })
  async updateYear(
    @Param('id') id: string,
    @Body() updateTestYearDto: UpdateTestYearDto,
  ) {
    if (updateTestYearDto.year === undefined) {
      throw new BadRequestException('year is required');
    }
    return this.testYearsService.updateYear(id, updateTestYearDto.year);
  }

  @Delete('years/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a year block',
    description:
      'Deletes a test-year block and all questions that belong to it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Year block identifier',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Year block deleted successfully',
    schema: {
      example: {
        message: 'Year block deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Year block not found' })
  async deleteYear(@Param('id') id: string) {
    await this.testYearsService.deleteYear(id);
    return { message: 'Year block deleted successfully' };
  }
}
