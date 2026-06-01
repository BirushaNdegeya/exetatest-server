import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Section } from './section.model';

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
  userId: string;

  @BelongsTo(() => User)
  user: User;

  /** Legacy display copy; canonical link is section_id */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  section: string | null;

  @ForeignKey(() => Section)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  section_id: string | null;

  @BelongsTo(() => Section)
  sectionEntity: Section;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  xp: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
