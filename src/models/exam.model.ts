import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Question } from './question.model';

interface ExamCreationAttributes {
  year: number;
}

@Table({
  tableName: 'exams',
  timestamps: true,
})
export class Exam extends Model<Exam, ExamCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Unique
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @HasMany(() => Question)
  declare questions: Question[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
