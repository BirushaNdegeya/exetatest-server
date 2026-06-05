import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLanguageQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsArray()
  @IsNotEmpty()
  options: string[];

  @IsString()
  @IsNotEmpty()
  correct_answer: string;

  @IsString()
  @IsOptional()
  explanation?: string;
}
