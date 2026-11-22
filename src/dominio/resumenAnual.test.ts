import { describe, expect, it } from 'vitest';
import type { ItemLista } from '../types';
import { anioDe, aniosDisponibles, resumenAnual } from './resumenAnual';

// Los tests corren con TZ=America/Guayaquil (UTC-5), ver vitest.config.ts.
const fecha = (anio: number, mes: number, dia = 15, hora = 12) => new Date(anio, mes - 1, dia, hora).getTime();

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
    actualizadoEn: fecha(2026, 1),
    vistaEn: fecha(2026, 3),
    generos: ['Drama'],
    duracionMin: 100,
    directores: ['Ana Directora'],
    ...cambios,
  };
}
const serie = (cambios: Partial<ItemLista> = {}) => obra({ tipo: 'tv', duracionMin: null, directores: [], ...cambios });

describe('D3 · año de una obra', () => {
  it('usa la hora local: el 31-dic 23:30 en Ecuador es del año que termina', () => {
    const instante = Date.UTC(2026, 0, 1, 4, 30); // = 2025-12-31 23:30 en UTC-5
    expect(anioDe(instante)).toBe(2025);
  });

  it('cuenta solo obras vistas con fecha en el año elegido, una vez cada una', () => {
    const items = [
      obra({ vistaEn: fecha(2026, 2) }),
      serie({ vistaEn: fecha(2026, 5) }),
      obra({ vistaEn: fecha(2025, 7) }),
      obra({ estado: 'viendo', vistaEn: null }),
      obra({ estado: 'por_ver', vistaEn: null }),
    ];
    const r = resumenAnual(items, 2026);
    expect(r.anio).toBe(2026);
    expect(r.totalObras).toBe(2);
    expect(r.peliculas).toBe(1);
    expect(r.series).toBe(1);
  });
});

describe('D4 · años disponibles', () => {
  it('incluye los años con obras vistas más el actual, del más reciente al más antiguo', () => {
    const items = [
      obra({ vistaEn: fecha(2024, 4) }),
      obra({ vistaEn: fecha(2024, 9) }),
      obra({ vistaEn: fecha(2022, 1) }),
    ];
    expect(aniosDisponibles(items, 2026)).toEqual([2026, 2024, 2022]);
  });

  it('sin obras vistas solo ofrece el año actual', () => {
    expect(aniosDisponibles([obra({ estado: 'por_ver', vistaEn: null })], 2026)).toEqual([2026]);
  });

  it('no repite el año actual si también tiene obras', () => {
    expect(aniosDisponibles([obra({ vistaEn: fecha(2026, 1) })], 2026)).toEqual([2026]);
  });
});

describe('D6 · obras sin datos de TMDB', () => {
  it('cuentan en el total pero no en horas, género ni director', () => {
    const items = [
      obra({ generos: ['Terror'], duracionMin: 90, directores: ['Uno'] }),
      obra({ generos: null, duracionMin: null, directores: [] }),
    ];
    const r = resumenAnual(items, 2026);
    expect(r.totalObras).toBe(2);
    expect(r.obrasSinDatos).toBe(1);
    expect(r.horas).toBe(1.5);
    expect(r.peliculasSinDuracion).toBe(0); // P2: la sin datos no cuenta dos veces
    expect(r.generoTop).toEqual({ nombre: 'Terror', obras: 1 });
  });
});

describe('D7 · horas de cine', () => {
  it('suma solo películas, en horas con un decimal', () => {
    const items = [obra({ duracionMin: 120 }), obra({ duracionMin: 105 }), serie({ vistaEn: fecha(2026, 4) })];
    expect(resumenAnual(items, 2026).horas).toBe(3.8); // 225 min = 3,75 h → 3,8
  });

  it('una película sin duración no suma y se cuenta aparte', () => {
    const r = resumenAnual([obra({ duracionMin: 60 }), obra({ duracionMin: null })], 2026);
    expect(r.horas).toBe(1);
    expect(r.peliculasSinDuracion).toBe(1);
  });

  it('sin películas las horas son 0', () => {
    expect(resumenAnual([serie()], 2026).horas).toBe(0);
  });
});

