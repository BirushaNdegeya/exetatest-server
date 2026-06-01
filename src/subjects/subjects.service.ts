import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRC_SECTIONS } from '../sections/drc-sections.constants';
import { InjectModel } from '@nestjs/sequelize';
import { Subject } from '../models/subject.model';
import { Question } from '../models/question.model';
import { TestYear } from '../models/test-year.model';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject)
    private subjectModel: typeof Subject,
    @InjectModel(TestYear)
    private testYearModel: typeof TestYear,
  ) {}

  async getAllSubjects(
    sectionId?: string,
  ): Promise<
    Array<Subject & { year_count?: number; question_count?: number }>
  > {
    const where = sectionId ? { section_id: sectionId } : {};
    const subjects = await this.subjectModel.findAll({
      where,
      include: [TestYear],
      order: [['createdAt', 'DESC']],
    });

    return Promise.all(
      subjects.map(async (subject) => {
        const year_count = subject.testYears?.length ?? 0;
        const question_count = await this.getQuestionCount(subject.id);
        return {
          ...subject.toJSON(),
          year_count,
          question_count,
        } as Subject & { year_count?: number; question_count?: number };
      }),
    );
  }

  async getSubjectById(
    id: string,
  ): Promise<Subject & { year_count?: number; question_count?: number }> {
    const subject = await this.findSubjectEntityById(id);

    const year_count = subject.testYears?.length ?? 0;
    const question_count = await this.getQuestionCount(subject.id);
    return {
      ...subject.toJSON(),
      year_count,
      question_count,
    } as Subject & { year_count?: number; question_count?: number };
  }

  async getQuestionCount(subjectId: string): Promise<number> {
    return Question.count({
      include: [
        {
          model: TestYear,
          where: { subject_id: subjectId },
          attributes: [],
        },
      ],
    });
  }

  async createSubject(data: {
    name: string;
    description?: string | null;
    section_id: string;
    branch_type: string;
  }): Promise<Subject> {
    this.assertValidSectionId(data.section_id);
    return this.subjectModel.create(data);
  }

  async updateSubject(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      section_id?: string;
      branch_type?: string;
    },
  ): Promise<Subject> {
    const subject = await this.findSubjectEntityById(id);
    if (data.section_id !== undefined) {
      this.assertValidSectionId(data.section_id);
    }
    await subject.update(data);
    return subject;
  }

  async deleteSubject(id: string): Promise<void> {
    const subject = await this.findSubjectEntityById(id);
    const testYears = await this.testYearModel.findAll({
      where: { subject_id: id },
      include: [Question],
    });

    for (const testYear of testYears) {
      await Question.destroy({
        where: { test_year_id: testYear.id },
      });
      await testYear.destroy();
    }

    await subject.destroy();
  }

  private assertValidSectionId(sectionId: string): void {
    if (!DRC_SECTIONS.some((section) => section.id === sectionId)) {
      throw new BadRequestException('Section introuvable.');
    }
  }

  private async findSubjectEntityById(id: string): Promise<Subject> {
    const subject = await this.subjectModel.findByPk(id, {
      include: [TestYear],
    });

    if (!subject) {
      throw new NotFoundException('Matière introuvable');
    }

    return subject;
  }
}
