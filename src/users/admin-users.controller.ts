import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users (admin only)',
    description:
      'Paginated, searchable, sortable user list. Sensitive fields are excluded.',
  })
  @ApiOkResponse({
    description: 'Users returned successfully',
    schema: {
      type: 'object',
      properties: {
        users: { type: 'array', items: { type: 'object' } },
        total: { type: 'number', example: 340 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 17 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  findAll(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAllAdmin(query);
  }

  @Put(':userId/role')
  @ApiOperation({ summary: 'Change a user role (admin only)' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiOkResponse({ description: 'User role updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  updateRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, dto.role);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user account (admin only)' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.usersService.deleteUser(userId);
  }
}
