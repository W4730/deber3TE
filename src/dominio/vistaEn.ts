import type { EstadoVisionado, ItemLista } from '../types';

/** D1: qué hacer con vistaEn al cambiar de estado. */
export type CambioVistaEn = 'fijar' | 'borrar' | 'mantener';

export function cambioVistaEn(anterior: EstadoVisionado, nuevo: EstadoVisionado): CambioVistaEn {
  if (nuevo === 'vista') return anterior === 'vista' ? 'mantener' : 'fijar';
  return anterior === 'vista' ? 'borrar' : 'mantener';
}

/** P1: una obra "sin datos" es la que no tiene el campo generos. */
export const tieneDatos = (item: ItemLista) => item.generos !== null;

/**
 * Lo que hay que hacer al abrir Mi año en cine.
 * - fechas (D2): obras vistas sin vistaEn; recibirán vistaEn = actualizadoEn.
 * - datos (D6): obras vistas del año elegido sin datos de TMDB.
 * Sin conexión no se hace nada (D13).
 */
export function tareasAlAbrir(
  items: ItemLista[],
  anio: number,
  sinConexion: boolean,
): { fechas: ItemLista[]; datos: ItemLista[] } {
  if (sinConexion) return { fechas: [], datos: [] };
  const vistas = items.filter((i) => i.estado === 'vista');
  return {
    fechas: vistas.filter((i) => i.vistaEn === null),
    // Una obra que D2 está por migrar cuenta en el año de su actualizadoEn.
    datos: vistas.filter((i) => !tieneDatos(i) && new Date(i.vistaEn ?? i.actualizadoEn).getFullYear() === anio),
  };
}
