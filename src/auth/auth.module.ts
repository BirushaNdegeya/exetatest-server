import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../models/user.model';
import { Otp } from '../models/otp.model';
import { Profile } from '../models/profile.model';
import { RefreshToken } from '../models/refresh-token.model';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { OtpCleanupService } from './otp-cleanup.service';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([User, Otp, Profile, RefreshToken]),
    PassportModule,
    EmailModule,
    CloudinaryModule,
    StreaksModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpCleanupService],
  exports: [AuthService],
})
export class AuthModule {}
