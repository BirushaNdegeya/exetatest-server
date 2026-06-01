import { ApiProperty } from '@nestjs/swagger';

export class CreateTestYearDto {
  @ApiProperty({
    description:
      'Exam year inside the selected subject. Must be unique per subject.',
    example: 2024,
  })
  year: number;
}
