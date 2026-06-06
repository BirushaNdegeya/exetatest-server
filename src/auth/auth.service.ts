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
import { ConfigService } from '@nestjs/config';
import { User, UserRoleEnum } from '../models/user.model';
import { Otp } from '../models/otp.model';
import { RefreshToken } from '../models/refresh-token.model';
import { JwtPayload } from './jwt.strategy';
import { EmailService } from '../email/email.service';
import { createHash, randomBytes } from 'crypto';
import { Op } from 'sequelize';
import { UsersService } from '../users/users.service';

type UserAuthState = {
  id: string;
  email: string;
  hasSelectedSections: boolean;
  isFirstLogin: boolean;
  section_id: string | null;
  current_streak: number;
  longest_streak: number;
};

@Injectable()
export class AuthService {
  private static readonly REFRESH_TOKEN_TTL_DAYS = 30;
  private static readonly OTP_TTL_MINUTES = 10;
  private static readonly OTP_RATE_LIMIT_MAX_REQUESTS = 3;
  private static readonly OTP_RATE_LIMIT_WINDOW_MINUTES = 10;

  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    @InjectModel(RefreshToken)
    private refreshTokenModel: typeof RefreshToken,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async createUser(email: string): Promise<User> {
    return this.userModel.create({
      email,
      role: UserRoleEnum.USER,
      current_streak: 0,
      longest_streak: 0,
    });
  }

  private displayNameFromEmail(email: string): string {
    return email.split('@')[0] || 'Utilisateur';
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = { userId: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private hashSha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private generateRefreshTokenRaw(): string {
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
    const streak = await this.usersService.updateStreak(user.id);
    const hasSelectedSections = Boolean(user.section_id);

    return {
      id: user.id,
      email: user.email,
      hasSelectedSections,
      isFirstLogin: !hasSelectedSections,
      section_id: user.section_id ?? null,
      current_streak: streak.current_streak ?? 0,
      longest_streak: streak.longest_streak ?? 0,
    };
  }

  async login(
    user: User,
    ipAddress: string = '0.0.0.0',
    options?: { notifyLoginEmail?: boolean },
  ) {
    const accessToken = await this.generateJwtToken(user);
    const refreshToken = await this.createRefreshToken(user);

    if (options?.notifyLoginEmail ?? true) {
      try {
        await this.emailService.sendLoginNotification(
          user.email,
          this.displayNameFromEmail(user.email),
          ipAddress,
          new Date(),
        );
      } catch (error) {
        console.error('Failed to send login notification email:', error);
      }
    }

    const userState = await this.getUserAuthState(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      accessToken,
      refreshToken,
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

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(
    email: string,
    ipAddress: string = '0.0.0.0',
  ): Promise<{ message: string }> {
    if (!email || !email.trim()) {
      throw new BadRequestException("L'email est requis");
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.validateUser(normalizedEmail);

    if (!user) {
      user = await this.createUser(normalizedEmail);
    }

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

    await this.otpModel.create({
      userId: user.id,
      code: codeHash,
      expiresAt: otpExpiry,
      isVerified: false,
    });

    try {
      await this.emailService.sendOTP(
        normalizedEmail,
        this.displayNameFromEmail(user.email),
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

    await otpRow.update({ isVerified: true });

    return this.login(user, ipAddress, { notifyLoginEmail: true });
  }

  async promoteToAdminByEmail(
    email: string,
    adminSecret: string,
  ): Promise<{ message: string }> {
    const configuredSecret = this.configService.get<string>('ADMIN_SECRET');

    if (!configuredSecret) {
      throw new HttpException(
        'Admin secret is not configured on the server. Please set ADMIN_SECRET in .env or the environment.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (adminSecret !== configuredSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.validateUser(normalizedEmail);
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    if (user.role === UserRoleEnum.ADMIN) {
      return { message: `User ${normalizedEmail} is already an admin` };
    }

    await this.usersService.promoteToAdmin(user.id);

    return {
      message: `User ${normalizedEmail} promoted to admin successfully`,
    };
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
