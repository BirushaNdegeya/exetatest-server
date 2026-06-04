import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Category } from './category.model';
import { Exam } from './exam.model';

interface QuestionCreationAttributes {
  exam_id?: string | null;
  section_id?: string | null;
  category_id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
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

  @ForeignKey(() => Exam)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare exam_id: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare section_id: string | null;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare category_id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare text: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare options: string[];

  @Column({
    type: DataType.STRING(1),
    allowNull: false,
  })
  declare correct_answer: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare explanation: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare question_type: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare language: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare passage_group: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare passage: string | null;

  @BelongsTo(() => Exam)
  declare exam: Exam;

  @BelongsTo(() => Category)
  declare category: Category;

  declare createdAt: Date;
  declare updatedAt: Date;
}
