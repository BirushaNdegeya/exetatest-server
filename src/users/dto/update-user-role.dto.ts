import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRoleEnum } from '../../models/user.model';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRoleEnum, example: UserRoleEnum.ADMIN })
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
