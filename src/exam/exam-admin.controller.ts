import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
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
import { CreateLanguagePassageDto } from './dto/create-language-passage.dto';
import { CreateLanguageQuestionDto } from './dto/create-language-question.dto';
import { ExamAdminService } from './exam-admin.service';

@ApiTags('Admin/Language')
@Controller('admin/language')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExamAdminController {
  constructor(private readonly adminService: ExamAdminService) {}

  @Post('passages')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a language passage (FR/EN)' })
  @ApiBody({ type: CreateLanguagePassageDto })
  @ApiResponse({ status: 201, description: 'Passage created' })
  async createPassage(@Body() dto: CreateLanguagePassageDto) {
    const created = await this.adminService.createPassage(dto);
    return { data: created, message: 'Passage created' };
  }

  @Post('passages/:id/questions')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a question for a passage' })
  @ApiParam({ name: 'id', description: 'Passage id (uuid)' })
  @ApiBody({ type: CreateLanguageQuestionDto })
  @ApiResponse({ status: 201, description: 'Question created' })
  async createQuestion(
    @Param('id') id: string,
    @Body() dto: CreateLanguageQuestionDto,
  ) {
    const created = await this.adminService.createQuestion(id, dto);
    return { data: created, message: 'Question created' };
  }

  @Post('passages/:id/questions/bulk')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Bulk create questions for a passage' })
  @ApiParam({ name: 'id', description: 'Passage id (uuid)' })
  @ApiBody({ type: CreateLanguageQuestionDto, isArray: true })
  @ApiResponse({ status: 201, description: 'Questions created' })
  @HttpCode(201)
  async createBulkQuestions(
    @Param('id') id: string,
    @Body() dtos: CreateLanguageQuestionDto[],
  ) {
    const created = await this.adminService.createBulkQuestions(id, dtos);
    return { data: created, message: 'Questions created' };
  }
}
