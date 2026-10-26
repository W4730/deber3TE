import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { EstadoPeticion } from '../types';

/**
 * Ejecuta `cargar` al montar y cada vez que cambia `clave`, y expone cargando / error / éxito.
 * Con `cargar = null` no pide nada. Descarta respuestas de una clave anterior.
 */
export function usePeticion<T>(clave: string, cargar: (() => Promise<T>) | null) {
  const activo = cargar !== null;
  const [intento, setIntento] = useState(0);
  // Cada respuesta recuerda para qué petición era; si no coincide con la actual, se está cargando.
  const [respuesta, setRespuesta] = useState<{ para: string; estado: EstadoPeticion<T> } | null>(null);
  const ejecutar = useEffectEvent(() => (cargar ? cargar() : null));
  const peticionActual = `${activo}:${clave}#${intento}`;

  useEffect(() => {
    const promesa = ejecutar();
    if (!promesa) return;
    let vigente = true;
    promesa.then(
      (datos) => vigente && setRespuesta({ para: peticionActual, estado: { estado: 'exito', datos } }),
      (e: unknown) =>
        vigente &&
        setRespuesta({
          para: peticionActual,
          estado: { estado: 'error', mensaje: e instanceof Error ? e.message : 'Algo salió mal.' },
        }),
    );
    return () => {
      vigente = false;
    };
  }, [peticionActual]);

  const estado: EstadoPeticion<T> = !activo
    ? { estado: 'inactivo' }
    : respuesta?.para === peticionActual
      ? respuesta.estado
      : { estado: 'cargando' };

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return [estado, reintentar] as const;
}
