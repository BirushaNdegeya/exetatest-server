import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SharedQuizService } from './shared-quiz.service';
import { SharedQuizController } from './shared-quiz.controller';
import { CustomQuestionSet } from '../models/custom-question-set.model';
import { CustomQuestion } from '../models/custom-question.model';
import { Invitation } from '../models/invitation.model';
import { User } from '../models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CustomQuestionSet,
      CustomQuestion,
      Invitation,
      User,
    ]),
  ],
  providers: [SharedQuizService],
  controllers: [SharedQuizController],
  exports: [SharedQuizService],
})
export class SharedQuizModule {}
