import { ApiProperty } from '@nestjs/swagger';

export class ItemQuestionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Quelle est la capitale du Nord-Kivu ?' })
  question: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  item_course_id: string;

  @ApiProperty({ example: ['bukavu', 'goma'], type: [String] })
  options: string[];

  @ApiProperty({
    example: 1,
    description: 'Index of the correct option in options (0-based)',
  })
  answer: number;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
