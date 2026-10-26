import type {
  DetalleObra,
  PaginaBusqueda,
  ResultadoBusqueda,
  TipoObra,
  TmdbDetalle,
  TmdbPagina,
  TmdbResultado,
} from '../types';

const API = 'https://api.themoviedb.org/3';
// ponytail: images.secure_base_url de /configuration fijo; pedir /configuration al iniciar si TMDB lo cambiara.
const IMAGENES = 'https://image.tmdb.org/t/p/';
const IDIOMA = 'es-MX';

/** Tamaños de /configuration: pequeños para listas, grandes para el detalle. */
export type TamanoImagen = 'w185' | 'w342' | 'w500' | 'w780';

export function urlImagen(path: string | null, tamano: TamanoImagen): string | null {
  return path ? `${IMAGENES}${tamano}${path}` : null;
}

async function pedir<T>(ruta: string, params: Record<string, string>): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  if (!token) throw new Error('Falta EXPO_PUBLIC_TMDB_TOKEN en el archivo .env.');

  const query = Object.entries({ language: IDIOMA, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API}${ruta}?${query}`, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    });
  } catch {
    throw new Error('Sin conexión. Revisa tu internet y vuelve a intentarlo.');
  }
  if (respuesta.status === 429) throw new Error('TMDB recibió demasiadas peticiones. Espera unos segundos.');
  if (respuesta.status === 401) throw new Error('El token de TMDB no es válido. Revisa tu archivo .env.');
  if (!respuesta.ok) throw new Error(`TMDB no respondió (error ${respuesta.status}).`);
  return (await respuesta.json()) as T;
}

const anioDe = (r: Pick<TmdbResultado, 'release_date' | 'first_air_date'>) =>
  (r.release_date || r.first_air_date || '').slice(0, 4);

const esObra = (r: TmdbResultado): r is TmdbResultado & { media_type: TipoObra } =>
  r.media_type === 'movie' || r.media_type === 'tv';

/** Búsqueda combinada de películas y series (se descartan personas). */
export async function buscar(titulo: string, pagina = 1): Promise<PaginaBusqueda> {
  const r = await pedir<TmdbPagina<TmdbResultado>>('/search/multi', {
    query: titulo,
    page: String(pagina),
    include_adult: 'false',
  });
  const resultados: ResultadoBusqueda[] = r.results.filter(esObra).map((x) => ({
    tmdbId: x.id,
    tipo: x.media_type,
    titulo: x.title ?? x.name ?? 'Sin título',
    anio: anioDe(x),
    posterPath: x.poster_path,
    calificacion: x.vote_average,
  }));
  return { resultados, pagina: r.page, totalPaginas: r.total_pages, total: r.total_results };
}

function duracion(d: TmdbDetalle): string {
  if (d.runtime) return d.runtime < 60 ? `${d.runtime} min` : `${Math.floor(d.runtime / 60)} h ${d.runtime % 60} min`;
  if (d.number_of_seasons) return `${d.number_of_seasons} ${d.number_of_seasons === 1 ? 'temporada' : 'temporadas'}`;
  return '';
}

// Detalle y Editar piden la misma obra; se guarda en memoria para no repetir la petición.
const detalles = new Map<string, DetalleObra>();

/** Detalle + elenco + videos en una sola petición (append_to_response). */
export async function obtenerDetalle(tipo: TipoObra, id: number): Promise<DetalleObra> {
  const clave = `${tipo}_${id}`;
  const guardado = detalles.get(clave);
  if (guardado) return guardado;

  const d = await pedir<TmdbDetalle>(`/${tipo}/${id}`, {
    append_to_response: 'credits,videos',
    include_video_language: 'es,en', // sin esto solo llegan videos en español
  });
  const videos = d.videos?.results.filter((v) => v.site === 'YouTube') ?? [];
  const detalle: DetalleObra = {
    tmdbId: d.id,
    tipo,
    titulo: d.title ?? d.name ?? 'Sin título',
    anio: anioDe(d),
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    sinopsis: d.overview?.trim() ?? '',
    calificacion: d.vote_average,
    generos: d.genres.map((g) => g.name),
    duracion: duracion(d),
    elenco: (d.credits?.cast ?? []).slice(0, 15).map((c) => ({
      id: c.id,
      nombre: c.name,
      personaje: c.character,
      fotoPath: c.profile_path,
    })),
    trailerKey: (videos.find((v) => v.type === 'Trailer') ?? videos[0])?.key ?? null,
  };
  detalles.set(clave, detalle);
  return detalle;
}
