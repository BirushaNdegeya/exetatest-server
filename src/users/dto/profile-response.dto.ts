import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email', example: 'student@example.com' })
  email: string;

  @ApiPropertyOptional({
    example: 'LATIN-PHILO',
    nullable: true,
  })
  section: string | null;

  @ApiPropertyOptional({
    example: '01',
    nullable: true,
  })
  section_id: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at: Date;
}
