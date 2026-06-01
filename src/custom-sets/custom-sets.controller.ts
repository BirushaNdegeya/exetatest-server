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
import { CustomSetsService } from './custom-sets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCustomSetDto } from './dto/create-custom-set.dto';
import { CustomQuestionsService } from './custom-questions.service';
import { CreateCustomQuestionDto } from './dto/create-custom-question.dto';

@Controller()
export class CustomSetsController {
  constructor(
    private readonly customSetsService: CustomSetsService,
    private readonly customQuestionsService: CustomQuestionsService,
  ) {}

  @Get('custom-sets')
  @UseGuards(JwtAuthGuard)
  async getUserCustomSets(@CurrentUser() user: any) {
    return this.customSetsService.getUserCustomSets(user.id);
  }

  @Get('custom-sets/:id')
  @UseGuards(JwtAuthGuard)
  async getCustomSetById(@Param('id') id: string) {
    return this.customSetsService.getCustomSetById(id);
  }

  @Post('custom-sets')
  @UseGuards(JwtAuthGuard)
  async createCustomSet(
    @CurrentUser() user: any,
    @Body() createCustomSetDto: CreateCustomSetDto,
  ) {
    return this.customSetsService.createCustomSet(user.id, createCustomSetDto);
  }

  @Patch('custom-sets/:id')
  @UseGuards(JwtAuthGuard)
  async updateCustomSet(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCustomSetDto: CreateCustomSetDto,
  ) {
    return this.customSetsService.updateCustomSet(
      user.id,
      id,
      updateCustomSetDto,
    );
  }

  @Delete('custom-sets/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCustomSet(@CurrentUser() user: any, @Param('id') id: string) {
    await this.customSetsService.deleteCustomSet(user.id, id);
    return { message: 'Custom set deleted successfully' };
  }

  @Get('custom-sets/:setId/questions')
  @UseGuards(JwtAuthGuard)
  async getCustomSetQuestions(@Param('setId') setId: string) {
    return this.customQuestionsService.getCustomSetQuestions(setId);
  }

  @Post('custom-sets/:setId/questions')
  @UseGuards(JwtAuthGuard)
  async createCustomQuestion(
    @CurrentUser() user: any,
    @Param('setId') setId: string,
    @Body() createCustomQuestionDto: CreateCustomQuestionDto,
  ) {
    return this.customQuestionsService.createCustomQuestion(
      user.id,
      setId,
      createCustomQuestionDto,
    );
  }

  @Patch('custom-sets/:setId/questions/:id')
  @UseGuards(JwtAuthGuard)
  async updateCustomQuestion(
    @CurrentUser() user: any,
    @Param('setId') setId: string,
    @Param('id') id: string,
    @Body() updateCustomQuestionDto: CreateCustomQuestionDto,
  ) {
    return this.customQuestionsService.updateCustomQuestion(
      user.id,
      setId,
      id,
      updateCustomQuestionDto,
    );
  }

  @Delete('custom-sets/:setId/questions/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCustomQuestion(
    @CurrentUser() user: any,
    @Param('setId') setId: string,
    @Param('id') id: string,
  ) {
    await this.customQuestionsService.deleteCustomQuestion(user.id, setId, id);
    return { message: 'Custom question deleted successfully' };
  }
}
