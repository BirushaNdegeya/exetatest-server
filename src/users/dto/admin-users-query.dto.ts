import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRoleEnum } from '../../models/user.model';

export enum AdminUserSortField {
  CREATED_AT = 'createdAt',
  EMAIL = 'email',
  ROLE = 'role',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Partial match filter on email',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: UserRoleEnum, example: UserRoleEnum.USER })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiPropertyOptional({
    enum: AdminUserSortField,
    default: AdminUserSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(AdminUserSortField)
  sortBy?: AdminUserSortField = AdminUserSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
