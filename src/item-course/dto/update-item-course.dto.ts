import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateItemCourseDto {
  @ApiPropertyOptional({
    example: 'chimie',
    description: 'Course name or subject slug',
  })
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent item UUID',
  })
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiPropertyOptional({
    example: 'Le passage de lecture associé à ce cours…',
    nullable: true,
    description: 'Reading passage; send null or omit to leave unchanged',
  })
  @IsOptional()
  @IsString()
  passage?: string | null;
}
