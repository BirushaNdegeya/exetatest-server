import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface UserCreationAttributes {
  email: string;
  name: string;
  avatarUrl?: string | null;
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
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatarUrl: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otp: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare otpExpiry: Date | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
