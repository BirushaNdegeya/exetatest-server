import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class AdminCreateItemQuestionDto {
  @ApiProperty({ example: 'What is the answer?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: ['Option A', 'Option B', 'Option C', 'Option D'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    example: 2,
    description: 'Zero-based index of the correct option',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  answer: number;
}
