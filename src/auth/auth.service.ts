import {
  HttpException,
  HttpStatus,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { Otp } from '../models/otp.model';
import { Profile } from '../models/profile.model';
import { RefreshToken } from '../models/refresh-token.model';
import { JwtPayload } from './jwt.strategy';
import { EmailService } from '../email/email.service';
import { createHash, randomBytes } from 'crypto';
import { Op } from 'sequelize';
import { StreaksService } from '../streaks/streaks.service';

type UserAuthState = {
  id: string;
  email: string;
  hasSelectedSections: boolean;
  isFirstLogin: boolean;
  section_id: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
};

@Injectable()
export class AuthService {
  private static readonly REFRESH_TOKEN_TTL_DAYS = 30;
  private static readonly OTP_TTL_MINUTES = 10;
  private static readonly OTP_RATE_LIMIT_MAX_REQUESTS = 3;
  private static readonly OTP_RATE_LIMIT_WINDOW_MINUTES = 10;

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    @InjectModel(Profile)
    private profileModel: typeof Profile,
    @InjectModel(RefreshToken)
    private refreshTokenModel: typeof RefreshToken,
    private jwtService: JwtService,
    private emailService: EmailService,
    private streaksService: StreaksService,
  ) {}

  async validateUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async createUser(email: string, name: string): Promise<User> {
    return this.userModel.create({
      email,
      name,
    });
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = { userId: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private hashSha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private generateRefreshTokenRaw(): string {
    // 64 bytes => 128 hex chars; good enough for a refresh token.
    return randomBytes(64).toString('hex');
  }

  private async createRefreshToken(user: User): Promise<string> {
    const rawToken = this.generateRefreshTokenRaw();
    const tokenHash = this.hashSha256(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AuthService.REFRESH_TOKEN_TTL_DAYS);

    await this.refreshTokenModel.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });

    return rawToken;
  }

  private async getUserAuthState(user: User): Promise<UserAuthState> {
    const [profile, streak] = await Promise.all([
      this.profileModel.findOne({
        where: { userId: user.id },
      }),
      this.streaksService.updateStreak(user.id),
    ]);

    const hasSelectedSections = Boolean(profile?.section_id);

    return {
      id: user.id,
      email: user.email,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: profile?.section_id ?? null,
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
      last_activity_date: streak.last_activity_date ?? null,
    };
  }

  async login(
    user: User,
    ipAddress: string = '0.0.0.0',
    options?: { notifyLoginEmail?: boolean },
  ) {
    const accessToken = await this.generateJwtToken(user);
    const refreshToken = await this.createRefreshToken(user);

    // Send login notification email
    if (options?.notifyLoginEmail ?? true) {
      try {
        await this.emailService.sendLoginNotification(
          user.email,
          user.name,
          ipAddress,
          new Date(),
        );
      } catch (error) {
        // Log error but don't fail the login
        console.error('Failed to send login notification email:', error);
      }
    }

    const userState = await this.getUserAuthState(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      accessToken, // compatibility for clients using camelCase
      refreshToken, // compatibility for clients using camelCase
      user: userState,
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!file || !file.buffer) {
      throw new UnauthorizedException('Aucun fichier fourni');
    }

    throw new BadRequestException(
      "La mise a jour d'avatar est temporairement indisponible",
    );
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to user's email
   * Throws NotFoundException if email doesn't exist
   */
  async sendOTP(
    email: string,
    ipAddress: string = '0.0.0.0',
  ): Promise<{ message: string }> {
    if (!email || !email.trim()) {
      throw new BadRequestException("L'email est requis");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Create user automatically when they request an OTP for the first time
    let user = await this.validateUser(normalizedEmail);

    if (!user) {
      const defaultName = normalizedEmail.split('@')[0];
      user = await this.createUser(normalizedEmail, defaultName);
    }

    // Rate limiting: max 3 OTP requests per user/email within 10 minutes.
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - AuthService.OTP_RATE_LIMIT_WINDOW_MINUTES,
    );

    const recentOtpRequests = await this.otpModel.count({
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: windowStart },
      },
    });

    if (recentOtpRequests >= AuthService.OTP_RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        'Trop de demandes OTP. Veuillez réessayer plus tard.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + AuthService.OTP_TTL_MINUTES);

    const codeHash = this.hashSha256(otp);

    // Store OTP hash + expiry in DB (single-use via isVerified).
    await this.otpModel.create({
      userId: user.id,
      code: codeHash,
      expiresAt: otpExpiry,
      isVerified: false,
    });

    // Send OTP via email (includes IP + timestamp for context)
    try {
      await this.emailService.sendOTP(
        normalizedEmail,
        user.name,
        otp,
        ipAddress,
        new Date(),
      );
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error("Échec de l'envoi de l'OTP par email");
    }

    return { message: 'OTP envoyé avec succès' };
  }

  /**
   * Verify OTP and login user
   */
  async verifyOTP(email: string, otp: string, ipAddress: string = '0.0.0.0') {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await this.validateUser(normalizedEmail);

    if (!user) {
      throw new NotFoundException('Email introuvable');
    }

    if (!otp || typeof otp !== 'string') {
      throw new UnauthorizedException('Code OTP invalide');
    }

    const otpNormalized = otp.trim();
    const codeHash = this.hashSha256(otpNormalized);
    const now = new Date();

    const otpRow = await this.otpModel.findOne({
      where: {
        userId: user.id,
        code: codeHash,
        isVerified: false,
        expiresAt: { [Op.gt]: now },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRow) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark as verified (single-use); cleanup job will delete expired/verified rows.
    await otpRow.update({ isVerified: true });

    // Clear legacy fields for backward compatibility
    await user.update({ otp: null, otpExpiry: null });

    // Login user + return access + refresh tokens
    return this.login(user, ipAddress, { notifyLoginEmail: true });
  }

  async refresh(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    accessToken: string;
    refreshToken: string;
    user: UserAuthState;
  }> {
    if (!refreshToken || !refreshToken.trim()) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const tokenHash = this.hashSha256(refreshToken.trim());
    const now = new Date();

    const tokenRow = await this.refreshTokenModel.findOne({
      where: { tokenHash, revokedAt: null },
      order: [['createdAt', 'DESC']],
    });

    if (!tokenRow) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    if (tokenRow.expiresAt <= now) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    const user = await this.userModel.findByPk(tokenRow.userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Refresh token rotation: invalidate old token and issue a new one
    await tokenRow.update({ revokedAt: now });

    const accessToken = await this.generateJwtToken(user);
    const newRefreshToken = await this.createRefreshToken(user);
    const userState = await this.getUserAuthState(user);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      accessToken,
      refreshToken: newRefreshToken,
      user: userState,
    };
  }
}
