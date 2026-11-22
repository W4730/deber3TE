import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { normalizarCambios } from '../dominio/lista';
import { cambioVistaEn, tareasAlAbrir } from '../dominio/vistaEn';
import { escucharSesion, type User } from '../services/authService';
import { SinConexionError } from '../services/firebase';
import * as listaService from '../services/listaService';
import { SIN_DATOS, crearItemId, soloObra } from '../services/listaService';
import { escucharPerfil, guardarCachePerfil, leerCachePerfil } from '../services/perfilService';
import { datosDeDetalle, datosObra } from '../services/tmdbService';
import type { CambiosItem, DatosObra, DetalleObra, ItemLista, Obra, Perfil } from '../types';

interface ValorCartelera {
  usuario: User | null;
  iniciando: boolean; // resolviendo la sesión guardada al abrir la app
  perfil: Perfil | null | undefined; // undefined = cargando; null = la cuenta no tiene perfil
  lista: ItemLista[];
  cargandoLista: boolean;
  sinConexion: boolean; // se muestra la copia de AsyncStorage
  recargar: () => Promise<void>;
  agregar: (obra: Obra | DetalleObra) => Promise<void>;
  actualizar: (itemId: string, cambios: CambiosItem) => Promise<void>;
  eliminar: (itemId: string) => Promise<void>;
  /** D2 + D6 al abrir Mi año en cine; informa el avance del completado de datos. */
  prepararResumen: (anio: number, alProgresar: (hechas: number, total: number) => void) => Promise<void>;
}

const CarteleraContext = createContext<ValorCartelera | null>(null);

