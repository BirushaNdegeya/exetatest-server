import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Section } from './section.model';
import { TestYear } from './test-year.model';

interface SubjectCreationAttributes {
  name: string;
  description?: string | null;
  section_id: string;
  branch_type: string;
  year_count?: number;
  question_count?: number;
}

@Table({
  tableName: 'subjects',
  timestamps: true,
})
export class Subject extends Model<Subject, SubjectCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Culture Générale',
  })
  declare branch_type: string;

  @ForeignKey(() => Section)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare section_id: string;

  @BelongsTo(() => Section)
  declare section: Section;

  @HasMany(() => TestYear)
  declare testYears: TestYear[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare year_count: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare question_count: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
