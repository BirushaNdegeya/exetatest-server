import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

export enum UserRoleEnum {
  ADMIN = 'admin',
  USER = 'user',
}

interface UserCreationAttributes {
  email: string;
  country?: string | null;
  region?: string | null;
  role: UserRoleEnum;
  section?: string | null;
  section_id?: string | null;
  current_streak: number;
  longest_streak: number;
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User, UserCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare country: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare section: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare section_id: string | null;

  @Default(UserRoleEnum.USER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRoleEnum)),
    allowNull: false,
  })
  declare role: UserRoleEnum;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare current_streak: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare longest_streak: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;
}
