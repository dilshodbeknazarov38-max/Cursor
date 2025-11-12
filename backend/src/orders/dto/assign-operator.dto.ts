import { IsNotEmpty, IsString } from 'class-validator';

export class AssignOperatorDto {
  @IsString()
  @IsNotEmpty({ message: 'Operator ID si majburiy.' })
  operatorId!: string;
}
