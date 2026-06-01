import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 'Quelle est la capitale de la RDC ?',
  })
  question_text: string;

  @ApiProperty({
    description: '5 fixed answer options labeled 1-5',
    example: {
      option1: 'Kinshasa (1)',
      option2: 'Lubumbashi (2)',
      option3: 'Goma (3)',
      option4: 'Matadi (4)',
      option5: 'Bukavu (5)',
    },
  })
  options: {
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5: string;
  };

  @ApiProperty({
    description: 'Correct answer position (1-5)',
    example: 1,
  })
  correctAnswer: number;

  @ApiProperty({
    example:
      'Kinshasa (1) est la capitale de la Republique Democratique du Congo.',
  })
  explanation: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  test_year_id: string;

  @ApiPropertyOptional({
    example: 'Lisez le passage suivant avant de repondre.',
    nullable: true,
  })
  passage?: string | null;

  @ApiPropertyOptional({
    example: 'lang-fr-2026-passage-1',
    nullable: true,
  })
  passage_group?: string | null;

  @ApiProperty({
    example: 'standard',
  })
  question_type: string;

  @ApiPropertyOptional({
    example: 'francais',
    nullable: true,
  })
  language?: string | null;

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
