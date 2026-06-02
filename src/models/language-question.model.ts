import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { LanguagePassage } from './language-passage.model';

interface LanguageQuestionCreationAttributes {
  passage_id?: string | null;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
}

@Table({
  tableName: 'language_questions',
  timestamps: true,
})
export class LanguageQuestion extends Model<
  LanguageQuestion,
  LanguageQuestionCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => LanguagePassage)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare passage_id: string | null;

  @BelongsTo(() => LanguagePassage)
  declare passage: LanguagePassage;

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

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare explanation: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
