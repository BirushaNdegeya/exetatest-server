import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { JwtPayload } from './jwt.strategy';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private jwtService: JwtService,
    private emailService: EmailService,
    private cloudinaryService: CloudinaryService,
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
    const payload: JwtPayload = { id: user.id };
    return this.jwtService.sign(payload);
  }

  async login(user: User, ipAddress: string = '0.0.0.0') {
    const token = await this.generateJwtToken(user);

    // Send login notification email
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

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
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

    const uploadResult = await this.cloudinaryService.uploadImage(file.buffer);

    await user.update({ avatarUrl: uploadResult.secure_url });

    return {
      message: 'Avatar mis à jour avec succès',
      avatarUrl: user.avatarUrl,
    };
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

    // Create user automatically when they request an OTP for the first time
    let user = await this.validateUser(email);

    if (!user) {
      const defaultName = email.split('@')[0];
      user = await this.createUser(email, defaultName);
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Update user with OTP and expiry
    await user.update({
      otp,
      otpExpiry,
    });

    // Send OTP via email (includes IP + timestamp for context)
    try {
      await this.emailService.sendOTP(
        user.email,
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
    const user = await this.validateUser(email);

    if (!user) {
      throw new NotFoundException('Email introuvable');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new UnauthorizedException(
        'Aucun OTP trouvé. Veuillez demander un nouveau code.',
      );
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      throw new UnauthorizedException(
        'Le code OTP a expiré. Veuillez demander un nouveau code.',
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      throw new UnauthorizedException('Code OTP invalide');
    }

    // Clear OTP after successful verification
    await user.update({
      otp: null,
      otpExpiry: null,
    });

    // Login user
    return this.login(user, ipAddress);
  }
}
