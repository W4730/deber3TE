import { describe, expect, it } from 'vitest';
import type { ItemLista } from '../types';
import { cambioVistaEn, tareasAlAbrir, tieneDatos } from './vistaEn';

const fecha = (anio: number, mes: number) => new Date(anio, mes - 1, 15, 12).getTime();

let id = 0;
function obra(cambios: Partial<ItemLista> = {}): ItemLista {
  id += 1;
  return {
    id: `movie_${id}`,
    tmdbId: id,
    tipo: 'movie',
    titulo: `Obra ${id}`,
    anio: '2020',
    posterPath: null,
    estado: 'vista',
    calificacionPersonal: null,
    comentario: '',
    agregadoEn: fecha(2026, 1),
    actualizadoEn: fecha(2026, 4),
    vistaEn: fecha(2026, 3),
    generos: ['Drama'],
    duracionMin: 100,
    directores: [],
    ...cambios,
  };
}

describe('D1 · cambioVistaEn', () => {
  it('pasar a vista fija la fecha', () => {
    expect(cambioVistaEn('por_ver', 'vista')).toBe('fijar');
    expect(cambioVistaEn('viendo', 'vista')).toBe('fijar');
  });

  it('dejar de estar vista la borra', () => {
    expect(cambioVistaEn('vista', 'viendo')).toBe('borrar');
    expect(cambioVistaEn('vista', 'por_ver')).toBe('borrar');
  });

  it('seguir vista (editar calificación o comentario) no la cambia', () => {
    expect(cambioVistaEn('vista', 'vista')).toBe('mantener');
  });

  it('cambios entre estados no vistos no la tocan', () => {
    expect(cambioVistaEn('por_ver', 'viendo')).toBe('mantener');
  });
});

describe('P1 · tieneDatos', () => {
  it('sin el campo generos no hay datos; una lista vacía sí cuenta como datos', () => {
    expect(tieneDatos(obra({ generos: null }))).toBe(false);
    expect(tieneDatos(obra({ generos: [] }))).toBe(true);
  });
});

describe('D2 · tareasAlAbrir › fechas', () => {
  it('selecciona las obras vistas sin vistaEn', () => {
    const sinFecha = obra({ vistaEn: null });
    const items = [sinFecha, obra(), obra({ estado: 'viendo', vistaEn: null })];
    expect(tareasAlAbrir(items, 2026, false).fechas.map((i) => i.id)).toEqual([sinFecha.id]);
  });

  it('cuando ya se migró no hay nada que hacer', () => {
    expect(tareasAlAbrir([obra(), obra()], 2026, false).fechas).toEqual([]);
  });
});

describe('D6 · tareasAlAbrir › datos', () => {
  it('selecciona las obras vistas del año elegido que no tienen datos', () => {
    const delAnio = obra({ generos: null });
    const otroAnio = obra({ generos: null, vistaEn: fecha(2024, 6) });
    const items = [delAnio, otroAnio, obra(), obra({ estado: 'viendo', vistaEn: null, generos: null })];
    expect(tareasAlAbrir(items, 2026, false).datos.map((i) => i.id)).toEqual([delAnio.id]);
  });

  it('una obra por migrar (D2) cuenta en el año de su actualizadoEn', () => {
    const porMigrar = obra({ vistaEn: null, generos: null, actualizadoEn: fecha(2026, 9) });
    expect(tareasAlAbrir([porMigrar], 2026, false).datos.map((i) => i.id)).toEqual([porMigrar.id]);
  });
});

describe('D13 · sin conexión', () => {
  it('no se migran fechas ni se completan datos', () => {
    const items = [obra({ vistaEn: null }), obra({ generos: null })];
    expect(tareasAlAbrir(items, 2026, true)).toEqual({ fechas: [], datos: [] });
  });
});
