import type { EstadoAyuda, TipoAyuda, Urgencia } from '../types';

export const tipoAyudaLabels: Record<TipoAyuda, string> = {
  SIEMBRA: 'Siembra',
  COSECHA: 'Cosecha',
  RIEGO: 'Riego',
  LIMPIEZA_CANAL: 'Limpieza de canal',
  CONSTRUCCION: 'Construcción',
  PRESTAMO_HERRAMIENTA: 'Préstamo de herramienta',
  PRESTAMO_ANIMAL: 'Préstamo de animal',
  OTRA: 'Otra ayuda',
};

export const tipoAyudaOptions = Object.entries(tipoAyudaLabels).map(([value, label]) => ({
  value: value as TipoAyuda,
  label,
}));

export const urgenciaLabels: Record<Urgencia, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const urgenciaOptions = Object.entries(urgenciaLabels).map(([value, label]) => ({
  value: value as Urgencia,
  label,
}));

export const estadoAyudaLabels: Record<EstadoAyuda, string> = {
  PROGRAMADO: 'Programado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
};
