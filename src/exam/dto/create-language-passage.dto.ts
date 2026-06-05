import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLanguagePassageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  reading_time_minutes?: number;

  @IsString()
  @IsIn(['french', 'english'])
  language: 'french' | 'english';
}
