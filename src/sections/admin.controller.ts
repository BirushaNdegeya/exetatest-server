import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin')
export class AdminSectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats (admin only)' })
  @ApiOkResponse({
    description: 'Aggregate counts for the admin dashboard',
    schema: {
      type: 'object',
      properties: {
        totalItems: { type: 'number', example: 120 },
        totalSections: { type: 'number', example: 8 },
        totalUsers: { type: 'number', example: 340 },
        totalAdmins: { type: 'number', example: 5 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  getStats() {
    return this.sectionsService.getAdminStats();
  }

  @Get('sections')
  @ApiOperation({
    summary: 'List sections with item counts (admin only)',
    description:
      'Returns the full DRC section catalog with how many items belong to each section (0 when none).',
  })
  @ApiOkResponse({
    description: 'Sections returned successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section_id: { type: 'string', example: '12' },
          title: { type: 'string', example: 'MÉCANIQUE GÉNÉRALE' },
          itemCount: { type: 'number', example: 42 },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  getSections() {
    return this.sectionsService.getAdminSections();
  }
}
