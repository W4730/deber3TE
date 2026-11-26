import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { espacio, radio, type Tema } from '../tema';
import type { ItemLista } from '../types';
import { Estrellas, Poster } from './obra';
import { Chip } from './ui';

// Componentes de la épica Mi año en cine (DESIGN.md › Componentes).

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const INICIALES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Rótulo + cifra grande + nota. `compacto` reduce la cifra para textos (género, director). */
export function TarjetaDato({
  rotulo,
  valor,
  nota,
  compacto = false,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  compacto?: boolean;
}) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.tarjeta} accessible accessibilityLabel={`${rotulo}: ${valor}. ${nota}`}>
      <Text style={[texto.etiqueta, s.rotulo]} numberOfLines={1}>
        {rotulo}
      </Text>
      <Text
        style={compacto ? texto.titulo : texto.dato}
        numberOfLines={compacto ? 2 : 1}
        // Con texto grande, un nombre largo ("Christopher Nolan") se achica en vez de cortarse a mitad de palabra.
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {valor}
      </Text>
      <Text style={texto.pequeno} numberOfLines={2}>
        {nota}
      </Text>
    </View>
  );
}

/** D10: 12 barras hechas con View; acento solo en el mes más activo. */
export function BarrasPorMes({ obrasPorMes, mesTop }: { obrasPorMes: number[]; mesTop: number | null }) {
  const s = useEstilos(estilos);
  const maximo = Math.max(1, ...obrasPorMes);
  return (
    <View>
      <View style={s.barras}>
        {obrasPorMes.map((n, mes) => (
          <View
            key={mes}
            style={s.columna}
            accessible
            accessibilityLabel={`${MESES[mes]}, ${n} ${n === 1 ? 'obra' : 'obras'}`}
          >
            <View style={[s.barra, mes === mesTop && s.barraTop, { height: `${(n / maximo) * 100}%` }]} />
          </View>
        ))}
      </View>
      <View style={s.meses} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {INICIALES.map((inicial, mes) => (
          <Text key={mes} style={[s.mes, mes === mesTop && s.mesTop]}>
            {inicial}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** D11: la obra mejor calificada del año; sin calificadas invita a calificar. */
export function TarjetaDestacada({ obra, onAbrir }: { obra: ItemLista | null; onAbrir: (obra: ItemLista) => void }) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  if (!obra) {
    return (
      <View style={s.tarjeta}>
        <Text style={[texto.etiqueta, s.rotulo]}>Tu mejor obra</Text>
        <Text style={texto.cuerpo}>Califica lo que viste este año y aquí aparecerá tu mejor obra.</Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tu mejor obra: ${obra.titulo}, ${obra.calificacionPersonal} de 5`}
      onPress={() => onAbrir(obra)}
      style={({ pressed }) => [s.tarjeta, s.destacada, pressed && s.presionado]}
    >
      <Poster path={obra.posterPath} tamano="w342" style={s.poster} />
      <View style={s.flex}>
        <Text style={texto.etiqueta}>Tu mejor obra</Text>
        <Text style={texto.titulo} numberOfLines={2}>
          {obra.titulo}
        </Text>
        <Estrellas valor={obra.calificacionPersonal ?? 0} tamano={16} />
      </View>
    </Pressable>
  );
}

/** D4: años disponibles como chips; el seleccionado va en acento. */
export function SelectorAnio({
  anios,
  valor,
  onCambiar,
}: {
  anios: number[];
  valor: number;
  onCambiar: (anio: number) => void;
}) {
  const s = useEstilos(estilos);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.selector} contentContainerStyle={s.anios}>
      {anios.map((anio) => (
        <Chip key={anio} texto={String(anio)} activo={anio === valor} onPress={() => onCambiar(anio)} />
      ))}
    </ScrollView>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1, gap: espacio.xs },
    presionado: { opacity: 0.85 },
    tarjeta: {
      flex: 1,
      gap: espacio.xs,
      padding: espacio.l,
      borderRadius: radio.l,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    rotulo: { color: color.textoTenue },

    barras: { height: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    columna: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    barra: { minHeight: 3, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: color.barra },
    barraTop: { backgroundColor: color.acento },
    meses: { flexDirection: 'row', gap: 6, marginTop: 6 },
    mes: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: color.textoTenue },
    mesTop: { color: color.acento },

    destacada: { flexDirection: 'row', alignItems: 'center', gap: espacio.l },
    poster: { width: 72 },

    selector: { flexGrow: 0 }, // sin esto, el ScrollView horizontal estira los chips
    anios: { gap: espacio.s, alignItems: 'center' },
  });
