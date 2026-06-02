import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Question } from './question.model';

interface CategoryCreationAttributes {
  name: string;
  is_universal: boolean;
  description?: string | null;
}

@Table({
  tableName: 'categories',
  timestamps: true,
})
export class Category extends Model<Category, CategoryCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_universal: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @HasMany(() => Question)
  declare questions: Question[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
