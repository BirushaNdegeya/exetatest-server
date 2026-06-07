import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateItemCourseDto {
  @ApiProperty({
    example: 'chimie',
    description: 'Course name or subject slug (e.g. chimie, math)',
  })
  @IsString()
  @IsNotEmpty()
  course: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent item UUID from GET /items',
  })
  @IsUUID()
  item_id: string;

  @ApiPropertyOptional({
    example: 'Le passage de lecture associé à ce cours…',
    description: 'Optional reading passage for this course block',
  })
  @IsOptional()
  @IsString()
  passage?: string;
}
