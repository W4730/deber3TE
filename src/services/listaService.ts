import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { CambioVistaEn } from '../dominio/vistaEn';
import type { CambiosItem, DatosObra, ItemLista, Obra, TipoObra } from '../types';
import { guardarCache, leerCache } from './cache';
import { conTiempoMaximo, db } from './firebase';

const coleccion = (uid: string) => collection(db, 'usuarios', uid, 'mi_lista');
const documento = (uid: string, itemId: string) => doc(coleccion(uid), itemId);

/** movie_550, tv_1399: TMDB numera aparte películas y series, y el id fijo evita duplicados. */
export const crearItemId = (tipo: TipoObra, tmdbId: number) => `${tipo}_${tmdbId}`;

/** Solo los campos de Obra (los objetos de TMDB traen más datos que no se guardan). */
export const soloObra = ({ tmdbId, tipo, titulo, anio, posterPath }: Obra): Obra => ({
  tmdbId,
  tipo,
  titulo,
  anio,
  posterPath,
});

/** Valores de un documento creado antes de la épica Mi año en cine (los campos no existen). */
export const SIN_DATOS: DatosObra & Pick<ItemLista, 'vistaEn'> = {
  vistaEn: null,
  generos: null, // P1: sin el campo generos = sin datos de TMDB
  duracionMin: null,
  directores: [],
};

const aMs = (t: Timestamp | null | undefined) => t?.toMillis() ?? Date.now();

function aItem(snap: QueryDocumentSnapshot): ItemLista {
  const d = snap.data({ serverTimestamps: 'estimate' });
  return {
    id: snap.id,
    tmdbId: d.tmdbId,
    tipo: d.tipo,
    titulo: d.titulo,
    anio: d.anio,
    posterPath: d.posterPath ?? null,
    estado: d.estado,
    calificacionPersonal: d.calificacionPersonal ?? null,
    comentario: d.comentario ?? '',
    agregadoEn: aMs(d.agregadoEn),
    actualizadoEn: aMs(d.actualizadoEn),
    vistaEn: d.vistaEn ? aMs(d.vistaEn) : null,
    generos: Array.isArray(d.generos) ? d.generos : null,
    duracionMin: typeof d.duracionMin === 'number' ? d.duracionMin : null,
    directores: Array.isArray(d.directores) ? d.directores : [],
  };
}

export async function obtener(uid: string): Promise<ItemLista[]> {
  const snap = await conTiempoMaximo(getDocs(query(coleccion(uid), orderBy('agregadoEn', 'desc'))));
  return snap.docs.map(aItem);
}

/** D5: guarda los datos de TMDB si se tienen; si no, omite generos y D6 los completará. */
export async function agregar(uid: string, obra: Obra, datos: DatosObra | null): Promise<void> {
  await conTiempoMaximo(
    setDoc(documento(uid, crearItemId(obra.tipo, obra.tmdbId)), {
      ...soloObra(obra),
      estado: 'por_ver',
      calificacionPersonal: null,
      comentario: '',
      vistaEn: null,
      ...(datos?.generos ? datos : { duracionMin: null, directores: [] }),
      agregadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    }),
  );
}

/** D1: 'fijar' pone la hora del servidor, 'borrar' vuelve a null y 'mantener' no toca vistaEn. */
export async function actualizar(
  uid: string,
  itemId: string,
  cambios: CambiosItem,
  cambio: CambioVistaEn,
): Promise<void> {
  const vistaEn = cambio === 'fijar' ? { vistaEn: serverTimestamp() } : cambio === 'borrar' ? { vistaEn: null } : {};
  await conTiempoMaximo(
    updateDoc(documento(uid, itemId), { ...cambios, ...vistaEn, actualizadoEn: serverTimestamp() }),
  );
}

/** D2: obras vistas antes de la épica. vistaEn copia el actualizadoEn anterior (P5). */
export async function fijarVistaEn(uid: string, itemId: string, actualizadoEnMs: number): Promise<void> {
  await conTiempoMaximo(
    updateDoc(documento(uid, itemId), {
      vistaEn: Timestamp.fromMillis(actualizadoEnMs),
      actualizadoEn: serverTimestamp(),
    }),
  );
}

/** D6: completa los datos de TMDB de una obra ya guardada. */
export async function completarDatos(uid: string, itemId: string, datos: DatosObra): Promise<void> {
  await conTiempoMaximo(updateDoc(documento(uid, itemId), { ...datos, actualizadoEn: serverTimestamp() }));
}

export async function eliminar(uid: string, itemId: string): Promise<void> {
  await conTiempoMaximo(deleteDoc(documento(uid, itemId)));
}

// ---------- Copia local (RF8) ----------

const claveCache = (uid: string) => `cartelera:lista:${uid}`;
/** Las copias guardadas antes de la épica no tienen los campos nuevos: se completan con SIN_DATOS. */
export const leerCacheLista = async (uid: string) =>
  (await leerCache<ItemLista[]>(claveCache(uid)))?.map((i) => ({ ...SIN_DATOS, ...i })) ?? null;
export const guardarCacheLista = (uid: string, lista: ItemLista[]) => guardarCache(claveCache(uid), lista);
