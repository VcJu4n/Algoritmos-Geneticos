import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class JobProgressDto {
  @IsOptional()
  @IsString()
  estado?: string; // running/finished/failed/needs_input

  @IsOptional()
  @IsInt()
  generation?: number;

  @IsOptional()
  @IsNumber()
  best?: number;

  @IsOptional()
  @IsNumber()
  avg?: number;

  @IsOptional()
  @IsInt()
  etaMin?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
