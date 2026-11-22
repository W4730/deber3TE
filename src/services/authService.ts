import { FirebaseError } from 'firebase/app';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';
import type { DatosRegistro } from '../types';
import { SinConexionError, auth } from './firebase';
import { UsuarioOcupadoError, guardarPerfil, usuarioDisponible } from './perfilService';

export type { User };

const MENSAJES: Record<string, string> = {
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es demasiado débil.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet y vuelve a intentarlo.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a escribir tu contraseña actual.',
  'auth/operation-not-allowed': 'Esta operación no está habilitada en Firebase.',
  'permission-denied': 'No tienes permiso para hacer este cambio.',
  unavailable: 'Sin conexión. Revisa tu internet y vuelve a intentarlo.', // Firestore sin red
};

/** `extra` permite ajustar el mensaje según la pantalla (p. ej. "contraseña actual incorrecta"). */
export function traducirErrorAuth(error: unknown, extra: Record<string, string> = {}): string {
  if (error instanceof UsuarioOcupadoError) return 'Ese nombre de usuario ya está en uso. Elige otro.';
  if (error instanceof SinConexionError) return 'Sin conexión. Revisa tu internet y vuelve a intentarlo.';
  const codigo = error instanceof FirebaseError ? error.code : '';
  return extra[codigo] ?? MENSAJES[codigo] ?? 'No se pudo completar la operación. Vuelve a intentarlo.';
}

export const iniciarSesion = (correo: string, clave: string) => signInWithEmailAndPassword(auth, correo.trim(), clave);

/** Crea la cuenta, pide verificar el correo y guarda el perfil con el nombre de usuario reservado. */
export async function registrar({ correo, clave, nombre, apellido, usuario }: DatosRegistro): Promise<void> {
  if (!(await usuarioDisponible(usuario))) throw new UsuarioOcupadoError();
  const { user } = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
  void sendEmailVerification(user).catch(() => {});
  const guardar = () => guardarPerfil(user.uid, { nombre, apellido, usuario, foto: null }, null);
  await guardar()
    .catch(async (error: unknown) => {
      // Justo después de crear la cuenta, Firestore puede seguir con las credenciales anteriores
      // y rechazar el lote; con un momento de espera ya las tiene.
      if (!(error instanceof FirebaseError && error.code === 'permission-denied')) throw error;
      await new Promise((listo) => setTimeout(listo, 1500));
      return guardar();
    })
    // Si aun así falla (sin red o el usuario se tomó en ese instante), Perfil pide completarlo.
    .catch(() => {});
}

export const cerrarSesion = () => signOut(auth);

/** Devuelve la función para dejar de escuchar. */
export const escucharSesion = (alCambiar: (usuario: User | null) => void) => onAuthStateChanged(auth, alCambiar);

// ---------- Seguridad de la cuenta ----------

/** Firebase exige un inicio de sesión reciente para cambiar correo o contraseña. */
async function reautenticar(claveActual: string): Promise<User> {
  const usuario = auth.currentUser;
  if (!usuario?.email) throw new Error('No hay una sesión activa.');
  await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, claveActual));
  return usuario;
}

/** El correo cambia cuando el usuario abre el enlace que llega a la dirección nueva. */
export async function cambiarCorreo(claveActual: string, nuevoCorreo: string): Promise<void> {
  await verifyBeforeUpdateEmail(await reautenticar(claveActual), nuevoCorreo.trim());
}

export async function cambiarClave(claveActual: string, nuevaClave: string): Promise<void> {
  await updatePassword(await reautenticar(claveActual), nuevaClave);
}

export async function reenviarVerificacion(): Promise<void> {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

/** Vuelve a leer la cuenta desde Firebase (por ejemplo, tras verificar el correo). */
export async function correoVerificado(): Promise<boolean> {
  await auth.currentUser?.reload();
  return auth.currentUser?.emailVerified ?? false;
}
