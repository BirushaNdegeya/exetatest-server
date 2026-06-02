import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Subject } from './subject.model';

interface TestYearCreationAttributes {
  year: number;
  subject_id: string;
  question_count?: number;
}

@Table({
  tableName: 'test_year',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['subject_id', 'year'],
      name: 'test_year_subject_year_unique',
    },
  ],
})
export class TestYear extends Model<TestYear, TestYearCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @ForeignKey(() => Subject)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare subject_id: string;

  @BelongsTo(() => Subject)
  declare subject: Subject;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare question_count: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
