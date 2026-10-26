import Lucide from '@react-native-vector-icons/lucide';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoTmdb } from '../components/obra';
import { Avatar, Boton, Tarjeta, confirmarCerrarSesion, type LucideIconName } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import { usePeticion } from '../hooks/usePeticion';
import type { PropsPestana } from '../navigation';
import { obtenerDetalle, urlImagen } from '../services/tmdbService';
import { MARGEN, radio, type Tema } from '../theme';

export function PerfilScreen({ navigation }: PropsPestana<'Perfil'>) {
  const insets = useSafeAreaInsets();
  const { color, texto, transicion } = useTema();
  const s = useEstilos(estilos);
  const { usuario, perfil, lista, sinConexion } = useCartelera();
  const correo = usuario?.email ?? '';
  const nombreCompleto = perfil ? `${perfil.nombre} ${perfil.apellido}` : correo.split('@')[0];
  const iniciales = perfil
    ? `${perfil.nombre[0] ?? ''}${perfil.apellido[0] ?? ''}`.toUpperCase()
    : correo.slice(0, 2).toUpperCase();
  const vistas = lista.filter((i) => i.estado === 'vista').length;

  // Destacamos lo último que se agregó a la lista (con sinopsis y nota de TMDB).
  const reciente = lista[0];
  const [peticion] = usePeticion(
    reciente?.id ?? '',
    reciente ? () => obtenerDetalle(reciente.tipo, reciente.tmdbId) : null,
  );
  const destacada = peticion.estado === 'exito' ? peticion.datos : null;

  return (
    <ScrollView style={s.pantalla} contentContainerStyle={[s.contenido, { paddingTop: insets.top + 8 }]}>
      <Text style={texto.display} accessibilityRole="header">
        Perfil
      </Text>

      <Tarjeta>
        <View style={s.usuario}>
          <Avatar foto={perfil?.foto} iniciales={iniciales} tamano={64} />
          <View style={s.flex}>
            <Text style={texto.titulo} numberOfLines={2}>
              {nombreCompleto}
            </Text>
            {perfil && <Text style={s.arroba}>@{perfil.usuario}</Text>}
            <Text style={texto.pequeno} numberOfLines={1}>
              {correo}
            </Text>
          </View>
        </View>
        <View style={s.datos}>
          <Dato etiqueta="Mi lista" valor={String(lista.length)} />
          <Dato etiqueta="Vistas" valor={String(vistas)} />
          <Dato etiqueta="Sesión" valor={sinConexion ? 'Sin red' : 'Activa'} />
        </View>
      </Tarjeta>

      {perfil === null && (
        <Tarjeta titulo="Completa tu perfil">
          <Text style={[texto.cuerpo, s.parrafo]}>
            Agrega tu nombre, apellido y un nombre de usuario para terminar de configurar tu cuenta.
          </Text>
          <Boton titulo="Completar perfil" icono="user-pen" onPress={() => navigation.navigate('EditarPerfil')} />
        </Tarjeta>
      )}

      <Seccion titulo="Cuenta">
        <Fila icono="user-pen" texto="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} />
        <Fila icono="shield-check" texto="Seguridad de la cuenta" onPress={() => navigation.navigate('Seguridad')} />
      </Seccion>

      <Seccion titulo="Preferencias">
        <Fila icono="accessibility" texto="Accesibilidad" onPress={() => navigation.navigate('Accesibilidad')} />
      </Seccion>

      <Seccion titulo="Más">
        <Fila icono="bookmark" texto="Mi lista" onPress={() => navigation.navigate('MiLista')} />
        <Fila icono="info" texto="Créditos y acerca de" onPress={() => navigation.navigate('Creditos')} />
        <Fila icono="log-out" texto="Cerrar sesión" onPress={confirmarCerrarSesion} />
      </Seccion>

      {destacada && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Agregada recientemente: ${destacada.titulo}`}
          onPress={() => navigation.navigate('Detalle', { tipo: destacada.tipo, tmdbId: destacada.tmdbId })}
          style={({ pressed }) => [s.destacada, pressed && s.presionado]}
        >
          <View style={s.destacadaCabecera}>
            <Text style={[texto.etiqueta, s.seccion]}>Agregada recientemente</Text>
            <View style={s.puntaje} accessibilityLabel={`Calificación TMDB ${destacada.calificacion.toFixed(1)}`}>
              <Lucide name="star" size={12} color={color.acento} />
              <Text style={s.puntajeTexto}>{destacada.calificacion.toFixed(1)}</Text>
            </View>
          </View>
          <View style={s.destacadaImagen}>
            {(destacada.backdropPath ?? destacada.posterPath) && (
              <Image
                source={urlImagen(destacada.backdropPath ?? destacada.posterPath, 'w780')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={transicion}
              />
            )}
          </View>
          <Text style={texto.titulo}>{destacada.titulo}</Text>
          <Text style={texto.cuerpo} numberOfLines={4}>
            {destacada.sinopsis || 'Esta obra todavía no tiene sinopsis en español.'}
          </Text>
        </Pressable>
      )}

      <View style={s.pie}>
        <AvisoTmdb />
      </View>
    </ScrollView>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.accesos}>
      <Text style={[texto.etiqueta, s.seccion]} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.dato}>
      <Text style={[texto.etiqueta, s.datoEtiqueta]} numberOfLines={1}>
        {etiqueta}
      </Text>
      <Text style={s.datoValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
    </View>
  );
}

function Fila({ icono, texto: t, onPress }: { icono: LucideIconName; texto: string; onPress: () => void }) {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.fila, pressed && s.presionado]}>
      <Lucide name={icono} size={18} color={color.acento} />
      <Text style={[texto.subtitulo, s.flex]}>{t}</Text>
      <Lucide name="chevron-right" size={18} color={color.textoTenue} />
    </Pressable>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    presionado: { opacity: 0.8 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingBottom: 24, gap: 16 },
    parrafo: { marginBottom: 14 },

    usuario: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    arroba: { color: color.acento, fontSize: 14, fontWeight: '700', marginTop: 2 },

    datos: { flexDirection: 'row', gap: 8, marginTop: 16 },
    dato: { flex: 1, padding: 10, borderRadius: radio.s, backgroundColor: color.fondo },
    datoEtiqueta: { color: color.textoTenue, fontSize: 10 },
    datoValor: { color: color.texto, fontSize: 18, fontWeight: '800', marginTop: 4 },

    accesos: { gap: 8 },
    seccion: { color: color.textoTenue },
    fila: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },

    destacada: {
      gap: 10,
      padding: 16,
      borderRadius: radio.l,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    destacadaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    puntaje: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: color.acentoSuave,
    },
    puntajeTexto: { color: color.acento, fontSize: 12, fontWeight: '800' },
    destacadaImagen: {
      aspectRatio: 16 / 9,
      borderRadius: radio.m,
      overflow: 'hidden',
      backgroundColor: color.superficieAlta,
    },

    pie: { paddingTop: 8 },
  });
