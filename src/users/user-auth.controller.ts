import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SetSectionsDto } from './dto/set-sections.dto';
import { UsersService } from './users.service';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserAuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Get my auth profile (sections + first login + streak summary)',
  })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getUserAuthState(user.id);
  }

  @Put('sections')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Select my section (enables dashboard access)' })
  @ApiBody({ type: SetSectionsDto })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async setSections(
    @CurrentUser() user: { id: string },
    @Body() dto: SetSectionsDto,
  ) {
    return this.usersService.setUserSections(user.id, dto.section_id);
  }
}
