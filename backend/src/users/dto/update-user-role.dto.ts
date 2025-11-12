import { IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  roleSlug!: string;
}
