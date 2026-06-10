import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

/** Body for PATCH /users/me/profile — all fields optional; omit keys you do not want to change. */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: '01',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  section_id?: string | null;
}
