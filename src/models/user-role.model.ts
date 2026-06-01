import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

export enum UserRoleEnum {
  ADMIN = 'admin',
  USER = 'user',
}

interface UserRoleCreationAttributes {
  userId: string;
  role: UserRoleEnum;
}

@Table({
  tableName: 'user_roles',
  timestamps: true,
})
export class UserRole extends Model<UserRole, UserRoleCreationAttributes> {
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
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(UserRoleEnum)),
    allowNull: false,
  })
  declare role: UserRoleEnum;

  declare createdAt: Date;
  declare updatedAt: Date;
}
