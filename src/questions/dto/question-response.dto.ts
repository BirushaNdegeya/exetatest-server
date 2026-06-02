import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 'Le dialogue social aide surtout a :',
  })
  text: string;

  @ApiProperty({
    example: ['A. Aggraver les conflits', 'B. Trouver des solutions communes'],
  })
  options: string[];

  @ApiProperty({
    example: 'B',
  })
  correct_answer: string;

  @ApiProperty({ format: 'uuid' })
  category_id: string;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
    nullable: true,
  })
  exam_id?: string | null;

  @ApiPropertyOptional({
    example: 'mathematique',
    nullable: true,
  })
  section_id?: string | null;

  @ApiPropertyOptional({
    example: 'Le dialogue social vise la cooperation et le compromis.',
    nullable: true,
  })
  explanation?: string | null;

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
