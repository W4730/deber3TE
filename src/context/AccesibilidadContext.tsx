import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { guardarCache, leerCache } from '../services/cache';
import { crearTema, PREFERENCIAS_INICIALES, type Preferencias, type Tema } from '../theme';

const CLAVE = 'cartelera:accesibilidad'; // del dispositivo, no de la cuenta

interface ValorAccesibilidad {
  tema: Tema;
  preferencias: Preferencias;
  cambiar: (cambios: Partial<Preferencias>) => void;
}

const AccesibilidadContext = createContext<ValorAccesibilidad | null>(null);

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_INICIALES);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    void (async () => {
      const guardadas = await leerCache<Preferencias>(CLAVE);
      // Primera vez: se respeta "Reducir movimiento" del sistema.
      const reducir = guardadas ? guardadas.reducirMovimiento : await AccessibilityInfo.isReduceMotionEnabled();
      setPreferencias({ ...PREFERENCIAS_INICIALES, ...guardadas, reducirMovimiento: reducir });
      setListo(true);
    })();
  }, []);

  useEffect(() => {
    if (listo) void guardarCache(CLAVE, preferencias);
  }, [listo, preferencias]);

  const cambiar = useCallback((cambios: Partial<Preferencias>) => setPreferencias((p) => ({ ...p, ...cambios })), []);
  const tema = useMemo(() => crearTema(preferencias), [preferencias]);
  const valor = useMemo(() => ({ tema, preferencias, cambiar }), [tema, preferencias, cambiar]);

  // Unos milisegundos en negro evitan mostrar la app con el tamaño o contraste equivocados.
  if (!listo) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  return <AccesibilidadContext value={valor}>{children}</AccesibilidadContext>;
}

export function useAccesibilidad(): ValorAccesibilidad {
  const valor = useContext(AccesibilidadContext);
  if (!valor) throw new Error('useAccesibilidad debe usarse dentro de <AccesibilidadProvider>.');
  return valor;
}

export const useTema = () => useAccesibilidad().tema;

/**
 * Estilos que dependen del tema. `fabrica` debe declararse fuera del componente.
 * Escala fontSize y lineHeight según el tamaño de texto elegido.
 */
export function useEstilos<T>(fabrica: (tema: Tema) => T): T {
  const tema = useTema();
  return useMemo(() => escalar(fabrica(tema), tema.escala), [fabrica, tema]);
}

function escalar<T>(estilos: T, f: number): T {
  if (f === 1) return estilos;
  const resultado: Record<string, object> = {};
  for (const [nombre, estilo] of Object.entries(estilos as Record<string, Record<string, unknown>>)) {
    const { fontSize, lineHeight } = estilo;
    resultado[nombre] = {
      ...estilo,
      ...(typeof fontSize === 'number' && { fontSize: fontSize * f }),
      ...(typeof lineHeight === 'number' && { lineHeight: lineHeight * f }),
    };
  }
  return resultado as T;
}
