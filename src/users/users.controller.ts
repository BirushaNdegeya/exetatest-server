import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/roles')
  @UseGuards(JwtAuthGuard)
  async getMyRoles(@CurrentUser() user: any) {
    return this.usersService.getUserRoles(user.id);
  }

  @Get('me/is-admin')
  @UseGuards(JwtAuthGuard)
  async isAdmin(@CurrentUser() user: any) {
    const isAdmin = await this.usersService.isAdmin(user.id);
    return { isAdmin };
  }
}
