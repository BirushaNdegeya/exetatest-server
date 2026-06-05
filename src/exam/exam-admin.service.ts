import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LanguagePassage } from '../models/language-passage.model';
import { LanguageQuestion } from '../models/language-question.model';
import { CreateLanguagePassageDto } from './dto/create-language-passage.dto';
import { CreateLanguageQuestionDto } from './dto/create-language-question.dto';

@Injectable()
export class ExamAdminService {
  constructor(
    @InjectModel(LanguagePassage)
    private readonly languagePassageModel: typeof LanguagePassage,
    @InjectModel(LanguageQuestion)
    private readonly languageQuestionModel: typeof LanguageQuestion,
  ) {}

  async createPassage(dto: CreateLanguagePassageDto) {
    const reading = dto.reading_time_minutes ?? 3;
    const created = await this.languagePassageModel.create({
      title: dto.title ?? null,
      content: dto.content,
      reading_time_minutes: reading,
      language: dto.language,
    } as any);

    return created;
  }

  async createQuestion(passageId: string, dto: CreateLanguageQuestionDto) {
    const created = await this.languageQuestionModel.create({
      passage_id: passageId,
      text: dto.text,
      options: dto.options,
      correct_answer: dto.correct_answer,
      explanation: dto.explanation ?? null,
    } as any);

    return created;
  }

  async createBulkQuestions(
    passageId: string,
    dtos: CreateLanguageQuestionDto[],
  ) {
    const rows = dtos.map((dto) => ({
      passage_id: passageId,
      text: dto.text,
      options: dto.options,
      correct_answer: dto.correct_answer,
      explanation: dto.explanation ?? null,
    }));

    const created = await this.languageQuestionModel.bulkCreate(rows as any[]);
    return created;
  }
}
