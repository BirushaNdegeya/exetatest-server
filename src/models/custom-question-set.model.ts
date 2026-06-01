import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { CustomQuestion } from './custom-question.model';
import { Invitation } from './invitation.model';

interface CustomQuestionSetCreationAttributes {
  creator_id: string;
  title: string;
  description?: string | null;
}

@Table({
  tableName: 'custom_question_sets',
  timestamps: true,
})
export class CustomQuestionSet extends Model<
  CustomQuestionSet,
  CustomQuestionSetCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  creator_id: string;

  @BelongsTo(() => User)
  creator: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string | null;

  @HasMany(() => CustomQuestion)
  questions: CustomQuestion[];

  @HasMany(() => Invitation, { foreignKey: 'set_id', onDelete: 'CASCADE' })
  invitations: Invitation[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
