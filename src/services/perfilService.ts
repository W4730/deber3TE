import { doc, getDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Perfil } from '../types';
import { guardarCache, leerCache } from './cache';
import { SinConexionError, conTiempoMaximo, db } from './firebase';

const docPerfil = (uid: string) => doc(db, 'usuarios', uid);
// Un documento por nombre de usuario: las reglas impiden crearlo si ya existe, así no hay dos iguales.
const docUsuario = (usuario: string) => doc(db, 'nombresUsuario', usuario);

export class UsuarioOcupadoError extends Error {}

export async function usuarioDisponible(usuario: string, uid?: string): Promise<boolean> {
  const snap = await conTiempoMaximo(getDoc(docUsuario(usuario)));
  return !snap.exists() || snap.data().uid === uid;
}

/**
 * Crea o actualiza el perfil. Si cambia el usuario, en el mismo lote atómico
 * reserva el nuevo y libera el anterior. 'pendiente' = sin red: Firestore lo envía al reconectar.
 */
export async function guardarPerfil(
  uid: string,
  datos: Perfil,
  anterior: Perfil | null,
): Promise<'guardado' | 'pendiente'> {
  const cambiaUsuario = datos.usuario !== anterior?.usuario;
  if (cambiaUsuario && !(await usuarioDisponible(datos.usuario, uid))) throw new UsuarioOcupadoError();

  const lote = writeBatch(db);
  if (cambiaUsuario) {
    lote.set(docUsuario(datos.usuario), { uid });
    if (anterior) lote.delete(docUsuario(anterior.usuario));
  }
  lote.set(
    docPerfil(uid),
    {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      usuario: datos.usuario,
      foto: datos.foto,
      actualizadoEn: serverTimestamp(),
      ...(anterior ? {} : { creadoEn: serverTimestamp() }),
    },
    { merge: true },
  );
  try {
    await conTiempoMaximo(lote.commit());
    return 'guardado';
  } catch (error) {
    if (error instanceof SinConexionError) return 'pendiente';
    throw error;
  }
}

/** Escucha el perfil en tiempo real. null = la cuenta todavía no tiene perfil. */
export function escucharPerfil(uid: string, alCambiar: (perfil: Perfil | null) => void): () => void {
  return onSnapshot(
    docPerfil(uid),
    (snap) => {
      if (!snap.exists()) {
        if (!snap.metadata.fromCache) alCambiar(null); // sin red no se sabe si existe
        return;
      }
      const d = snap.data();
      alCambiar({ nombre: d.nombre ?? '', apellido: d.apellido ?? '', usuario: d.usuario ?? '', foto: d.foto ?? null });
    },
    () => {}, // sin red o sin permisos: se queda la copia local
  );
}

const claveCache = (uid: string) => `cartelera:perfil:${uid}`;
export const leerCachePerfil = (uid: string) => leerCache<Perfil>(claveCache(uid));
export const guardarCachePerfil = (uid: string, perfil: Perfil) => guardarCache(claveCache(uid), perfil);
