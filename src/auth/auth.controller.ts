import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MakeAdminDto } from './dto/make-admin.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google OAuth endpoints removed – using email + OTP only

  @Post(['request-otp', 'otp/send'])
  @ApiOperation({ summary: 'Send OTP to user email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async sendOTP(@Body('email') email: string, @Req() req) {
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    return this.authService.sendOTP(email, ipAddress);
  }

  @Post(['verify-otp', 'otp/verify'])
  @ApiOperation({ summary: 'Verify OTP and login user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['email', 'otp'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully, returns JWT (30-day expiry)',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            hasSelectedSections: { type: 'boolean' },
            isFirstLogin: { type: 'boolean' },
            section_id: { type: 'string', nullable: true },
            current_streak: { type: 'number', example: 4 },
            longest_streak: { type: 'number', example: 9 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async verifyOTP(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Req() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    return this.authService.verifyOTP(email, otp, ipAddress);
  }

  @Post('make-admin')
  @ApiOperation({
    summary: 'Promote a user to admin by email using a server secret',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        adminSecret: { type: 'string', example: 'your-admin-secret' },
      },
      required: ['email', 'adminSecret'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User promoted to admin successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User user@example.com promoted to admin successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid admin secret' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiResponse({ status: 500, description: 'Admin secret not configured' })
  async makeAdmin(@Body() dto: MakeAdminDto) {
    return this.authService.promoteToAdminByEmail(dto.email, dto.adminSecret);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return req.user;
  }
}
