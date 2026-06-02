import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Exam } from '../models/exam.model';
import { Question } from '../models/question.model';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam)
    private readonly examModel: typeof Exam,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
  ) {}

  async getAllExams(): Promise<Array<Exam & { question_count?: number }>> {
    const exams = await this.examModel.findAll({
      order: [['year', 'DESC']],
    });

    return Promise.all(
      exams.map(async (exam) => {
        const question_count = await this.questionModel.count({
          where: { exam_id: exam.id },
        });
        return {
          ...exam.toJSON(),
          question_count,
        } as Exam & { question_count?: number };
      }),
    );
  }

  async getExamById(id: string): Promise<Exam> {
    const exam = await this.examModel.findByPk(id);
    if (!exam) {
      throw new NotFoundException('Examen introuvable');
    }
    return exam;
  }

  async createExam(year: number): Promise<Exam> {
    year = Number(year);
    this.validateYear(year);
    await this.ensureUniqueYear(year);

    return this.examModel.create({ year });
  }

  async updateExam(id: string, year: number): Promise<Exam> {
    year = Number(year);
    this.validateYear(year);

    const exam = await this.getExamById(id);
    await this.ensureUniqueYear(year, exam.id);

    await exam.update({ year });
    return exam;
  }

  async deleteExam(id: string): Promise<void> {
    const exam = await this.getExamById(id);

    await this.questionModel.update(
      { exam_id: null },
      {
        where: { exam_id: exam.id },
      },
    );

    await exam.destroy();
  }

  private async ensureUniqueYear(
    year: number,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.examModel.findOne({
      where: { year },
    });

    if (duplicate && duplicate.id !== excludeId) {
      throw new ConflictException("Cette annee d'examen existe deja");
    }
  }

  private validateYear(year: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw new BadRequestException(
        "L'annee doit etre un entier compris entre 1900 et 3000",
      );
    }
  }
}
