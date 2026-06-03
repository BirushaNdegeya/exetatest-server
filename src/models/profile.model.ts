import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

interface ProfileCreationAttributes {
  userId: string;
  /** @deprecated Kept for legacy rows; prefer section_id */
  section?: string | null;
  section_id?: string | null;
}

@Table({
  tableName: 'profiles',
  timestamps: true,
})
export class Profile extends Model<Profile, ProfileCreationAttributes> {
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
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  /** Legacy display copy; canonical link is section_id (DRC catalog slug). */
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

  declare createdAt: Date;
  declare updatedAt: Date;
}
