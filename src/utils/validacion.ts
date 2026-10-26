// Mismas reglas que firestore.rules: la app avisa antes, el servidor tiene la última palabra.

export const USUARIO_VALIDO = /^[a-z0-9_.]{3,20}$/;
export const MAX_NOMBRE = 40;

/** Solo minúsculas, números, punto y guion bajo (se aplica mientras se escribe). */
export const limpiarUsuario = (valor: string) => valor.toLowerCase().replace(/[^a-z0-9_.]/g, '');

export const errorCorreo = (correo: string) =>
  /^\S+@\S+\.\S+$/.test(correo.trim()) ? null : 'Escribe un correo válido, por ejemplo nombre@correo.com.';

export function errorClaveNueva(clave: string): string | null {
  if (clave.length < 8) return 'Usa al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'Combina letras y números.';
  return null;
}

export const errorConfirmacion = (clave: string, confirmacion: string) =>
  clave === confirmacion ? null : 'Las contraseñas no coinciden.';

export function errorNombre(valor: string, campo: 'nombre' | 'apellido'): string | null {
  const limpio = valor.trim();
  if (!limpio) return `Escribe tu ${campo}.`;
  if (limpio.length > MAX_NOMBRE) return `Máximo ${MAX_NOMBRE} caracteres.`;
  return null;
}

export const errorUsuario = (usuario: string) =>
  USUARIO_VALIDO.test(usuario) ? null : 'Entre 3 y 20 caracteres: minúsculas, números, punto o guion bajo.';

/** Quita las entradas sin error; si queda vacío, el formulario es válido. */
export function soloErrores<T extends string>(errores: Record<T, string | null>): Partial<Record<T, string>> {
  return Object.fromEntries(Object.entries(errores).filter(([, v]) => v)) as Partial<Record<T, string>>;
}
