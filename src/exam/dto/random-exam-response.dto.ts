import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RandomExamQuestionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty({ example: 'B' })
  correct_answer: string;

  @ApiPropertyOptional({ nullable: true })
  explanation?: string | null;

  @ApiPropertyOptional({ nullable: true })
  passage?: string | null;

  @ApiPropertyOptional({ nullable: true })
  passage_group?: string | null;

  @ApiPropertyOptional({ nullable: true })
  language?: string | null;
}

export class RandomExamPassageBlockDto {
  @ApiProperty({ example: 'Passage Français' })
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ example: 3 })
  reading_time_minutes: number;

  @ApiProperty({ type: [RandomExamQuestionDto] })
  questions: RandomExamQuestionDto[];
}

export class RandomExamResponseDto {
  @ApiProperty({ example: 'cg' })
  category: string;

  @ApiProperty({ example: 'Culture generale' })
  category_name: string;

  @ApiProperty({ example: true })
  is_universal: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'techniques-sociales' })
  section_id: string | null;

  @ApiProperty({ type: [RandomExamQuestionDto] })
  questions: RandomExamQuestionDto[];

  @ApiPropertyOptional({ type: RandomExamPassageBlockDto, nullable: true })
  french?: RandomExamPassageBlockDto;

  @ApiPropertyOptional({ type: RandomExamPassageBlockDto, nullable: true })
  english?: RandomExamPassageBlockDto;
}
