import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CustomQuestionSet } from '../models/custom-question-set.model';
import { CustomQuestion } from '../models/custom-question.model';
import { User } from '../models/user.model';

@Injectable()
export class CustomSetsService {
  constructor(
    @InjectModel(CustomQuestionSet)
    private customSetModel: typeof CustomQuestionSet,
    @InjectModel(CustomQuestion)
    private customQuestionModel: typeof CustomQuestion,
  ) {}

  async getUserCustomSets(userId: string): Promise<CustomQuestionSet[]> {
    return this.customSetModel.findAll({
      where: { creator_id: userId },
      include: [CustomQuestion],
    });
  }

  async getUserCustomSetCount(userId: string): Promise<number> {
    return this.customSetModel.count({
      where: { creator_id: userId },
    });
  }

  async getCustomSetById(id: string): Promise<CustomQuestionSet> {
    const set = await this.customSetModel.findByPk(id, {
      include: [CustomQuestion, User],
    });
    if (!set) {
      throw new NotFoundException('Ensemble personnalisé introuvable');
    }
    return set;
  }

  async createCustomSet(
    userId: string,
    data: {
      title: string;
      description?: string | null;
    },
  ): Promise<CustomQuestionSet> {
    return this.customSetModel.create({
      creator_id: userId,
      title: data.title,
      description: data.description || null,
    });
  }

  async updateCustomSet(
    userId: string,
    id: string,
    data: {
      title?: string;
      description?: string | null;
    },
  ): Promise<CustomQuestionSet> {
    const set = await this.getCustomSetById(id);
    if (set.creator_id !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres ensembles',
      );
    }
    await set.update(data);
    return set;
  }

  async deleteCustomSet(userId: string, id: string): Promise<void> {
    const set = await this.getCustomSetById(id);
    if (set.creator_id !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres ensembles',
      );
    }
    await set.destroy();
  }

  async getCustomSetQuestionCount(id: string): Promise<number> {
    return this.customQuestionModel.count({
      where: { set_id: id },
    });
  }
}
