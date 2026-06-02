import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { LanguageQuestion } from './language-question.model';

export const LANGUAGE_TYPES = ['french', 'english'] as const;

interface LanguagePassageCreationAttributes {
  language: (typeof LANGUAGE_TYPES)[number];
  title: string;
  content: string;
  reading_time_minutes: number;
}

@Table({
  tableName: 'language_passages',
  timestamps: true,
})
export class LanguagePassage extends Model<
  LanguagePassage,
  LanguagePassageCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...LANGUAGE_TYPES),
    allowNull: false,
  })
  declare language: (typeof LANGUAGE_TYPES)[number];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 3,
  })
  declare reading_time_minutes: number;

  @HasMany(() => LanguageQuestion)
  declare questions: LanguageQuestion[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
