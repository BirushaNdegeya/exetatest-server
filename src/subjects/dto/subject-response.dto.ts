import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectResponseDto {
  @ApiProperty({
    description: 'Unique subject identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Subject name shown under a section',
    example: 'Culture Generale',
  })
  name: string;

  @ApiPropertyOptional({
    description:
      'Optional description of the subject content and its test-year question structure',
    example: 'Questions de culture generale organisees par annee',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Structured branch type selected in the admin dashboard.',
    example: 'Culture Générale',
  })
  branch_type: string;

  @ApiProperty({
    description:
      'Parent section ID for this subject. Flow: section -> subject -> test year blocks -> questions.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  section_id: string;

  @ApiPropertyOptional({
    description:
      'Number of test-year blocks attached to this subject when included in the response',
    example: 3,
  })
  year_count?: number;

  @ApiPropertyOptional({
    description:
      'Total questions across all test-year blocks for this subject when included in the response',
    example: 120,
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
