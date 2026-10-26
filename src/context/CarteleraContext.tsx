import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { escucharSesion, type User } from '../services/authService';
import { SinConexionError } from '../services/firebase';
import * as listaService from '../services/listaService';
import { crearItemId, soloObra } from '../services/listaService';
import { escucharPerfil, guardarCachePerfil, leerCachePerfil } from '../services/perfilService';
import type { CambiosItem, ItemLista, Obra, Perfil } from '../types';

interface ValorCartelera {
  usuario: User | null;
  iniciando: boolean; // resolviendo la sesión guardada al abrir la app
  perfil: Perfil | null | undefined; // undefined = cargando; null = la cuenta no tiene perfil
  lista: ItemLista[];
  cargandoLista: boolean;
  sinConexion: boolean; // se muestra la copia de AsyncStorage
  recargar: () => Promise<void>;
  agregar: (obra: Obra) => Promise<void>;
  actualizar: (itemId: string, cambios: CambiosItem) => Promise<void>;
  eliminar: (itemId: string) => Promise<void>;
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

  const agregar = useCallback(
    async (obra: Obra) => {
      const id = crearItemId(obra.tipo, obra.tmdbId);
      if (listaRef.current.some((i) => i.id === id)) return; // RF4: sin duplicados
      const ahora = Date.now();
      const item: ItemLista = {
        ...soloObra(obra),
        id,
        estado: 'por_ver',
        calificacionPersonal: null,
        comentario: '',
        agregadoEn: ahora,
        actualizadoEn: ahora,
      };
      await mutar([item, ...listaRef.current], (u) => listaService.agregar(u, obra));
    },
    [mutar],
  );

  const actualizar = useCallback(
    async (itemId: string, cambios: CambiosItem) => {
      // RF6: solo se califica una obra vista; el comentario tiene tope de 500.
      const limpios: CambiosItem = {
        estado: cambios.estado,
        calificacionPersonal: cambios.estado === 'vista' ? cambios.calificacionPersonal : null,
        comentario: cambios.comentario.trim().slice(0, 500),
      };
      const nueva = listaRef.current.map((i) =>
        i.id === itemId ? { ...i, ...limpios, actualizadoEn: Date.now() } : i,
      );
      await mutar(nueva, (u) => listaService.actualizar(u, itemId, limpios));
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

  const valor = useMemo(
    () => ({ usuario, iniciando, perfil, lista, cargandoLista, sinConexion, recargar, agregar, actualizar, eliminar }),
    [usuario, iniciando, perfil, lista, cargandoLista, sinConexion, recargar, agregar, actualizar, eliminar],
  );

  return <CarteleraContext value={valor}>{children}</CarteleraContext>;
}

export function useCartelera(): ValorCartelera {
  const valor = useContext(CarteleraContext);
  if (!valor) throw new Error('useCartelera debe usarse dentro de <CarteleraProvider>.');
  return valor;
}
