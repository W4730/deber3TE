import {
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
  type Timestamp,
} from 'firebase/firestore';
import type { CambiosItem, ItemLista, Obra, TipoObra } from '../types';
import { guardarCache, leerCache } from './cache';
import { conTiempoMaximo, db } from './firebase';

const coleccion = (uid: string) => collection(db, 'usuarios', uid, 'mi_lista');

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
  };
}

export async function obtener(uid: string): Promise<ItemLista[]> {
  const snap = await conTiempoMaximo(getDocs(query(coleccion(uid), orderBy('agregadoEn', 'desc'))));
  return snap.docs.map(aItem);
}

export async function agregar(uid: string, obra: Obra): Promise<void> {
  await conTiempoMaximo(
    setDoc(doc(coleccion(uid), crearItemId(obra.tipo, obra.tmdbId)), {
      ...soloObra(obra),
      estado: 'por_ver',
      calificacionPersonal: null,
      comentario: '',
      agregadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    }),
  );
}

export async function actualizar(uid: string, itemId: string, cambios: CambiosItem): Promise<void> {
  await conTiempoMaximo(
    updateDoc(doc(coleccion(uid), itemId), { ...cambios, actualizadoEn: serverTimestamp() }),
  );
}

export async function eliminar(uid: string, itemId: string): Promise<void> {
  await conTiempoMaximo(deleteDoc(doc(coleccion(uid), itemId)));
}

// ---------- Copia local (RF8) ----------

const claveCache = (uid: string) => `cartelera:lista:${uid}`;
export const leerCacheLista = (uid: string) => leerCache<ItemLista[]>(claveCache(uid));
export const guardarCacheLista = (uid: string, lista: ItemLista[]) => guardarCache(claveCache(uid), lista);
