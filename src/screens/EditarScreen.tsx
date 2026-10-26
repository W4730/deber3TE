import Lucide from '@react-native-vector-icons/lucide';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOMBRE_ESTADO, TarjetaElenco, TarjetaSinopsis } from '../components/obra';
import {
  Boton,
  Encabezado,
  Etiqueta,
  EstadoVacio,
  Formulario,
  Segmentado,
  Tarjeta,
  useAsegurarVisible,
} from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import { usePeticion } from '../hooks/usePeticion';
import type { PropsPila } from '../navigation';
import { crearItemId } from '../services/listaService';
import { obtenerDetalle, urlImagen } from '../services/tmdbService';
import { MARGEN, radio, TOQUE, type Tema } from '../theme';
import type { EstadoVisionado } from '../types';

const ESTADOS = (['por_ver', 'viendo', 'vista'] as const).map((e) => ({ valor: e, nombre: NOMBRE_ESTADO[e] }));
const MAX_COMENTARIO = 500;

export function EditarScreen({ route, navigation }: PropsPila<'Editar'>) {
  const { tipo, tmdbId } = route.params;
  const itemId = crearItemId(tipo, tmdbId);
  const insets = useSafeAreaInsets();
  const { color, texto, transicion } = useTema();
  const s = useEstilos(estilos);
  const { lista, actualizar, eliminar } = useCartelera();
  const item = lista.find((i) => i.id === itemId);
  const [peticion] = usePeticion(itemId, () => obtenerDetalle(tipo, tmdbId));
  const detalle = peticion.estado === 'exito' ? peticion.datos : null;

  const [estado, setEstado] = useState<EstadoVisionado>(item?.estado ?? 'por_ver');
  const [calificacion, setCalificacion] = useState<number | null>(item?.calificacionPersonal ?? null);
  const [comentario, setComentario] = useState(item?.comentario ?? '');

  if (!item) {
    return (
      <View style={[s.pantalla, { paddingTop: insets.top }]}>
        <Encabezado onAtras={navigation.goBack} />
        <EstadoVacio
          icono="bookmark-x"
          titulo="Esta obra ya no está en tu lista"
          accion={{ titulo: 'Volver', onPress: navigation.goBack }}
        />
      </View>
    );
  }

  const puedeCalificar = estado === 'vista';
  const notaFinal = puedeCalificar ? calificacion : null;
  const hayCambios =
    estado !== item.estado || notaFinal !== item.calificacionPersonal || comentario.trim() !== item.comentario;

  // La lista cambia al instante (actualización optimista); si Firestore rechaza, se revierte y se avisa.
  const guardar = () => {
    actualizar(itemId, { estado, calificacionPersonal: calificacion, comentario }).catch(() =>
      Alert.alert('No se guardaron los cambios', 'Vuelve a intentarlo en un momento.'),
    );
    navigation.goBack();
  };

  const confirmarEliminar = () =>
    Alert.alert('¿Quitar de tu lista?', `Se borrará «${item.titulo}» junto con tu calificación y comentario.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          eliminar(itemId).catch(() => Alert.alert('No se pudo quitar', 'Vuelve a intentarlo en un momento.'));
        },
      },
    ]);

  const fondo = urlImagen(detalle?.backdropPath ?? item.posterPath, 'w780');

  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado titulo="Mi lista" onAtras={navigation.goBack} />

      <Formulario contentContainerStyle={s.contenido}>
        <View style={s.portada}>
          {fondo && <Image source={fondo} style={StyleSheet.absoluteFill} contentFit="cover" transition={transicion} />}
          <View style={[StyleSheet.absoluteFill, s.portadaVelo]} />
          <View>
            <Etiqueta texto="En mi lista" tono="contorno" />
          </View>
        </View>

        <View>
          <Text style={s.titulo} accessibilityRole="header">
            {item.titulo}
          </Text>
          <Text style={texto.pequeno}>
            {[item.anio, tipo === 'movie' ? 'Película' : 'Serie'].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={s.notas}>
          <Nota etiqueta="TMDB" valor={detalle?.calificacion ? (detalle.calificacion / 2).toFixed(1) : '–'} />
          <Nota etiqueta="Tú" valor={notaFinal ? String(notaFinal) : '–'} destacada />
        </View>

        <Tarjeta titulo="Estado en mi lista">
          <Segmentado opciones={ESTADOS} valor={estado} onCambiar={setEstado} />
          <Text style={[texto.pequeno, s.ayuda]}>Cambia el estado para reflejar tu progreso.</Text>
        </Tarjeta>

        <Tarjeta titulo="Tu calificación">
          <View style={[s.estrellas, !puedeCalificar && s.apagado]}>
            {[1, 2, 3, 4, 5].map((n) => {
              const llena = calificacion !== null && n <= calificacion;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  accessibilityState={{ disabled: !puedeCalificar, selected: calificacion === n }}
                  disabled={!puedeCalificar}
                  onPress={() => setCalificacion(calificacion === n ? null : n)}
                  style={s.estrella}
                >
                  <Lucide name="star" size={30} color={llena ? color.acento : color.estrellaVacia} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[texto.pequeno, s.ayuda]}>
            {puedeCalificar
              ? 'Toca una estrella para calificar; tócala otra vez para quitarla.'
              : 'Marca la obra como «Vista» para poder calificarla.'}
          </Text>
        </Tarjeta>

        <Tarjeta titulo="Comentario">
          <Comentario valor={comentario} onCambiar={setComentario} />
        </Tarjeta>

        {detalle && <TarjetaSinopsis sinopsis={detalle.sinopsis} />}
        {detalle && <TarjetaElenco elenco={detalle.elenco} />}
      </Formulario>

      <View style={[s.acciones, { paddingBottom: insets.bottom + 12 }]}>
        <Boton titulo="Guardar cambios" onPress={guardar} deshabilitado={!hayCambios} />
        <Boton titulo="Eliminar de mi lista" icono="trash-2" variante="peligro" onPress={confirmarEliminar} />
      </View>
    </View>
  );
}

/** Va dentro de <Formulario> para que el teclado no lo tape al escribir. */
function Comentario({ valor, onCambiar }: { valor: string; onCambiar: (v: string) => void }) {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const asegurarVisible = useAsegurarVisible();
  return (
    <>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setTimeout(asegurarVisible, 60)}
        onContentSizeChange={asegurarVisible} // al crecer con nuevas líneas, sigue a la vista
        maxLength={MAX_COMENTARIO}
        multiline
        placeholder="¿Qué te pareció?"
        placeholderTextColor={color.textoTenue}
        selectionColor={color.acento}
        cursorColor={color.acento}
        accessibilityLabel="Comentario"
        style={s.comentario}
        textAlignVertical="top"
      />
      <Text style={[texto.pequeno, s.contador]}>
        {valor.length}/{MAX_COMENTARIO}
      </Text>
    </>
  );
}

function Nota({ etiqueta, valor, destacada = false }: { etiqueta: string; valor: string; destacada?: boolean }) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.nota} accessible accessibilityLabel={`${etiqueta}: ${valor} de 5`}>
      <Text style={[texto.etiqueta, !destacada && s.notaEtiquetaTenue]}>{etiqueta}</Text>
      <Text style={s.notaValor}>
        {valor}
        <Text style={texto.pequeno}> / 5</Text>
      </Text>
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 4, paddingBottom: 20, gap: 14 },

    portada: {
      height: 170,
      borderRadius: radio.l,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.superficie,
    },
    portadaVelo: {
      experimental_backgroundImage: 'linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.7) 100%)',
    },
    titulo: { color: color.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginBottom: 2 },

    notas: { flexDirection: 'row', gap: 10 },
    nota: {
      flex: 1,
      padding: 12,
      gap: 4,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    notaEtiquetaTenue: { color: color.textoTenue },
    notaValor: { color: color.texto, fontSize: 22, fontWeight: '800' },

    ayuda: { marginTop: 10 },
    estrellas: { flexDirection: 'row', justifyContent: 'space-between' },
    estrella: { width: TOQUE + 8, height: TOQUE + 8, alignItems: 'center', justifyContent: 'center' },
    apagado: { opacity: 0.35 },

    comentario: {
      minHeight: 96,
      color: color.texto,
      fontSize: 15,
      lineHeight: 21,
      padding: 12,
      borderRadius: radio.m,
      backgroundColor: color.fondo,
      borderWidth: 1,
      borderColor: color.borde,
    },
    contador: { alignSelf: 'flex-end', marginTop: 6 },

    acciones: {
      paddingHorizontal: MARGEN,
      paddingTop: 12,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: color.borde,
      backgroundColor: color.fondo,
    },
  });
