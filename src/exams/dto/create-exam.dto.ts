import { ApiProperty } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({
    description: 'Exam year. Must be unique.',
    example: 2024,
  })
  year: number;
}
