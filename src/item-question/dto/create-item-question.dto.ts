import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateItemQuestionDto {
  @ApiProperty({
    example: 'Quelle est la capitale du Nord-Kivu ?',
    description: 'Question text',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent item course UUID from GET /item-courses',
  })
  @IsUUID()
  item_course_id: string;

  @ApiProperty({
    example: ['bukavu', 'goma'],
    description: 'Answer choices',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    example: 1,
    description:
      'Index of the correct option in the options array (0-based). Example: "goma" at index 1.',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  answer: number;
}
