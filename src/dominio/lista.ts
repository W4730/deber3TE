import type { CambiosItem } from '../types';

export const MAX_COMENTARIO = 500;

/** RF6: solo se califica una obra vista; el comentario se recorta y tiene tope de 500. */
export function normalizarCambios(cambios: CambiosItem): CambiosItem {
  return {
    estado: cambios.estado,
    calificacionPersonal: cambios.estado === 'vista' ? cambios.calificacionPersonal : null,
    comentario: cambios.comentario.trim().slice(0, MAX_COMENTARIO),
  };
}
