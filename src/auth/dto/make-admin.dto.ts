import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class MakeAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  adminSecret: string;
}
