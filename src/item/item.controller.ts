import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { ItemQueryDto } from './dto/item-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('items')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Create an item (admin only)',
    description:
      'Creates a quiz item (test-year block) for a section. Requires admin role.',
  })
  @ApiBody({ type: CreateItemDto })
  @ApiCreatedResponse({
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List items',
    description:
      'Returns paginated quiz items. Optional filters: type, section_id, year, universal.',
  })
  @ApiOkResponse({
    description: 'Items returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemResponseDto' },
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(@Query() query: ItemQueryDto) {
    return this.itemService.findAll(query);
  }

  // Get random item

  @Get('/random')
  @ApiOperation({
    summary: 'Get random item',
    description:
      'Returns a random quiz item based on type and section_id filters.',
  })
  @ApiOkResponse({
    description: 'Random item returned successfully',
    type: ItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findRandom(@Query() query: ItemQueryDto) {
    return this.itemService.findRandom(query);
  }

  // Item by id

  @Get(':id')
  @ApiOperation({ summary: 'Get one item by id' })
  @ApiOkResponse({
    description: 'Item returned successfully',
    type: ItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Update an item (admin only)',
    description: 'Partial update. Send only fields to change.',
  })
  @ApiBody({ type: UpdateItemDto })
  @ApiOkResponse({
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemService.update(id, updateItemDto);
  }
}
