import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminCreateItemCourseDto {
  @ApiProperty({ example: 'Course title' })
  @IsString()
  @IsNotEmpty()
  course: string;

  @ApiPropertyOptional({ example: 'Optional passage text' })
  @IsOptional()
  @IsString()
  passage?: string;
}
