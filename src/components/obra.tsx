import Lucide from '@react-native-vector-icons/lucide';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { urlImagen, type TamanoImagen } from '../services/tmdbService';
import { radio, type Tema } from '../theme';
import type { EstadoVisionado, MiembroElenco } from '../types';
import { Etiqueta, Tarjeta } from './ui';

const LOGO_TMDB = require('../../assets/tmdb.svg');

export const NOMBRE_ESTADO: Record<EstadoVisionado, string> = {
  por_ver: 'Por ver',
  viendo: 'Viendo',
  vista: 'Vista',
};

export function EtiquetaEstado({ estado }: { estado: EstadoVisionado }) {
  const tono = estado === 'vista' ? 'acento' : estado === 'viendo' ? 'suave' : 'neutro';
  return <Etiqueta texto={NOMBRE_ESTADO[estado]} tono={tono} />;
}

/** Carátula 2:3 con imagen de relleno cuando TMDB no tiene póster. */
export function Poster({
  path,
  tamano = 'w342',
  style,
}: {
  path: string | null;
  tamano?: TamanoImagen;
  style?: StyleProp<ViewStyle>;
}) {
  const { color, transicion } = useTema();
  const s = useEstilos(estilos);
  const uri = urlImagen(path, tamano);
  return (
    <View style={[s.poster, style]}>
      {uri ? (
        <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={transicion} cachePolicy="memory-disk" />
      ) : (
        <View style={s.sinPoster}>
          <Lucide name="clapperboard" size={26} color={color.textoTenue} />
          <Text style={s.sinPosterTexto}>Sin póster</Text>
        </View>
      )}
    </View>
  );
}

/** Calificación de 0 a 5 (TMDB usa 0–10: dividir entre 2). */
export function Estrellas({ valor, tamano = 14 }: { valor: number; tamano?: number }) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const llenas = Math.round(valor);
  return (
    <View style={s.fila} accessible accessibilityLabel={`${valor.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Lucide key={n} name="star" size={tamano} color={n <= llenas ? color.acento : color.estrellaVacia} />
      ))}
    </View>
  );
}

export function TarjetaSinopsis({ sinopsis }: { sinopsis: string }) {
  const { texto } = useTema();
  return (
    <Tarjeta titulo="Sinopsis">
      <Text style={texto.cuerpo}>{sinopsis || 'Esta obra todavía no tiene sinopsis en español.'}</Text>
    </Tarjeta>
  );
}

export function TarjetaElenco({ elenco }: { elenco: MiembroElenco[] }) {
  const { color, texto, transicion } = useTema();
  const s = useEstilos(estilos);
  return (
    <Tarjeta titulo="Elenco">
      {elenco.length === 0 ? (
        <Text style={texto.cuerpo}>Sin datos de elenco disponibles.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.elencoScroll}
          contentContainerStyle={s.elenco}
        >
          {elenco.map((p) => {
            const foto = urlImagen(p.fotoPath, 'w185');
            return (
              <View key={p.id} style={s.persona} accessible accessibilityLabel={`${p.nombre}, ${p.personaje}`}>
                <View style={s.avatar}>
                  {foto ? (
                    <Image source={foto} style={StyleSheet.absoluteFill} contentFit="cover" transition={transicion} />
                  ) : (
                    <Lucide name="user" size={22} color={color.textoTenue} />
                  )}
                </View>
                <Text style={s.personaNombre} numberOfLines={2}>
                  {p.nombre}
                </Text>
                {p.personaje ? (
                  <Text style={s.personaPersonaje} numberOfLines={1}>
                    {p.personaje}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </Tarjeta>
  );
}

/** Atribución obligatoria de TMDB; el logo va más discreto que la marca de la app. */
export function AvisoTmdb() {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.tmdb}>
      <Image source={LOGO_TMDB} style={s.tmdbLogo} contentFit="contain" accessibilityLabel="The Movie Database (TMDB)" />
      <Text style={texto.pequeno}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', gap: 2 },
    poster: {
      aspectRatio: 2 / 3,
      borderRadius: radio.m,
      overflow: 'hidden',
      backgroundColor: color.superficieAlta,
    },
    sinPoster: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
    sinPosterTexto: { color: color.textoTenue, fontSize: 12, fontWeight: '600' },

    elencoScroll: { marginHorizontal: -16 }, // el carrusel llega a los bordes de la tarjeta
    elenco: { gap: 12, paddingHorizontal: 16 },
    persona: { width: 72, alignItems: 'center' },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      marginBottom: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.superficieAlta,
    },
    personaNombre: { color: color.texto, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    personaPersonaje: { color: color.textoTenue, fontSize: 11, textAlign: 'center', marginTop: 2 },

    tmdb: { gap: 8 },
    tmdbLogo: { width: 92, height: 12 },
  });
