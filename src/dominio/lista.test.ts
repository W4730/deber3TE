import { describe, expect, it } from 'vitest';
import { normalizarCambios } from './lista';

// RF6 del Proyecto 3: solo se califica si el estado es vista; el comentario tiene tope de 500.
describe('normalizarCambios', () => {
  it('conserva la calificación cuando la obra está vista', () => {
    expect(normalizarCambios({ estado: 'vista', calificacionPersonal: 4, comentario: '' }).calificacionPersonal).toBe(
      4,
    );
  });

  it.each(['por_ver', 'viendo'] as const)('borra la calificación cuando el estado es %s', (estado) => {
    expect(normalizarCambios({ estado, calificacionPersonal: 5, comentario: '' }).calificacionPersonal).toBeNull();
  });

  it('quita espacios del comentario y lo corta en 500 caracteres', () => {
    const { comentario } = normalizarCambios({
      estado: 'viendo',
      calificacionPersonal: null,
      comentario: `  ${'a'.repeat(600)}  `,
    });
    expect(comentario).toHaveLength(500);
    expect(comentario.startsWith('a')).toBe(true);
  });
});
