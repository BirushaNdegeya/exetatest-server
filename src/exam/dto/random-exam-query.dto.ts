import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EXAM_CATEGORY_CODES } from '../exam-category.constants';
import type { ExamLimitParam } from './exam-limit.util';
import {
  EXAM_LIMIT_ALL,
  EXAM_LIMIT_MAX,
  IsExamLimit,
  TransformExamLimit,
} from './exam-limit.util';

export class RandomExamQueryDto {
  @ApiProperty({
    description: 'Practice category code: cg, sc, co, la, di, jof, jo, or joa.',
    example: 'cg',
    enum: EXAM_CATEGORY_CODES,
  })
  @IsString()
  @IsIn(EXAM_CATEGORY_CODES)
  category: (typeof EXAM_CATEGORY_CODES)[number];

  @ApiPropertyOptional({
    description:
      'Number of random questions (1–50), or "all" to return every matching question. Ignored for Langues (`la`).',
    example: 5,
    oneOf: [
      { type: 'integer', minimum: 1, maximum: EXAM_LIMIT_MAX },
      { type: 'string', enum: [EXAM_LIMIT_ALL] },
    ],
  })
  @IsOptional()
  @TransformExamLimit()
  @IsExamLimit()
  limit?: ExamLimitParam;

  @ApiPropertyOptional({
    description: 'Filter by exam year block.',
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by exam UUID.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  exam_id?: string;
}
