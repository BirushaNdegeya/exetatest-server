import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Question text shown to the learner.',
    example: 'Le dialogue social aide surtout a :',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Answer options in display order.',
    example: ['A. Aggraver les conflits', 'B. Trouver des solutions communes'],
  })
  @IsArray()
  @ArrayMinSize(2)
  options: string[];

  @ApiProperty({
    description: 'Correct answer label.',
    example: 'B',
  })
  @IsString()
  @Length(1, 1)
  correct_answer: string;

  @ApiProperty({
    description: 'Category identifier.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  category_id: string;

  @ApiPropertyOptional({
    description: 'Exam identifier (year block). Null means no exam binding.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  exam_id?: string | null;

  @ApiPropertyOptional({
    description:
      'Section slug. Must be null for universal categories and set for section-specific categories.',
    example: 'mathematique',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  section_id?: string | null;

  @ApiPropertyOptional({
    description: 'Explanation shown after answer reveal.',
    example: 'Le dialogue social vise la cooperation et le compromis.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  explanation?: string | null;
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name.',
    example: 'Culture generale',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'True for universal categories shared across all sections.',
    example: true,
  })
  @IsBoolean()
  is_universal: boolean;
}
