import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Question } from './question.model';

interface UserProgressCreationAttributes {
  userId: string;
  question_id: string;
  is_correct: boolean;
}

@Table({
  tableName: 'user_progress',
  timestamps: true,
})
export class UserProgress extends Model<
  UserProgress,
  UserProgressCreationAttributes
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
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Question)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  question_id: string;

  @BelongsTo(() => Question)
  question: Question;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_correct: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  answered_at: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}
