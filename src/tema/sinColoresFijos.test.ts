import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Sensor de DESIGN.md: ningún archivo de src/ fuera de src/tema/ escribe un color fijo.
// Detecta hexadecimales (#fff, #0A0A0A, #RRGGBBAA) y rgb()/rgba().
const SRC = join(__dirname, '..');
const TEMA = join(SRC, 'tema');
const COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\(/g;

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ruta === TEMA ? [] : archivos(ruta);
    return /\.(ts|tsx)$/.test(nombre) ? [ruta] : [];
  });
}

describe('colores fijos', () => {
  it('solo src/tema/ define colores', () => {
    const hallazgos = archivos(SRC).flatMap((ruta) =>
      readFileSync(ruta, 'utf8')
        .split('\n')
        .flatMap((linea, i) =>
          [...linea.matchAll(COLOR)].map((m) => `${relative(SRC, ruta).split(sep).join('/')}:${i + 1} ${m[0]}`),
        ),
    );
    expect(hallazgos).toEqual([]);
  });
});
