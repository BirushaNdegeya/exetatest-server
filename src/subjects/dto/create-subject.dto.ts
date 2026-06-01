import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const SUBJECT_BRANCH_TYPES = [
  'Culture Générale',
  'Sciences',
  "Cours d'options",
  'Langues',
  'Dissertation',
  'Jury Oral Français',
  'Jury Oral',
  'Jury Oral Anglais',
] as const;

export class CreateSubjectDto {
  @ApiProperty({
    description:
      'Subject name displayed inside a section. A subject groups its test-year blocks and their questions.',
    example: 'Culture Generale',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Optional description explaining what kinds of questions live under this subject across its test years.',
    example: 'Gerer les questions par categorie et par annee',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description:
      'Structured branch type used by the admin dashboard to adapt the question form.',
    enum: SUBJECT_BRANCH_TYPES,
    example: 'Sciences',
  })
  @IsString()
  @IsIn(SUBJECT_BRANCH_TYPES)
  branch_type: (typeof SUBJECT_BRANCH_TYPES)[number];

  @ApiProperty({
    description:
      'Required parent section ID. Flow: section -> subject -> test year blocks -> questions.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  @IsString()
  section_id: string;
}
