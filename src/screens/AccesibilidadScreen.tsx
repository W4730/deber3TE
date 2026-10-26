import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Encabezado, Segmentado, Tarjeta } from '../components/ui';
import { useAccesibilidad, useEstilos } from '../context/AccesibilidadContext';
import type { PropsPila } from '../navigation';
import { MARGEN, PREFERENCIAS_INICIALES, TOQUE, type EscalaTexto, type Tema } from '../theme';

const TAMANOS: { valor: EscalaTexto; nombre: string }[] = [
  { valor: 1, nombre: 'Normal' },
  { valor: 1.15, nombre: 'Grande' },
  { valor: 1.3, nombre: 'Máximo' },
];

export function AccesibilidadScreen({ navigation }: PropsPila<'Accesibilidad'>) {
  const insets = useSafeAreaInsets();
  const { tema, preferencias, cambiar } = useAccesibilidad();
  const { texto } = tema;
  const s = useEstilos(estilos);

  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado titulo="Accesibilidad" onAtras={navigation.goBack} />
      <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={texto.cuerpo}>Los cambios se aplican al instante en toda la app y se guardan en este teléfono.</Text>

        <Tarjeta titulo="Tamaño del texto" style={s.tarjeta}>
          <Segmentado opciones={TAMANOS} valor={preferencias.escalaTexto} onCambiar={(escalaTexto) => cambiar({ escalaTexto })} />
          <View style={s.muestra}>
            <Text style={texto.subtitulo}>Five Nights at Freddy&apos;s</Text>
            <Text style={texto.cuerpo}>Así se verán los textos de la app con este tamaño.</Text>
          </View>
        </Tarjeta>

        <Tarjeta titulo="Visualización" style={s.tarjeta}>
          <Interruptor
            titulo="Alto contraste"
            descripcion="Textos secundarios más claros, bordes visibles y fondos más oscuros."
            valor={preferencias.altoContraste}
            onCambiar={(altoContraste) => cambiar({ altoContraste })}
          />
          <View style={s.divisor} />
          <Interruptor
            titulo="Reducir movimiento"
            descripcion="Quita transiciones entre pantallas y animaciones de imágenes."
            valor={preferencias.reducirMovimiento}
            onCambiar={(reducirMovimiento) => cambiar({ reducirMovimiento })}
          />
        </Tarjeta>

        <Text style={texto.pequeno}>
          La app también funciona con TalkBack y VoiceOver, y respeta el tamaño de letra que elijas en los ajustes del
          teléfono.
        </Text>

        <Boton titulo="Restablecer valores" icono="refresh-cw" variante="secundario" onPress={() => cambiar(PREFERENCIAS_INICIALES)} />
      </ScrollView>
    </View>
  );
}

/** Toda la fila es tocable (no solo el switch) y el lector de pantalla la anuncia como un interruptor. */
function Interruptor({
  titulo,
  descripcion,
  valor,
  onCambiar,
}: {
  titulo: string;
  descripcion: string;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
}) {
  const { tema } = useAccesibilidad();
  const s = useEstilos(estilos);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      accessibilityLabel={titulo}
      accessibilityHint={descripcion}
      onPress={() => onCambiar(!valor)}
      style={s.interruptor}
    >
      <View style={s.flex}>
        <Text style={tema.texto.subtitulo}>{titulo}</Text>
        <Text style={tema.texto.pequeno}>{descripcion}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onCambiar}
        trackColor={{ false: tema.color.borde, true: tema.color.acento }}
        thumbColor={tema.color.texto}
        ios_backgroundColor={tema.color.borde}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1, gap: 2 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 4, gap: 14 },
    tarjeta: { gap: 14 },
    muestra: { gap: 4, padding: 12, borderRadius: 12, backgroundColor: color.fondo },
    interruptor: { minHeight: TOQUE + 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    divisor: { height: 1, backgroundColor: color.borde },
  });
