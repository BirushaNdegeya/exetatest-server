import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateItemQuestionDto {
  @ApiPropertyOptional({
    example: 'Quelle est la capitale du Nord-Kivu ?',
    description: 'Question text',
  })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent item course UUID',
  })
  @IsOptional()
  @IsUUID()
  item_course_id?: string;

  @ApiPropertyOptional({
    example: ['bukavu', 'goma'],
    description: 'Answer choices',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Index of the correct option (0-based)',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  answer?: number;
}
