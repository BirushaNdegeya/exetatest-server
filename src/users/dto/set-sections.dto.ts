import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetSectionsDto {
  @ApiProperty({
    description:
      'DRC catalog section slug from GET /sections (e.g. mecanique-generale)',
    example: 'LATIN-PHILO',
  })
  @IsString()
  @IsNotEmpty()
  section_id: string;
}
