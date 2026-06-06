import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { Category } from '../models/category.model';
import { Exam } from '../models/exam.model';
import { LanguagePassage } from '../models/language-passage.model';
import { LanguageQuestion } from '../models/language-question.model';
import { Question } from '../models/question.model';
import { UsersService } from '../users/users.service';
import {
  EXAM_CATEGORY_CODE_LABELS,
  EXAM_CATEGORY_DEFAULT_LIMITS,
  EXAM_CATEGORY_NAME_FRAGMENTS,
  ExamCategoryCode,
} from './exam-category.constants';
import {
  ExamLimitParam,
  EXAM_LIMIT_ALL,
  resolveExamLimit,
} from './dto/exam-limit.util';
import {
  RandomExamPassageBlockDto,
  RandomExamQuestionDto,
  RandomExamResponseDto,
} from './dto/random-exam-response.dto';

interface RandomExamOptions {
  limit?: ExamLimitParam;
  year?: number;
  examId?: string;
}

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(LanguagePassage)
    private readonly languagePassageModel: typeof LanguagePassage,
    @InjectModel(LanguageQuestion)
    private readonly languageQuestionModel: typeof LanguageQuestion,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly usersService: UsersService,
  ) {}

  async getRandomExam(
    userId: string,
    categoryCode: ExamCategoryCode,
    options: RandomExamOptions = {},
  ): Promise<RandomExamResponseDto> {
    const category = await this.resolveCategory(categoryCode);
    const sectionId = await this.resolveSectionId(userId, category);

    if (categoryCode === 'la') {
      return this.getRandomLanguesExam(category, sectionId);
    }

    const limit = resolveExamLimit(
      categoryCode,
      options.limit,
      EXAM_CATEGORY_DEFAULT_LIMITS,
    );
    const questions = await this.fetchRandomStandardQuestions(
      category,
      sectionId,
      limit,
      options.year,
      options.examId,
    );

    if (questions.length === 0) {
      throw new NotFoundException(
        'Aucune question disponible pour cette categorie et cette section',
      );
    }

    return {
      category: categoryCode,
      category_name: category.name,
      is_universal: category.is_universal,
      section_id: category.is_universal ? null : sectionId,
      questions: questions.map((question) => this.toQuestionDto(question)),
    };
  }

  private async getRandomLanguesExam(
    category: Category,
    sectionId: string | null,
  ): Promise<RandomExamResponseDto> {
    const fromPassageTables = await this.tryLanguesFromPassageTables();
    if (fromPassageTables) {
      return {
        category: 'la',
        category_name: category.name,
        is_universal: category.is_universal,
        section_id: sectionId,
        questions: [],
        french: fromPassageTables.french,
        english: fromPassageTables.english,
      };
    }

    const fromQuestions = await this.tryLanguesFromQuestionPassages(category);
    if (fromQuestions) {
      return {
        category: 'la',
        category_name: category.name,
        is_universal: category.is_universal,
        section_id: sectionId,
        questions: [],
        french: fromQuestions.french,
        english: fromQuestions.english,
      };
    }

    throw new NotFoundException(
      'Aucun passage de langues disponible pour le moment',
    );
  }

  private async tryLanguesFromPassageTables(): Promise<{
    french: RandomExamPassageBlockDto;
    english: RandomExamPassageBlockDto;
  } | null> {
    const passageCount = await this.languagePassageModel.count();
    if (passageCount === 0) {
      return null;
    }

    const [frenchPassage, englishPassage] = await Promise.all([
      this.pickRandomLanguagePassage('french'),
      this.pickRandomLanguagePassage('english'),
    ]);

    if (!frenchPassage || !englishPassage) {
      return null;
    }

    return {
      french: this.toPassageBlock(frenchPassage, 'Passage Français'),
      english: this.toPassageBlock(englishPassage, 'Passage Anglais'),
    };
  }

  private async tryLanguesFromQuestionPassages(category: Category): Promise<{
    french: RandomExamPassageBlockDto;
    english: RandomExamPassageBlockDto;
  } | null> {
    const baseWhere: Record<string, unknown> = {
      category_id: category.id,
      passage_group: { [Op.ne]: null },
    };
    if (category.is_universal) {
      baseWhere.section_id = null;
    }

    const frenchGroup = await this.pickRandomPassageGroup({
      ...baseWhere,
      language: { [Op.iLike]: '%francais%' },
    });
    const englishGroup = await this.pickRandomPassageGroup({
      ...baseWhere,
      language: { [Op.iLike]: '%anglais%' },
    });

    if (!frenchGroup || !englishGroup) {
      return null;
    }

    const [frenchQuestions, englishQuestions] = await Promise.all([
      this.questionModel.findAll({
        where: { ...baseWhere, passage_group: frenchGroup },
        order: this.sequelize.literal('RANDOM()'),
      }),
      this.questionModel.findAll({
        where: { ...baseWhere, passage_group: englishGroup },
        order: this.sequelize.literal('RANDOM()'),
      }),
    ]);

    if (frenchQuestions.length === 0 || englishQuestions.length === 0) {
      return null;
    }

    const frenchPassageText = frenchQuestions[0].passage ?? '';
    const englishPassageText = englishQuestions[0].passage ?? '';

    return {
      french: {
        title: 'Passage Français',
        content: frenchPassageText,
        reading_time_minutes: 3,
        questions: frenchQuestions.map((question) =>
          this.toQuestionDto(question),
        ),
      },
      english: {
        title: 'Passage Anglais',
        content: englishPassageText,
        reading_time_minutes: 3,
        questions: englishQuestions.map((question) =>
          this.toQuestionDto(question),
        ),
      },
    };
  }

  private async pickRandomLanguagePassage(
    language: 'french' | 'english',
  ): Promise<LanguagePassage | null> {
    return this.languagePassageModel.findOne({
      where: { language },
      include: [LanguageQuestion],
      order: this.sequelize.literal('RANDOM()'),
    });
  }

  private async pickRandomPassageGroup(
    where: Record<string, unknown>,
  ): Promise<string | null> {
    const rows = await this.questionModel.findAll({
      attributes: [
        [
          this.sequelize.fn('DISTINCT', this.sequelize.col('passage_group')),
          'passage_group',
        ],
      ],
      where,
      raw: true,
    });

    const groups = (rows as Array<{ passage_group: string | null }>)
      .map((row) => row.passage_group)
      .filter((value): value is string => Boolean(value));

    if (groups.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * groups.length);
    return groups[index];
  }

  private toPassageBlock(
    passage: LanguagePassage,
    fallbackTitle: string,
  ): RandomExamPassageBlockDto {
    const questions = (passage.questions ?? []).map((question) =>
      this.toLanguageQuestionDto(question),
    );

    return {
      title: passage.title || fallbackTitle,
      content: passage.content,
      reading_time_minutes: passage.reading_time_minutes,
      questions,
    };
  }

  private async fetchRandomStandardQuestions(
    category: Category,
    sectionId: string | null,
    limit: ExamLimitParam,
    year?: number,
    examId?: string,
  ): Promise<Question[]> {
    const where: Record<string, unknown> = { category_id: category.id };

    if (category.is_universal) {
      where.section_id = null;
    } else if (sectionId) {
      where.section_id = sectionId;
    }

    if (examId) {
      where.exam_id = examId;
    }

    const include: Array<{
      model: typeof Exam;
      required?: boolean;
      where?: { year: number };
    }> = [{ model: Exam, required: false }];

    if (year) {
      include[0].required = true;
      include[0].where = { year: Number(year) };
    }

    return this.questionModel.findAll({
      where,
      include,
      order: this.sequelize.literal('RANDOM()'),
      ...(limit !== EXAM_LIMIT_ALL ? { limit } : {}),
    });
  }

  private async resolveSectionId(
    userId: string,
    category: Category,
  ): Promise<string | null> {
    if (category.is_universal) {
      return null;
    }

    const profile = await this.usersService.getProfileByUserId(userId);
    if (!profile.section_id) {
      throw new BadRequestException(
        'section_id est requis pour cette categorie. Mettez a jour le profil avec PATCH /users/me/profile.',
      );
    }

    return profile.section_id;
  }

  private async resolveCategory(code: ExamCategoryCode): Promise<Category> {
    const categories = await this.categoryModel.findAll();
    const normalizedName = (value: string): string =>
      value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();

    const matchesFragment = (name: string, fragment: string): boolean =>
      normalizedName(name).includes(normalizedName(fragment));

    const matched = categories.find((category) => {
      const name = category.name;
      const fragments = EXAM_CATEGORY_NAME_FRAGMENTS[code];

      if (code === 'jo') {
        const hasJo = fragments.some((fragment) =>
          matchesFragment(name, fragment),
        );
        if (!hasJo) {
          return false;
        }
        const normalized = normalizedName(name);
        return (
          !normalized.includes('francais') && !normalized.includes('anglais')
        );
      }

      return fragments.some((fragment) => matchesFragment(name, fragment));
    });

    if (!matched) {
      throw new NotFoundException(
        `Categorie introuvable pour le code "${code}" (${EXAM_CATEGORY_CODE_LABELS[code]}). Demandez a un admin de creer la categorie.`,
      );
    }

    return matched;
  }

  private toQuestionDto(question: Question): RandomExamQuestionDto {
    return {
      id: question.id,
      text: question.text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation ?? null,
      passage: question.passage ?? null,
      passage_group: question.passage_group ?? null,
      language: question.language ?? null,
    };
  }

  private toLanguageQuestionDto(
    question: LanguageQuestion,
  ): RandomExamQuestionDto {
    return {
      id: question.id,
      text: question.text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation ?? null,
      passage: null,
      passage_group: null,
      language: null,
    };
  }
}
