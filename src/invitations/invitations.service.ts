import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Invitation, InvitationStatusEnum } from '../models/invitation.model';
import { CustomQuestionSet } from '../models/custom-question-set.model';
import { User } from '../models/user.model';
import { EmailService } from '../email/email.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation)
    private invitationModel: typeof Invitation,
    @InjectModel(CustomQuestionSet)
    private customSetModel: typeof CustomQuestionSet,
    @InjectModel(User)
    private userModel: typeof User,
    private emailService: EmailService,
  ) {}

  async getReceivedInvitations(userId: string): Promise<Invitation[]> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.invitationModel.findAll({
      where: { invitee_email: user.email },
      include: [
        { model: CustomQuestionSet, as: 'set' },
        { model: User, as: 'inviter' },
      ],
    });
  }

  async getSentInvitations(
    userId: string,
    setId?: string,
  ): Promise<Invitation[]> {
    const where: any = { inviter_id: userId };
    if (setId) where.set_id = setId;

    return this.invitationModel.findAll({
      where,
      include: [
        { model: CustomQuestionSet, as: 'set' },
        { model: User, as: 'inviter' },
      ],
    });
  }

  async sendInvitation(
    userId: string,
    data: {
      set_id: string;
      invitee_email: string;
    },
  ): Promise<Invitation> {
    // Verify user owns the set
    const set = await this.customSetModel.findByPk(data.set_id);
    if (!set || set.creator_id !== userId) {
      throw new ForbiddenException(
        'You can only invite people to your own sets',
      );
    }

    // Create invitation
    const invitation = await this.invitationModel.create({
      set_id: data.set_id,
      inviter_id: userId,
      invitee_email: data.invitee_email,
      status: InvitationStatusEnum.PENDING,
    });

    // Send invitation email
    try {
      const inviter = await this.userModel.findByPk(userId);
      if (!inviter) {
        throw new NotFoundException('Inviter not found');
      }
      await this.emailService.sendSetInvitation(
        data.invitee_email,
        inviter.name,
        set.title,
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    const fullInvitation = await this.invitationModel.findByPk(invitation.id, {
      include: [
        { model: CustomQuestionSet, as: 'set' },
        { model: User, as: 'inviter' },
      ],
    });

    if (!fullInvitation) {
      throw new NotFoundException('Invitation not found after creation');
    }

    return fullInvitation;
  }

  async respondToInvitation(
    userId: string,
    invitationId: string,
    status: InvitationStatusEnum,
  ): Promise<Invitation> {
    const invitation = await this.invitationModel.findByPk(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the user is the invitee
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (invitation.invitee_email !== user.email) {
      throw new ForbiddenException('This invitation is not for you');
    }

    await invitation.update({
      status,
      responded_at: new Date(),
    });

    const updatedInvitation = await this.invitationModel.findByPk(
      invitationId,
      {
        include: [
          { model: CustomQuestionSet, as: 'set' },
          { model: User, as: 'inviter' },
        ],
      },
    );

    if (!updatedInvitation) {
      throw new NotFoundException('Invitation not found after update');
    }

    return updatedInvitation;
  }

  async deleteInvitation(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationModel.findByPk(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only inviter can delete
    if (invitation.inviter_id !== userId) {
      throw new ForbiddenException(
        'Only the inviter can delete this invitation',
      );
    }

    await invitation.destroy();
  }
}
