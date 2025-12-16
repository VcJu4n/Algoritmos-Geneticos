export type TipoAyuda =
  | 'SIEMBRA'
  | 'COSECHA'
  | 'RIEGO'
  | 'LIMPIEZA_CANAL'
  | 'CONSTRUCCION'
  | 'PRESTAMO_HERRAMIENTA'
  | 'PRESTAMO_ANIMAL'
  | 'OTRA';

export type EstadoAyuda = 'PROGRAMADO' | 'REALIZADO' | 'CANCELADO';

export class CreateAyudaDto {
  origenId: number;      // familia que ayuda
  destinoId: number;     // familia que recibe
  solicitudId?: number;  // opcional, puede venir de una SolicitudAyuda
  tipo: TipoAyuda;
  fecha: Date;
  horas: number;
  estado?: EstadoAyuda;  // por defecto PROGRAMADO si no se envía
}
