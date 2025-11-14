import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LeadNoteDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Izoh 500 belgidan oshmasligi kerak.' })
  note?: string;
}
