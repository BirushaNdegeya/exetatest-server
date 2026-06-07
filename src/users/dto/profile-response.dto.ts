import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email', example: 'student@example.com' })
  email: string;

  @ApiPropertyOptional({
    description:
      'Resolved section label (convenience); canonical key is section_id',
    example: 'MECANIQUE GENERALE',
    nullable: true,
  })
  section: string | null;

  @ApiPropertyOptional({
    example: 'LATIN-PHILO',
    description:
      'DRC catalog section slug from GET /sections — use for routing and PATCH updates',
    nullable: true,
  })
  section_id: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at: Date;
}
