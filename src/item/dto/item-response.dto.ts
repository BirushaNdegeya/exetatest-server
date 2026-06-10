import { ApiProperty } from '@nestjs/swagger';
import { ItemTypeEnum } from '../../models/item.model';

export class ItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ enum: ItemTypeEnum, example: ItemTypeEnum.SCIENCES })
  type: ItemTypeEnum;

  @ApiProperty({ example: '01' })
  section_id: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: false })
  universal: boolean;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
