import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ItemTypeEnum } from '../../models/item.model';

export class CreateItemDto {
  @ApiProperty({
    enum: ItemTypeEnum,
    example: ItemTypeEnum.SCIENCES,
    description:
      "Item category: cg (culture générale), sc (sciences), co (cours d'options), la (langues)",
  })
  @IsEnum(ItemTypeEnum)
  type: ItemTypeEnum;

  @ApiProperty({
    example: '08',
  })
  @IsString()
  @IsNotEmpty()
  section_id: string;

  @ApiProperty({ example: 2024, minimum: 1900, maximum: 2100 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  universal?: boolean;
}
