import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import { Otp } from '../models/otp.model';

@Injectable()
export class OtpCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtpCleanupService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Otp)
    private readonly otpModel: typeof Otp,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Runs immediately, then every hour by default.
    await this.cleanup().catch((err) => {
      this.logger.error('OTP cleanup failed on startup', err);
    });

    const intervalMinutes =
      this.configService.get<number>('OTP_CLEANUP_INTERVAL_MINUTES') ?? 60;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    this.timer = setInterval(() => {
      void this.cleanup();
    }, intervalMs);
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async cleanup(): Promise<void> {
    const now = new Date();
    const deletedCount = await this.otpModel.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    });

    if (deletedCount > 0) {
      this.logger.log(`Deleted ${deletedCount} expired OTP rows`);
    }
  }
}
