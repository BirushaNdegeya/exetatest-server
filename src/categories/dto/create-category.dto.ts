import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name displayed to learners and admins.',
    example: 'Culture generale',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'True for universal categories (Culture generale, Langues), false for section-specific categories.',
    example: true,
  })
  @IsBoolean()
  is_universal: boolean;

  @ApiPropertyOptional({
    description: 'Optional helper note for admins.',
    example: 'Questions partagees pour toutes les sections',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
