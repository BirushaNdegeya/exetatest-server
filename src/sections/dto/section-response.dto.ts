import { ApiProperty } from '@nestjs/swagger';

export class SectionResponseDto {
  @ApiProperty({
    example: '01',
  })
  id: string;

  @ApiProperty({ example: 'LATIN-PHILO' })
  title: string;
}
