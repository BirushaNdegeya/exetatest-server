import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { CustomQuestionSet } from './custom-question-set.model';

interface CustomQuestionCreationAttributes {
  set_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
}

@Table({
  tableName: 'custom_questions',
  timestamps: true,
})
export class CustomQuestion extends Model<
  CustomQuestion,
  CustomQuestionCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CustomQuestionSet)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  set_id: string;

  @BelongsTo(() => CustomQuestionSet)
  question_set: CustomQuestionSet;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  question_text: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  options: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  correct_answer: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  explanation: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
