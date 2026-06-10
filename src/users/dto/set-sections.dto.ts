import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetSectionsDto {
  @ApiProperty({
    example: '01',
  })
  @IsString()
  @IsNotEmpty()
  section_id: string;
}
