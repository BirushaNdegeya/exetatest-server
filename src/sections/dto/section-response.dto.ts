import { ApiProperty } from '@nestjs/swagger';

export class SectionResponseDto {
  @ApiProperty({
    example: 'mecanique-generale',
    description: 'Stable section slug from the DRC catalog',
  })
  id: string;

  @ApiProperty({ example: 'MÉCANIQUE GÉNÉRALE' })
  title: string;
}
