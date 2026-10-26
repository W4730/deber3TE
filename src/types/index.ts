// ---------- Dominio de la app ----------

export type TipoObra = 'movie' | 'tv';
export type EstadoVisionado = 'por_ver' | 'viendo' | 'vista';

/** Datos mínimos de una obra de TMDB (lo que se copia a Mi lista al agregar). */
export interface Obra {
  tmdbId: number;
  tipo: TipoObra;
  titulo: string;
  anio: string;
  posterPath: string | null;
}

export interface ResultadoBusqueda extends Obra {
  calificacion: number; // 0–10, de TMDB
}

export interface PaginaBusqueda {
  resultados: ResultadoBusqueda[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

export interface MiembroElenco {
  id: number;
  nombre: string;
  personaje: string;
  fotoPath: string | null;
}

export interface DetalleObra extends Obra {
  sinopsis: string; // '' si TMDB no tiene traducción
  backdropPath: string | null;
  calificacion: number;
  generos: string[];
  duracion: string; // "1 h 50 min" o "3 temporadas"; '' si no hay dato
  elenco: MiembroElenco[];
  trailerKey: string | null; // clave de YouTube
}

/** Documento de usuarios/{uid}/mi_lista/{itemId}. Las fechas van en milisegundos para poder cachearlas en JSON. */
export interface ItemLista extends Obra {
  id: string; // itemId = `${tipo}_${tmdbId}`
  estado: EstadoVisionado;
  calificacionPersonal: number | null; // 1–5, solo si estado === 'vista'
  comentario: string; // hasta 500 caracteres
  agregadoEn: number;
  actualizadoEn: number;
}

export type CambiosItem = Pick<ItemLista, 'estado' | 'calificacionPersonal' | 'comentario'>;

/** Documento usuarios/{uid}. El usuario es único (lo garantiza la colección nombresUsuario). */
export interface Perfil {
  nombre: string;
  apellido: string;
  usuario: string;
  foto: string | null; // JPEG pequeño como data URI
}

export interface DatosRegistro extends Omit<Perfil, 'foto'> {
  correo: string;
  clave: string;
}

/** Estado de cualquier petición asíncrona. */
export type EstadoPeticion<T> =
  | { estado: 'inactivo' }
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'exito'; datos: T };

// ---------- Respuestas crudas de TMDB (solo las usa tmdbService) ----------

export interface TmdbPagina<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbResultado {
  id: number;
  media_type: TipoObra | 'person';
  title?: string; // películas
  name?: string; // series
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  vote_average: number;
}

export interface TmdbMiembroElenco {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbDetalle extends Omit<TmdbResultado, 'media_type'> {
  overview: string;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  credits?: { cast: TmdbMiembroElenco[] };
  videos?: { results: { key: string; site: string; type: string }[] };
}
