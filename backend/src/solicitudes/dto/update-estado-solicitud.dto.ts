export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'PLANIFICADA'
  | 'COMPLETADA'
  | 'CANCELADA';

export class UpdateEstadoSolicitudDto {
  estado: EstadoSolicitud;
}
