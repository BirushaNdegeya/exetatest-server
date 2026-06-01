import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

/** Body for PATCH /api/v1/profiles/me — all fields optional; omit keys you do not want to change. */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description:
      'Section slug from GET /sections (e.g. mecanique-generale). Send null to clear.',
    example: 'mecanique-generale',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  section_id?: string | null;
}
