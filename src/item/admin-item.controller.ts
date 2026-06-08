import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('admin')
export class AdminItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post('items')
  @ApiOperation({
    summary: 'Create an item (admin only)',
    description:
      'Creates a quiz item (test-year block) for a DRC section. Use section_id from GET /admin/sections or GET /sections.',
  })
  @ApiBody({ type: CreateItemDto })
  @ApiCreatedResponse({
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() dto: CreateItemDto) {
    return this.itemService.create(dto);
  }
}
