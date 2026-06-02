import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../models/category.model';
import { Question } from '../models/question.model';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
  ) {}

  async getAllCategories(
    isUniversal?: boolean,
  ): Promise<Array<Category & { question_count?: number }>> {
    const where =
      isUniversal === undefined ? {} : { is_universal: Boolean(isUniversal) };
    const categories = await this.categoryModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return Promise.all(
      categories.map(async (category) => {
        const question_count = await this.getQuestionCount(category.id);
        return {
          ...category.toJSON(),
          question_count,
        } as Category & { question_count?: number };
      }),
    );
  }

  async getCategoryById(
    id: string,
  ): Promise<Category & { question_count?: number }> {
    const category = await this.findCategoryEntityById(id);
    const question_count = await this.getQuestionCount(category.id);
    return {
      ...category.toJSON(),
      question_count,
    } as Category & { question_count?: number };
  }

  async getQuestionCount(categoryId: string): Promise<number> {
    return this.questionModel.count({
      where: { category_id: categoryId },
    });
  }

  async createCategory(data: {
    name: string;
    description?: string | null;
    is_universal: boolean;
  }): Promise<Category> {
    return this.categoryModel.create(data);
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      is_universal?: boolean;
    },
  ): Promise<Category> {
    const category = await this.findCategoryEntityById(id);
    await category.update(data);
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryEntityById(id);
    await this.questionModel.destroy({
      where: { category_id: id },
    });
    await category.destroy();
  }

  private async findCategoryEntityById(id: string): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException('Categorie introuvable');
    }
    return category;
  }
}
