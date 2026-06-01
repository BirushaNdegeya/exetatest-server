import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subject } from '../models/subject.model';
import { TestYear } from '../models/test-year.model';
import { Question } from '../models/question.model';

@Injectable()
export class TestYearsService {
  constructor(
    @InjectModel(TestYear)
    private readonly testYearModel: typeof TestYear,
    @InjectModel(Subject)
    private readonly subjectModel: typeof Subject,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
  ) {}

  async getYearsBySubject(
    subjectId: string,
  ): Promise<Array<TestYear & { question_count?: number }>> {
    await this.ensureSubjectExists(subjectId);

    const years = await this.testYearModel.findAll({
      where: { subject_id: subjectId },
      include: [Question],
      order: [['year', 'DESC']],
    });

    return years.map((year) => {
      const question_count = year.questions?.length ?? 0;
      return {
        ...year.toJSON(),
        question_count,
      } as TestYear & { question_count?: number };
    });
  }

  async getYearById(id: string): Promise<TestYear> {
    const year = await this.testYearModel.findByPk(id, {
      include: [Subject],
    });

    if (!year) {
      throw new NotFoundException('Bloc année introuvable');
    }

    return year;
  }

  async createYear(subjectId: string, year: number): Promise<TestYear> {
    year = Number(year);
    await this.ensureSubjectExists(subjectId);
    this.validateYear(year);
    await this.ensureUniqueYear(subjectId, year);

    return this.testYearModel.create({
      year,
      subject_id: subjectId,
    });
  }

  async updateYear(id: string, year: number): Promise<TestYear> {
    year = Number(year);
    this.validateYear(year);

    const testYear = await this.getYearById(id);
    await this.ensureUniqueYear(testYear.subject_id, year, testYear.id);

    await testYear.update({ year });
    return testYear;
  }

  async deleteYear(id: string): Promise<void> {
    const testYear = await this.getYearById(id);

    await this.questionModel.destroy({
      where: { test_year_id: testYear.id },
    });

    await testYear.destroy();
  }

  private async ensureSubjectExists(subjectId: string): Promise<void> {
    const subject = await this.subjectModel.findByPk(subjectId);

    if (!subject) {
      throw new NotFoundException('Matière introuvable');
    }
  }

  private async ensureUniqueYear(
    subjectId: string,
    year: number,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.testYearModel.findOne({
      where: {
        subject_id: subjectId,
        year,
      },
    });

    if (duplicate && duplicate.id !== excludeId) {
      throw new ConflictException('Cette année existe deja pour cette matière');
    }
  }

  private validateYear(year: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw new BadRequestException(
        "L'année doit être un entier compris entre 1900 et 3000",
      );
    }
  }
}
