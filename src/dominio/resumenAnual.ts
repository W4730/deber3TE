import type { ItemLista } from '../types';
import { tieneDatos } from './vistaEn';

// Reglas D3–D12 del PRD. Funciones puras: sin Firebase, sin React y sin leer la fecha del sistema.

export interface ResumenAnual {
  anio: number;
  totalObras: number;
  peliculas: number;
  series: number;
  horas: number; // con un decimal (D7)
  peliculasSinDuracion: number; // películas con datos y sin duración (P2)
  obrasSinDatos: number; // D6
  generoTop: { nombre: string; obras: number } | null;
  directorTop: { nombre: string; obras: number } | null;
  obrasPorMes: number[]; // 12 posiciones, enero = 0 (D10)
  mesTop: number | null;
  destacada: ItemLista | null; // D11
}

/** D3: año calendario en la hora local del teléfono. */
export const anioDe = (ms: number) => new Date(ms).getFullYear();

const vista = (i: ItemLista): i is ItemLista & { vistaEn: number } => i.estado === 'vista' && i.vistaEn !== null;

/** D4: años con obras vistas más el actual, del más reciente al más antiguo. */
export function aniosDisponibles(items: ItemLista[], anioActual: number): number[] {
  const anios = new Set([anioActual, ...items.filter(vista).map((i) => anioDe(i.vistaEn))]);
  return [...anios].sort((a, b) => b - a);
}

/** D8/D9: gana quien tenga más obras; empate → mayor promedio de calificación (sin calificadas pierde) → alfabético. */
function masVisto(grupos: Map<string, ItemLista[]>): { nombre: string; obras: number } | null {
  const promedio = (obras: ItemLista[]) => {
    const notas = obras.flatMap((o) => (o.calificacionPersonal === null ? [] : [o.calificacionPersonal]));
    return notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : -Infinity;
  };
  const ordenados = [...grupos].sort(
    ([na, a], [nb, b]) => b.length - a.length || promedio(b) - promedio(a) || na.localeCompare(nb, 'es'),
  );
  const [primero] = ordenados;
  return primero ? { nombre: primero[0], obras: primero[1].length } : null;
}

function agrupar(obras: ItemLista[], claves: (o: ItemLista) => string[]): Map<string, ItemLista[]> {
  const grupos = new Map<string, ItemLista[]>();
  for (const o of obras) {
    for (const clave of new Set(claves(o))) grupos.set(clave, [...(grupos.get(clave) ?? []), o]);
  }
  return grupos;
}

export function resumenAnual(items: ItemLista[], anio: number): ResumenAnual {
  const obras = items.filter(vista).filter((i) => anioDe(i.vistaEn) === anio); // D3: cada obra una vez
  const conDatos = obras.filter(tieneDatos);
  const peliculas = obras.filter((o) => o.tipo === 'movie');
  const peliculasConDatos = peliculas.filter(tieneDatos);

  // D7
  const minutos = peliculasConDatos.reduce((total, p) => total + (p.duracionMin ?? 0), 0);

  // D10
  const obrasPorMes = Array.from({ length: 12 }, () => 0);
  for (const o of obras) obrasPorMes[new Date(o.vistaEn).getMonth()] += 1;
  const maximo = Math.max(...obrasPorMes);
  const mesTop = maximo > 0 ? obrasPorMes.lastIndexOf(maximo) : null; // empate → el más reciente

  // D11
  const [destacada = null] = obras
    .filter((o) => o.calificacionPersonal !== null)
    .sort(
      (a, b) =>
        (b.calificacionPersonal ?? 0) - (a.calificacionPersonal ?? 0) ||
        b.vistaEn - a.vistaEn ||
        a.titulo.localeCompare(b.titulo, 'es'),
    );

  return {
    anio,
    totalObras: obras.length,
    peliculas: peliculas.length,
    series: obras.length - peliculas.length,
    horas: Math.round((minutos / 60) * 10) / 10,
    peliculasSinDuracion: peliculasConDatos.filter((p) => p.duracionMin === null).length,
    obrasSinDatos: obras.length - conDatos.length,
    generoTop: masVisto(agrupar(conDatos, (o) => o.generos ?? [])),
    directorTop: masVisto(agrupar(peliculasConDatos, (o) => o.directores)),
    obrasPorMes,
    mesTop,
    destacada,
  };
}
