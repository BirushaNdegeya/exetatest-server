import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { CustomQuestionSet } from './custom-question-set.model';

export enum InvitationStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

interface InvitationCreationAttributes {
  set_id: string;
  inviter_id: string;
  invitee_email: string;
  status?: InvitationStatusEnum;
}

@Table({
  tableName: 'invitations',
  timestamps: true,
})
export class Invitation extends Model<
  Invitation,
  InvitationCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CustomQuestionSet)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  set_id: string;

  @BelongsTo(() => CustomQuestionSet, { as: 'set', foreignKey: 'set_id' })
  questionSet: CustomQuestionSet;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  inviter_id: string;

  @BelongsTo(() => User, { foreignKey: 'inviter_id', as: 'inviter' })
  inviter: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  invitee_email: string;

  @Column({
    type: DataType.ENUM(...Object.values(InvitationStatusEnum)),
    defaultValue: InvitationStatusEnum.PENDING,
  })
  status: InvitationStatusEnum;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  responded_at: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
