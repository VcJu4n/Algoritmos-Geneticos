import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  tipo: string; // p.ej. "AG_PLAN"

  @IsObject()
  params: Record<string, any>;

  @IsOptional()
  @IsString()
  seed?: string;

  @IsOptional()
  @IsString()
  motorVersion?: string;

  @IsOptional()
  @IsString()
  datasetPath?: string;

  @IsOptional()
  @IsString()
  datasetHash?: string;

  @IsOptional()
  @IsInt()
  familiaId?: number; // solo admin puede setearlo; para familias se fuerza su propio id
}
