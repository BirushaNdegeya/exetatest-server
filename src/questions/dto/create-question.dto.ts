import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmptyObject,
  IsNumber,
  IsString,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export const QUESTION_TYPES = [
  'standard',
  'math_equation',
  'language_passage',
  'dissertation',
  'oral',
] as const;

export const QUESTION_LANGUAGES = ['francais', 'anglais'] as const;

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Question text shown to the learner',
    example:
      'What is the capital city of the Democratic Republic of the Congo?',
  })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmptyObject()
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
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  correctAnswer: number;

  @ApiProperty({
    description: 'Explanation displayed after answering',
    example: 'Kinshasa (1) is the capital and largest city of the DRC.',
  })
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @ApiProperty({
    description: 'Associated year block ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  test_year_id: string;

  @ApiPropertyOptional({
    description: 'Optional reading passage attached to the question',
    example: 'Read the following paragraph before answering the question.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  passage?: string | null;

  @ApiPropertyOptional({
    description:
      'Optional shared passage-group identifier used to tie multiple language questions to the same text.',
    example: 'lang-fr-2026-passage-1',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  passage_group?: string | null;

  @ApiPropertyOptional({
    description:
      'Question presentation type used by the admin dashboard for math, language, oral, or dissertation workflows.',
    enum: QUESTION_TYPES,
    example: 'math_equation',
    default: 'standard',
  })
  @IsOptional()
  @IsString()
  @IsIn(QUESTION_TYPES)
  question_type?: (typeof QUESTION_TYPES)[number];

  @ApiPropertyOptional({
    description:
      'Optional language tag, mainly for language and oral question branches.',
    enum: QUESTION_LANGUAGES,
    nullable: true,
    example: 'francais',
  })
  @IsOptional()
  @IsString()
  @IsIn(QUESTION_LANGUAGES)
  language?: (typeof QUESTION_LANGUAGES)[number] | null;
}
