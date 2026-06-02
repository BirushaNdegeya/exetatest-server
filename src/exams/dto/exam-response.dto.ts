import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExamResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 2024,
  })
  year: number;

  @ApiPropertyOptional({
    description: 'Number of questions linked to this exam year when available',
    example: 42,
  })
  question_count?: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
