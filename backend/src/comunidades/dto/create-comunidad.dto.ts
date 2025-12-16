import { IsNotEmpty, IsString } from 'class-validator';

export class CreateComunidadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  region: string; // Ej: "Altiplano", "Valle", "Yungas"
}
