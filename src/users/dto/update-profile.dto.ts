import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';


export type ProfileUpdateRequest = {
  country?: string;
  region?: string;
  section?: string;
  section_id?: string;
};

/** Body for PATCH /users/me/profile — all fields optional; omit keys you do not want to change. */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'CD',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  country?: string | null;

  @ApiPropertyOptional({
    example: 'GOMA',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  region?: string | null;

  @ApiPropertyOptional({
    example: 'LATIN-PHILO',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  section?: string | null;

  @ApiPropertyOptional({
    example: '01',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  section_id?: string | null;
}