import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoTmdb } from '../components/obra';
import { Boton, Encabezado, Hero, Tarjeta, confirmarCerrarSesion } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import type { PropsPila } from '../navigation';
import { MARGEN, radio, type Tema } from '../theme';

const VERSION = '1.0.0';

export function CreditosScreen({ navigation }: PropsPila<'Creditos'>) {
  const insets = useSafeAreaInsets();
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado onAtras={navigation.goBack} />
      <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 24 }]}>
        <Hero alto={170} etiqueta="Créditos" style={s.hero} />

        <View>
          <Text style={texto.display} accessibilityRole="header">
            Créditos
          </Text>
          <Text style={[texto.cuerpo, s.intro]}>Agradecimientos y fuentes utilizadas en esta app de películas.</Text>
        </View>

        <Tarjeta titulo="TMDB API">
          <Text style={[texto.cuerpo, s.parrafo]}>
            Datos de películas y series, pósters, elenco y calificaciones provienen de The Movie Database.
          </Text>
          <AvisoTmdb />
        </Tarjeta>

        <Tarjeta titulo="Imágenes">
          <Text style={texto.cuerpo}>Foto de portada: Rafi Mohammed en Unsplash (Licencia Unsplash).</Text>
        </Tarjeta>

        <Tarjeta titulo="Acerca de">
          <Text style={texto.subtitulo}>Film Journal · versión {VERSION}</Text>
          <Text style={[texto.cuerpo, s.parrafoArriba]}>
            Proyecto académico de uso no comercial. Hecho con React Native, Expo, Firebase Auth y Firestore.
          </Text>
        </Tarjeta>

        <Boton titulo="Cerrar sesión" icono="log-out" variante="secundario" onPress={confirmarCerrarSesion} />
      </ScrollView>
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 4, gap: 14 },
    hero: { borderRadius: radio.l },
    intro: { marginTop: 6 },
    parrafo: { marginBottom: 14 },
    parrafoArriba: { marginTop: 6 },
  });
