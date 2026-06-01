import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { TestYear } from './test-year.model';
import { Subject } from './subject.model';
import { UserProgress } from './user-progress.model';

interface QuestionCreationAttributes {
  question_text: string;
  options: {
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5: string;
  };
  correctAnswer: number;
  explanation: string;
  subject_id: string;
  year: number;
  test_year_id: string;
  passage?: string | null;
  passage_group?: string | null;
  question_type?: string;
  language?: string | null;
}

@Table({
  tableName: 'questions',
  timestamps: true,
})
export class Question extends Model<Question, QuestionCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare question_text: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  declare options: {
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5: string;
  };

  @Column({
    field: 'correct_answer',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare correctAnswer: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare explanation: string;

  @ForeignKey(() => Subject)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare subject_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @ForeignKey(() => TestYear)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare test_year_id: string;

  @BelongsTo(() => TestYear)
  declare testYear: TestYear;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare passage: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare passage_group: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'standard',
  })
  declare question_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare language: string | null;

  @HasMany(() => UserProgress)
  declare userProgress: UserProgress[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
