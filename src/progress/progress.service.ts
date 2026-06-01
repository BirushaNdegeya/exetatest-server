import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserProgress } from '../models/user-progress.model';
import { Question } from '../models/question.model';

export interface UserProgressSummary {
  totalAnswered: number;
  correctAnswers: number;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(UserProgress)
    private userProgressModel: typeof UserProgress,
  ) {}

  async getUserProgress(
    userId: string,
    questionId?: string,
  ): Promise<UserProgress[]> {
    const where: any = { userId };
    if (questionId) where.question_id = questionId;

    return this.userProgressModel.findAll({
      where,
      include: [Question],
    });
  }

  async getUserProgressSummary(userId: string): Promise<UserProgressSummary> {
    const [totalAnswered, correctAnswers] = await Promise.all([
      this.userProgressModel.count({
        where: { userId },
      }),
      this.userProgressModel.count({
        where: { userId, is_correct: true },
      }),
    ]);

    return {
      totalAnswered,
      correctAnswers,
    };
  }

  async recordProgress(
    userId: string,
    questionId: string,
    isCorrect: boolean,
  ): Promise<UserProgress> {
    // Use upsert logic
    const [progress] = await this.userProgressModel.findOrCreate({
      where: { userId, question_id: questionId },
      defaults: {
        userId,
        question_id: questionId,
        is_correct: isCorrect,
      },
    });

    // If it already exists, update it
    if (progress) {
      await progress.update({
        is_correct: isCorrect,
        answered_at: new Date(),
      });
    }

    return progress;
  }
}
