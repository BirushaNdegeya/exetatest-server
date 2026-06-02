import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import { UserStreak } from '../models/user-streak.model';
import { User } from '../models/user.model';
import { EmailService } from '../email/email.service';

@Injectable()
export class InactivityReminderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(InactivityReminderService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UserStreak)
    private readonly userStreakModel: typeof UserStreak,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    const enabled =
      this.configService.get<string>('INACTIVITY_EMAIL_ENABLED') === 'true';
    if (!enabled) {
      return;
    }

    // Run once soon after boot, then every 24h.
    const startupDelayMs = 30_000;
    setTimeout(() => {
      void this.runOnce().catch((err: unknown) => {
        this.logger.error(
          'Inactivity reminder startup run failed',
          err instanceof Error ? err.stack : String(err),
        );
      });
    }, startupDelayMs).unref?.();

    const intervalMs = 24 * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      void this.runOnce().catch((err: unknown) => {
        this.logger.error(
          'Inactivity reminder scheduled run failed',
          err instanceof Error ? err.stack : String(err),
        );
      });
    }, intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startOfTodayUtc(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private async runOnce(): Promise<void> {
    try {
      const inactivityDays = Number(
        this.configService.get<string>('INACTIVITY_EMAIL_DAYS') ?? '14',
      );
      if (!Number.isFinite(inactivityDays) || inactivityDays <= 0) {
        this.logger.warn(
          `Skipping inactivity emails; invalid INACTIVITY_EMAIL_DAYS=${inactivityDays}`,
        );
        return;
      }

      const cutoff = this.startOfTodayUtc();
      cutoff.setUTCDate(cutoff.getUTCDate() - inactivityDays);

      const candidates = await this.userStreakModel.findAll({
        where: {
          last_activity_date: { [Op.lte]: cutoff },
          last_inactivity_email_sent_at: null,
        },
        include: [
          {
            model: User,
            required: true,
            attributes: ['id', 'email', 'name'],
          },
        ],
      });

      if (candidates.length === 0) {
        return;
      }

      for (const streak of candidates) {
        const user = (streak as unknown as { user: User }).user;
        if (!user?.email) {
          continue;
        }

        try {
          await this.emailService.sendInactivityReminder(
            user.email,
            user.name,
            inactivityDays,
          );
          await streak.update({ last_inactivity_email_sent_at: new Date() });
        } catch (err) {
          this.logger.error(
            `Failed inactivity reminder for userId=${user.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      // Never crash bootstrap/scheduler because reminder query fails.
      // This can happen temporarily if DB schema lags behind code changes.
        this.logger.error(
        'Inactivity reminder run skipped due to query/runtime error',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
