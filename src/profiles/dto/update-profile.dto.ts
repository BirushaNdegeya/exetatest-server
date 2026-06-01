import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

/** Body for PATCH /api/v1/profiles/me — all fields optional; omit keys you do not want to change. */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Section id from GET /sections. Send null to clear.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID('4')
  section_id?: string | null;
}
