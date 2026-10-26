import { Image } from 'expo-image';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estrellas, Poster, TarjetaElenco, TarjetaSinopsis } from '../components/obra';
import { Boton, Cargando, Encabezado, Etiqueta, EstadoVacio, IconoBoton } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import { usePeticion } from '../hooks/usePeticion';
import type { PropsPila } from '../navigation';
import { crearItemId } from '../services/listaService';
import { obtenerDetalle, urlImagen } from '../services/tmdbService';
import { MARGEN, radio, type Tema } from '../theme';

export function DetalleScreen({ route, navigation }: PropsPila<'Detalle'>) {
  const { tipo, tmdbId } = route.params;
  const insets = useSafeAreaInsets();
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const { lista, agregar } = useCartelera();
  const itemId = crearItemId(tipo, tmdbId);
  const [peticion, reintentar] = usePeticion(itemId, () => obtenerDetalle(tipo, tmdbId));
  const enLista = lista.some((i) => i.id === itemId);
  const detalle = peticion.estado === 'exito' ? peticion.datos : null;

  const editar = () => navigation.navigate('Editar', { tipo, tmdbId });
  const agregarALista = () => {
    if (!detalle) return;
    // La lista se actualiza al instante; solo avisamos si Firestore rechaza la escritura.
    agregar(detalle).catch(() => Alert.alert('No se pudo agregar', 'Vuelve a intentarlo en un momento.'));
  };
  const compartir = () => {
    if (!detalle) return;
    void Share.share({
      message: `${detalle.titulo}${detalle.anio ? ` (${detalle.anio})` : ''} · https://www.themoviedb.org/${tipo}/${tmdbId}`,
    });
  };

  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado
        onAtras={navigation.goBack}
        derecha={
          detalle && (
            <>
              <IconoBoton icono="share-2" etiqueta="Compartir" onPress={compartir} />
              <IconoBoton
                icono={enLista ? 'bookmark-check' : 'bookmark'}
                etiqueta={enLista ? 'Editar en mi lista' : 'Agregar a mi lista'}
                activo={enLista}
                onPress={enLista ? editar : agregarALista}
              />
            </>
          )
        }
      />

      {peticion.estado === 'cargando' && <Cargando />}
      {peticion.estado === 'error' && (
        <EstadoVacio
          icono="circle-alert"
          titulo="No pudimos cargar esta obra"
          mensaje={peticion.mensaje}
          accion={{ titulo: 'Reintentar', onPress: reintentar }}
        />
      )}

      {detalle && (
        <>
          <ScrollView contentContainerStyle={s.contenido}>
            <View style={s.portada}>
              {(detalle.backdropPath ?? detalle.posterPath) && (
                <Image
                  source={urlImagen(detalle.backdropPath ?? detalle.posterPath, 'w780')}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={24}
                />
              )}
              <View style={[StyleSheet.absoluteFill, s.portadaVelo]} />

              <View style={s.portadaFila}>
                <Poster path={detalle.posterPath} tamano="w500" style={s.poster} />
                <View style={s.datos}>
                  <Etiqueta texto={tipo === 'movie' ? 'Película' : 'Serie'} tono="contorno" />
                  <Text style={s.titulo} accessibilityRole="header">
                    {detalle.titulo}
                  </Text>
                  <Text style={s.meta}>{[detalle.anio, detalle.duracion].filter(Boolean).join(' · ')}</Text>
                  {detalle.generos.length > 0 && (
                    <Text style={texto.pequeno} numberOfLines={2}>
                      {detalle.generos.slice(0, 3).join(', ')}
                    </Text>
                  )}
                </View>
              </View>

              <View style={s.calificacion}>
                <Estrellas valor={detalle.calificacion / 2} tamano={16} />
                <Text style={s.calificacionValor}>
                  {detalle.calificacion ? detalle.calificacion.toFixed(1) : '–'}
                </Text>
                <Text style={texto.pequeno}>/ 10 · Calificación TMDB</Text>
              </View>
            </View>

            <TarjetaSinopsis sinopsis={detalle.sinopsis} />
            <TarjetaElenco elenco={detalle.elenco} />
          </ScrollView>

          <View style={[s.acciones, { paddingBottom: insets.bottom + 12 }]}>
            {enLista ? (
              <Boton titulo="Editar en mi lista" icono="bookmark-check" onPress={editar} />
            ) : (
              <Boton titulo="Agregar a mi lista" icono="plus" onPress={agregarALista} />
            )}
            {detalle.trailerKey && (
              <Boton
                titulo="Ver tráiler"
                icono="play"
                variante="secundario"
                onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${detalle.trailerKey}`)}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 4, paddingBottom: 20, gap: 14 },

    portada: {
      borderRadius: radio.l,
      overflow: 'hidden',
      padding: 16,
      gap: 16,
      borderWidth: 1,
      borderColor: color.borde,
      backgroundColor: color.superficie,
    },
    portadaVelo: { backgroundColor: color.velo },
    portadaFila: { flexDirection: 'row', gap: 16 },
    poster: { width: 128 },
    datos: { flex: 1, gap: 8, justifyContent: 'flex-end' },
    titulo: { color: color.texto, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28 },
    meta: { color: color.acento, fontSize: 13, fontWeight: '700' },

    calificacion: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    calificacionValor: { color: color.texto, fontSize: 16, fontWeight: '800' },

    acciones: {
      paddingHorizontal: MARGEN,
      paddingTop: 12,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: color.borde,
      backgroundColor: color.fondo,
    },
  });
