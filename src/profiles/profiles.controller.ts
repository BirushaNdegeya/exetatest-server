import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get my profile',
    description:
      'Returns the authenticated user profile. If the profile row does not exist yet, it is created automatically.',
  })
  @ApiOkResponse({
    description: 'Profile returned successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyProfile(@CurrentUser() user: { id: string }) {
    return this.profilesService.getProfileByUserId(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my profile',
    description:
      'Partial PATCH: send only fields to change. Use `section_id` (uuid from GET /sections), not a free-text section name. Clears with `"section_id": null`. Legacy `section` string on the row is updated for display. Syncs `users.name` from identity fields. Requires Bearer JWT.',
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
    return this.profilesService.updateProfile(user.id, updateProfileDto);
  }
}
