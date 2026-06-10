import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ItemTypeEnum } from '../../models/item.model';

export class UpdateItemDto {
  @ApiPropertyOptional({
    enum: ItemTypeEnum,
    example: ItemTypeEnum.SCIENCES,
  })
  @IsOptional()
  @IsEnum(ItemTypeEnum)
  type?: ItemTypeEnum;

  @ApiPropertyOptional({
    example: '01',
  })
  @IsOptional()
  @IsString()
  section_id?: string;

  @ApiPropertyOptional({ example: 2024, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  universal?: boolean;
}
