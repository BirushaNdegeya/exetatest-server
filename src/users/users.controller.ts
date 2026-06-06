import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/roles')
  @ApiOperation({ summary: 'Get my role' })
  async getMyRoles(@CurrentUser() user: { id: string }) {
    return this.usersService.getUserRoles(user.id);
  }

  @Get('me/is-admin')
  @ApiOperation({ summary: 'Check if I am an admin' })
  async isAdmin(@CurrentUser() user: { id: string }) {
    const isAdmin = await this.usersService.isAdmin(user.id);
    return { isAdmin };
  }

  @Get('me/profile')
  @ApiOperation({
    summary: 'Get my profile',
    description:
      'Returns the authenticated user profile including section selection.',
  })
  @ApiOkResponse({
    description: 'Profile returned successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfileByUserId(user.id);
  }

  @Patch('me/profile')
  @ApiOperation({
    summary: 'Update my profile',
    description:
      'Partial PATCH: send only fields to change. Use `section_id` (slug from GET /sections), not a free-text section name. Clears with `"section_id": null`.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('me/streak')
  @ApiOperation({ summary: 'Get my streak' })
  async getMyStreak(@CurrentUser() user: { id: string }) {
    return this.usersService.getStreakByUserId(user.id);
  }

  @Post('me/streak/update')
  @ApiOperation({ summary: 'Update my streak for today' })
  async updateMyStreak(@CurrentUser() user: { id: string }) {
    return this.usersService.updateStreak(user.id);
  }
}
