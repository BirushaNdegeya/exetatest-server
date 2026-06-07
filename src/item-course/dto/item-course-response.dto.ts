import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemCourseResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'chimie' })
  course: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  item_id: string;

  @ApiPropertyOptional({
    example: 'Le passage de lecture associé à ce cours…',
    nullable: true,
  })
  passage: string | null;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
