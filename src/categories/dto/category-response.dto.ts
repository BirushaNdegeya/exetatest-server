import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Unique category identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Culture generale',
  })
  name: string;

  @ApiProperty({
    description: 'True when questions are shared across all sections.',
    example: true,
  })
  is_universal: boolean;

  @ApiPropertyOptional({
    description: 'Optional helper note for admins.',
    example: 'Questions communes a toutes les sections.',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Number of questions linked to this category',
    example: 3,
  })
  question_count?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
