import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  @IsString({ message: 'Refresh token noto‘g‘ri formatda.' })
  refreshToken?: string;
}
