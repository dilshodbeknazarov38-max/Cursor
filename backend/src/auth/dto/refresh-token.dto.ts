import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Yangilash tokeni talab qilinadi.' })
  refreshToken!: string;
}