describe('D8 · género más visto', () => {
  it('cada obra suma 1 a cada uno de sus géneros y gana el que tiene más obras', () => {
    const items = [
      obra({ generos: ['Drama', 'Crimen'] }),
      obra({ generos: ['Crimen'] }),
      serie({ generos: ['Crimen', 'Misterio'] }),
    ];
    expect(resumenAnual(items, 2026).generoTop).toEqual({ nombre: 'Crimen', obras: 3 });
  });

  it('empate: gana el de mayor promedio de calificación personal', () => {
    const items = [
      obra({ generos: ['Terror'], calificacionPersonal: 2 }),
      obra({ generos: ['Comedia'], calificacionPersonal: 5 }),
    ];
    expect(resumenAnual(items, 2026).generoTop?.nombre).toBe('Comedia');
  });

  it('empate: un género sin obras calificadas pierde', () => {
    const items = [obra({ generos: ['Acción'] }), obra({ generos: ['Terror'], calificacionPersonal: 1 })];
    expect(resumenAnual(items, 2026).generoTop?.nombre).toBe('Terror');
  });

  it('si persiste el empate, orden alfabético', () => {
    const items = [obra({ generos: ['Western'] }), obra({ generos: ['Animación'] })];
    expect(resumenAnual(items, 2026).generoTop?.nombre).toBe('Animación');
  });

  it('sin géneros devuelve null', () => {
    expect(resumenAnual([obra({ generos: [] })], 2026).generoTop).toBeNull();
  });
});

describe('D9 · director más visto', () => {
  it('solo cuentan películas; las series no suman', () => {
    const items = [
      obra({ directores: ['Villeneuve'] }),
      obra({ directores: ['Villeneuve', 'Otro'] }),
      serie({ directores: ['Otro'] }),
    ];
    expect(resumenAnual(items, 2026).directorTop).toEqual({ nombre: 'Villeneuve', obras: 2 });
  });

  it('usa el mismo desempate que D8', () => {
    const items = [
      obra({ directores: ['Zeta'], calificacionPersonal: 4 }),
      obra({ directores: ['Alfa'], calificacionPersonal: 3 }),
    ];
    expect(resumenAnual(items, 2026).directorTop?.nombre).toBe('Zeta');
  });

  it('sin directores en ninguna película devuelve null', () => {
    expect(resumenAnual([obra({ directores: [] }), serie()], 2026).directorTop).toBeNull();
  });
});

describe('D10 · mes más activo', () => {
  it('devuelve 12 meses, también los de 0, y el mes con más obras', () => {
    const items = [
      obra({ vistaEn: fecha(2026, 3) }),
      obra({ vistaEn: fecha(2026, 3) }),
      obra({ vistaEn: fecha(2026, 10) }),
    ];
    const r = resumenAnual(items, 2026);
    expect(r.obrasPorMes).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0]);
    expect(r.mesTop).toBe(2); // marzo, índice 2
  });

  it('empate: gana el mes más reciente', () => {
    const items = [obra({ vistaEn: fecha(2026, 2) }), obra({ vistaEn: fecha(2026, 11) })];
    expect(resumenAnual(items, 2026).mesTop).toBe(10);
  });

  it('sin obras, mesTop es null (P3)', () => {
    const r = resumenAnual([], 2026);
    expect(r.obrasPorMes).toHaveLength(12);
    expect(r.mesTop).toBeNull();
  });
});

describe('D11 · obra destacada', () => {
  it('es la de mayor calificación personal', () => {
    const mejor = obra({ calificacionPersonal: 5 });
    expect(resumenAnual([obra({ calificacionPersonal: 3 }), mejor], 2026).destacada?.id).toBe(mejor.id);
  });

  it('empate: la de vistaEn más reciente', () => {
    const reciente = obra({ calificacionPersonal: 5, vistaEn: fecha(2026, 8) });
    const items = [obra({ calificacionPersonal: 5, vistaEn: fecha(2026, 2) }), reciente];
    expect(resumenAnual(items, 2026).destacada?.id).toBe(reciente.id);
  });

  it('si también empata la fecha, gana el título alfabético (P4)', () => {
    const a = obra({ titulo: 'Amélie', calificacionPersonal: 4 });
    const z = obra({ titulo: 'Zodiac', calificacionPersonal: 4 });
    expect(resumenAnual([z, a], 2026).destacada?.id).toBe(a.id);
  });

  it('sin obras calificadas devuelve null', () => {
    expect(resumenAnual([obra()], 2026).destacada).toBeNull();
  });
});

describe('D12 · año vacío', () => {
  it('un año sin obras vistas devuelve totales en 0', () => {
    const r = resumenAnual([obra({ vistaEn: fecha(2025, 5) })], 2023);
    expect(r).toMatchObject({
      totalObras: 0,
      peliculas: 0,
      series: 0,
      horas: 0,
      generoTop: null,
      directorTop: null,
      destacada: null,
    });
  });
});