export function CarteleraProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [lista, setLista] = useState<ItemLista[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  // Refs para leer el valor más reciente dentro de acciones asíncronas.
  const listaRef = useRef<ItemLista[]>([]);
  const uidRef = useRef<string | null>(null);
  const uid = usuario?.uid ?? null;

  // Al cambiar de cuenta se limpia el estado de la anterior durante el render (patrón recomendado por
  // React en lugar de hacerlo dentro de un efecto).
  const [uidAnterior, setUidAnterior] = useState(uid);
  if (uid !== uidAnterior) {
    setUidAnterior(uid);
    setPerfil(undefined);
    setLista([]);
    setSinConexion(false);
  }

  useEffect(
    () =>
      escucharSesion((u) => {
        setUsuario(u);
        setIniciando(false);
      }),
    [],
  );

  /** Estado local + copia en AsyncStorage, siempre juntos. Ignora respuestas de un usuario anterior. */
  const fijarLista = useCallback((nueva: ItemLista[], deUid: string, cachear = true) => {
    if (uidRef.current !== deUid) return;
    listaRef.current = nueva;
    setLista(nueva);
    if (cachear) void listaService.guardarCacheLista(deUid, nueva);
  }, []);

  // Perfil: copia local primero y luego Firestore en tiempo real (las ediciones se ven al instante).
  useEffect(() => {
    if (!uid) return;
    let vigente = true;
    void leerCachePerfil(uid).then((copia) => {
      if (vigente && copia) setPerfil((actual) => actual ?? copia);
    });
    const dejarDeEscuchar = escucharPerfil(uid, (p) => {
      if (!vigente) return;
      setPerfil(p);
      if (p) void guardarCachePerfil(uid, p);
    });
    return () => {
      vigente = false;
      dejarDeEscuchar();
    };
  }, [uid]);

  const recargar = useCallback(async () => {
    if (!uid) return;
    setCargandoLista(true);
    try {
      fijarLista(await listaService.obtener(uid), uid);
      setSinConexion(false);
    } catch {
      setSinConexion(true); // se mantiene la última copia
    } finally {
      setCargandoLista(false);
    }
  }, [uid, fijarLista]);

  // Al iniciar sesión: primero la copia local (instantánea), después Firestore.
  useEffect(() => {
    uidRef.current = uid;
    listaRef.current = [];
    if (!uid) return;
    void (async () => {
      const copia = await listaService.leerCacheLista(uid);
      if (copia) fijarLista(copia, uid, false);
      await recargar();
    })();
  }, [uid, recargar, fijarLista]);

  /** Actualiza la UI al instante y luego escribe en Firestore; si falla (no por red), revierte. */
  const mutar = useCallback(
    async (nueva: ItemLista[], escribir: (uid: string) => Promise<void>) => {
      if (!uid) return;
      const anterior = listaRef.current;
      fijarLista(nueva, uid);
      try {
        await escribir(uid);
        setSinConexion(false);
      } catch (error) {
        // Sin red la escritura queda en cola en Firestore y se envía al reconectar.
        if (error instanceof SinConexionError) return setSinConexion(true);
        fijarLista(anterior, uid);
        throw error;
      }
    },
    [uid, fijarLista],
  );

  /** Aplica cambios locales a un ítem (sin escribir en Firestore). */
  const parchear = useCallback(
    (itemId: string, cambios: Partial<ItemLista>, deUid: string) =>
      fijarLista(
        listaRef.current.map((i) => (i.id === itemId ? { ...i, ...cambios } : i)),
        deUid,
      ),
    [fijarLista],
  );

  const agregar = useCallback(
    async (obra: Obra | DetalleObra) => {
      const id = crearItemId(obra.tipo, obra.tmdbId);
      if (listaRef.current.some((i) => i.id === id)) return; // RF4: sin duplicados
      // D5: desde Detalle ya se tienen los datos; desde Buscar se piden después (P7).
      const conocidos = 'elenco' in obra ? datosDeDetalle(obra) : null;
      const ahora = Date.now();
      const item: ItemLista = {
        ...soloObra(obra),
        ...SIN_DATOS,
        ...conocidos,
        id,
        estado: 'por_ver',
        calificacionPersonal: null,
        comentario: '',
        agregadoEn: ahora,
        actualizadoEn: ahora,
      };
      await mutar([item, ...listaRef.current], async (u) => {
        const datos: DatosObra | null = conocidos ?? (await datosObra(obra.tipo, obra.tmdbId).catch(() => null));
        await listaService.agregar(u, obra, datos);
        if (datos && !conocidos) parchear(id, datos, u);
      });
    },
    [mutar, parchear],
  );

  const actualizar = useCallback(
    async (itemId: string, cambios: CambiosItem) => {
      const limpios = normalizarCambios(cambios);
      const anterior = listaRef.current.find((i) => i.id === itemId);
      if (!anterior) return;
      const cambio = cambioVistaEn(anterior.estado, limpios.estado); // D1
      const ahora = Date.now();
      const vistaEn = cambio === 'fijar' ? ahora : cambio === 'borrar' ? null : anterior.vistaEn;
      const nueva = listaRef.current.map((i) =>
        i.id === itemId ? { ...i, ...limpios, vistaEn, actualizadoEn: ahora } : i,
      );
      await mutar(nueva, (u) => listaService.actualizar(u, itemId, limpios, cambio));
    },
    [mutar],
  );

  const eliminar = useCallback(
    (itemId: string) =>
      mutar(
        listaRef.current.filter((i) => i.id !== itemId),
        (u) => listaService.eliminar(u, itemId),
      ),
    [mutar],
  );

  const prepararResumen = useCallback(
    async (anio: number, alProgresar: (hechas: number, total: number) => void) => {
      if (!uid) return;
      const { fechas, datos } = tareasAlAbrir(listaRef.current, anio, sinConexion); // D13
      try {
        // D2: una sola vez; después ya tienen vistaEn y no vuelven a seleccionarse.
        for (const item of fechas) {
          await listaService.fijarVistaEn(uid, item.id, item.actualizadoEn);
          parchear(item.id, { vistaEn: item.actualizadoEn }, uid);
        }
        // D6: de una en una; si TMDB falla para una obra, se sigue con la siguiente.
        for (const [n, item] of datos.entries()) {
          alProgresar(n, datos.length);
          const nuevos = await datosObra(item.tipo, item.tmdbId).catch(() => null);
          if (nuevos) {
            await listaService.completarDatos(uid, item.id, nuevos);
            parchear(item.id, nuevos, uid);
          }
        }
        alProgresar(datos.length, datos.length);
      } catch (error) {
        if (error instanceof SinConexionError) setSinConexion(true);
        alProgresar(datos.length, datos.length);
      }
    },
    [uid, sinConexion, parchear],
  );

  const valor = useMemo(
    () => ({
      usuario,
      iniciando,
      perfil,
      lista,
      cargandoLista,
      sinConexion,
      recargar,
      agregar,
      actualizar,
      eliminar,
      prepararResumen,
    }),
    [
      usuario,
      iniciando,
      perfil,
      lista,
      cargandoLista,
      sinConexion,
      recargar,
      agregar,
      actualizar,
      eliminar,
      prepararResumen,
    ],
  );

  return <CarteleraContext value={valor}>{children}</CarteleraContext>;
}

export function useCartelera(): ValorCartelera {
  const valor = useContext(CarteleraContext);
  if (!valor) throw new Error('useCartelera debe usarse dentro de <CarteleraProvider>.');
  return valor;
}
