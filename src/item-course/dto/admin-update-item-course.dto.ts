import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminUpdateItemCourseDto {
  @ApiPropertyOptional({ example: 'Updated course title' })
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional({
    example: 'Updated passage text',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  passage?: string | null;
}
