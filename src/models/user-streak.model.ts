import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

interface UserStreakCreationAttributes {
  userId: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
}

@Table({
  tableName: 'user_streaks',
  timestamps: true,
})
export class UserStreak extends Model<
  UserStreak,
  UserStreakCreationAttributes
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
    unique: true,
  })
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  current_streak: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  longest_streak: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  last_activity_date: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
