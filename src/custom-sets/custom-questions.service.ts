import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CustomQuestion } from '../models/custom-question.model';
import { CustomQuestionSet } from '../models/custom-question-set.model';

@Injectable()
export class CustomQuestionsService {
  constructor(
    @InjectModel(CustomQuestion)
    private customQuestionModel: typeof CustomQuestion,
    @InjectModel(CustomQuestionSet)
    private customSetModel: typeof CustomQuestionSet,
  ) {}

  async getCustomSetQuestions(setId: string): Promise<CustomQuestion[]> {
    return this.customQuestionModel.findAll({
      where: { set_id: setId },
    });
  }

  async getCustomQuestionById(id: string): Promise<CustomQuestion> {
    const question = await this.customQuestionModel.findByPk(id);
    if (!question) {
      throw new NotFoundException('Question personnalisée introuvable');
    }
    return question;
  }

  async createCustomQuestion(
    userId: string,
    setId: string,
    data: {
      question_text: string;
      options: string[];
      correct_answer: string;
      explanation?: string | null;
    },
  ): Promise<CustomQuestion> {
    // Verify user owns the set
    const set = await this.customSetModel.findByPk(setId);
    if (!set || set.creator_id !== userId) {
      throw new ForbiddenException(
        "Vous ne pouvez ajouter des questions qu'à vos propres ensembles",
      );
    }

    return this.customQuestionModel.create({
      set_id: setId,
      question_text: data.question_text,
      options: data.options,
      correct_answer: data.correct_answer,
      explanation: data.explanation || null,
    });
  }

  async updateCustomQuestion(
    userId: string,
    setId: string,
    id: string,
    data: {
      question_text?: string;
      options?: string[];
      correct_answer?: string;
      explanation?: string | null;
    },
  ): Promise<CustomQuestion> {
    // Verify user owns the set
    const set = await this.customSetModel.findByPk(setId);
    if (!set || set.creator_id !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier des questions que dans vos propres ensembles',
      );
    }

    const question = await this.getCustomQuestionById(id);
    if (question.set_id !== setId) {
      throw new ForbiddenException(
        "Cette question n'appartient pas à cet ensemble",
      );
    }

    await question.update(data);
    return question;
  }

  async deleteCustomQuestion(
    userId: string,
    setId: string,
    id: string,
  ): Promise<void> {
    // Verify user owns the set
    const set = await this.customSetModel.findByPk(setId);
    if (!set || set.creator_id !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer des questions que de vos propres ensembles',
      );
    }

    const question = await this.getCustomQuestionById(id);
    if (question.set_id !== setId) {
      throw new ForbiddenException(
        "Cette question n'appartient pas à cet ensemble",
      );
    }

    await question.destroy();
  }
}
