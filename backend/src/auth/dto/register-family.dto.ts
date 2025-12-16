import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RegisterFamilyDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombreFamilia: string;

  @IsOptional()
  @IsInt()
  comunidadId?: number;

  @IsOptional()
  @IsString()
  comunidadNombre?: string;

  @IsOptional()
  @IsString()
  comunidadRegion?: string;

  @IsInt()
  @Min(1)
  miembros: number;

  @IsOptional()
  @IsString()
  nombre?: string;
}
