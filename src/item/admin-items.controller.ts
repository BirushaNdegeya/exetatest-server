import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemService } from './item.service';
import { AdminSectionItemsQueryDto } from './dto/admin-section-items-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin/sections')
export class AdminItemsController {
  constructor(private readonly itemService: ItemService) {}

  @Get(':sectionId/items')
  @ApiOperation({
    summary: 'List items for a section (admin only)',
    description:
      'Returns paginated items for a section_id with course counts included.',
  })
  @ApiOkResponse({
    description: 'Items returned successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              universal: { type: 'boolean' },
              year: { type: 'number' },
              courseCount: { type: 'number' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  findBySection(
    @Param('sectionId') sectionId: string,
    @Query() query: AdminSectionItemsQueryDto,
  ) {
    return this.itemService.findBySectionAdmin(sectionId, query);
  }
}
