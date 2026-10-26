import Lucide, { type LucideIconName } from '@react-native-vector-icons/lucide';
import { Image } from 'expo-image';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { cerrarSesion } from '../services/authService';
import { MARGEN, radio, TOQUE, type Tema } from '../theme';

export type { LucideIconName };

const HERO = require('../../assets/hero.jpg');
const LOGO = require('../../assets/logo.svg');

export function confirmarCerrarSesion() {
  Alert.alert('¿Cerrar sesión?', 'Tu lista queda guardada en tu cuenta.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar sesión', style: 'destructive', onPress: () => void cerrarSesion() },
  ]);
}

/** Opacidad al tocar; el pequeño "hundido" se omite con Reducir movimiento. */
function usePresionado() {
  const { animado } = useTema();
  return animado ? { opacity: 0.8, transform: [{ scale: 0.98 }] } : { opacity: 0.8 };
}

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  cargando = false,
  deshabilitado = false,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  icono?: LucideIconName;
  cargando?: boolean;
  deshabilitado?: boolean;
}) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const presionado = usePresionado();
  const primario = variante === 'primario';
  const inactivo = deshabilitado || cargando;
  const tinta =
    primario && deshabilitado
      ? color.textoTenue
      : primario
        ? color.sobreAcento
        : variante === 'peligro'
          ? color.peligro
          : color.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        s.boton,
        primario ? s.botonPrimario : s.botonSecundario,
        primario && !inactivo && s.brillo,
        deshabilitado && (primario ? s.primarioInactivo : s.inactivo),
        pressed && presionado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={tinta} />
      ) : (
        <>
          {icono && <Lucide name={icono} size={18} color={tinta} />}
          <Text style={[s.botonTexto, { color: tinta }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconoBoton({
  icono,
  etiqueta,
  onPress,
  activo = false,
  sobreImagen = false,
}: {
  icono: LucideIconName;
  etiqueta: string;
  onPress: () => void;
  activo?: boolean;
  sobreImagen?: boolean;
}) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const presionado = usePresionado();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => [s.iconoBoton, sobreImagen && s.iconoSobreImagen, pressed && presionado]}
    >
      <Lucide name={icono} size={20} color={activo ? color.acento : color.texto} />
    </Pressable>
  );
}

export function Chip({ texto: t, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  const s = useEstilos(estilos);
  const presionado = usePresionado();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => [s.chip, activo && s.chipActivo, pressed && presionado]}
    >
      <Text style={[s.chipTexto, activo && s.chipTextoActivo]}>{t}</Text>
    </Pressable>
  );
}

/** Control segmentado (una opción a la vez). */
export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onCambiar,
}: {
  opciones: readonly { valor: T; nombre: string }[];
  valor: T;
  onCambiar: (valor: T) => void;
}) {
  const s = useEstilos(estilos);
  return (
    <View style={s.segmentos} accessibilityRole="radiogroup">
      {opciones.map((o) => (
        <Pressable
          key={String(o.valor)}
          accessibilityRole="radio"
          accessibilityState={{ checked: valor === o.valor }}
          onPress={() => onCambiar(o.valor)}
          style={[s.segmento, valor === o.valor && s.segmentoActivo]}
        >
          <Text style={[s.segmentoTexto, valor === o.valor && s.segmentoTextoActivo]} numberOfLines={1}>
            {o.nombre}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type Tono = 'acento' | 'suave' | 'contorno' | 'neutro';

/** Distintivo no interactivo (tipo de obra, estado, etc.). */
export function Etiqueta({ texto: t, tono = 'suave' }: { texto: string; tono?: Tono }) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const tonos: Record<Tono, { fondo: ViewStyle; tinta: string }> = {
    acento: { fondo: { backgroundColor: color.acento }, tinta: color.sobreAcento },
    suave: { fondo: { backgroundColor: color.acentoSuave }, tinta: color.acento },
    contorno: { fondo: { backgroundColor: color.velo, borderColor: 'rgba(212, 255, 58, 0.4)' }, tinta: color.acento },
    neutro: { fondo: { backgroundColor: color.superficieAlta }, tinta: color.textoSecundario },
  };
  return (
    <View style={[s.etiqueta, tonos[tono].fondo]}>
      <Text style={[s.etiquetaTexto, { color: tonos[tono].tinta }]} maxFontSizeMultiplier={1.4}>
        {t}
      </Text>
    </View>
  );
}

export function Tarjeta({
  titulo,
  children,
  style,
}: {
  titulo?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={[s.tarjeta, style]}>
      {titulo && (
        <Text style={[texto.etiqueta, s.tarjetaTitulo]} accessibilityRole="header">
          {titulo}
        </Text>
      )}
      {children}
    </View>
  );
}

/** Barra superior de las pantallas de la pila. */
export function Encabezado({
  titulo,
  onAtras,
  derecha,
}: {
  titulo?: string;
  onAtras: () => void;
  derecha?: ReactNode;
}) {
  const s = useEstilos(estilos);
  return (
    <View style={s.encabezado}>
      {titulo && (
        <Text style={s.encabezadoTitulo} numberOfLines={1} accessibilityRole="header">
          {titulo}
        </Text>
      )}
      <IconoBoton icono="arrow-left" etiqueta="Volver" onPress={onAtras} />
      <View style={s.encabezadoDerecha}>{derecha}</View>
    </View>
  );
}

export function Cargando() {
  const { color } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.centro} accessibilityLabel="Cargando">
      <ActivityIndicator size="large" color={color.acento} />
    </View>
  );
}

/** Vacío, sin resultados y error comparten forma: icono, título, texto y una acción opcional. */
export function EstadoVacio({
  icono,
  titulo,
  mensaje,
  accion,
}: {
  icono: LucideIconName;
  titulo: string;
  mensaje?: string;
  accion?: { titulo: string; onPress: () => void };
}) {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.centro}>
      <View style={s.vacioIcono}>
        <Lucide name={icono} size={26} color={color.acento} />
      </View>
      <Text style={[texto.subtitulo, s.alCentro]}>{titulo}</Text>
      {mensaje ? <Text style={[texto.pequeno, s.alCentro, s.vacioMensaje]}>{mensaje}</Text> : null}
      {accion && (
        <View style={s.vacioAccion}>
          <Boton titulo={accion.titulo} onPress={accion.onPress} variante="secundario" />
        </View>
      )}
    </View>
  );
}

export function AvisoSinConexion({ onReintentar, cargando }: { onReintentar: () => void; cargando: boolean }) {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  return (
    <View style={s.aviso} accessibilityRole="alert">
      <Lucide name="wifi-off" size={18} color={color.acento} />
      <Text style={[texto.pequeno, s.flex]}>Sin conexión. Ves la última copia guardada de tu lista.</Text>
      <Pressable accessibilityRole="button" onPress={onReintentar} disabled={cargando} style={s.avisoBoton}>
        {cargando ? (
          <ActivityIndicator size="small" color={color.acento} />
        ) : (
          <Text style={s.avisoBotonTexto}>Reintentar</Text>
        )}
      </Pressable>
    </View>
  );
}

/** Logo + nombre de la app. */
export function Marca() {
  const s = useEstilos(estilos);
  return (
    <View style={s.marca} accessible accessibilityRole="header" accessibilityLabel="Cinta">
      <Image source={LOGO} style={s.marcaLogo} contentFit="contain" />
      <Text style={s.marcaNombre} maxFontSizeMultiplier={1.3}>
        Cinta
      </Text>
    </View>
  );
}

/** Foto del proyector que se funde con el fondo, con un distintivo centrado. */
export function Hero({ etiqueta, alto, style }: { etiqueta?: string; alto: number; style?: StyleProp<ViewStyle> }) {
  const s = useEstilos(estilos);
  return (
    <View style={[{ height: alto }, s.hero, style]}>
      <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, s.heroVelo]} />
      {etiqueta && (
        <View>
          <Etiqueta texto={etiqueta} tono="contorno" />
        </View>
      )}
    </View>
  );
}

/** Foto de perfil o, si no hay, las iniciales. */
export function Avatar({ foto, iniciales, tamano }: { foto: string | null | undefined; iniciales: string; tamano: number }) {
  const { transicion } = useTema();
  const s = useEstilos(estilos);
  const forma = { width: tamano, height: tamano, borderRadius: tamano / 2 };
  return (
    <View style={[s.avatar, forma]}>
      {foto ? (
        <Image source={foto} style={StyleSheet.absoluteFill} contentFit="cover" transition={transicion} />
      ) : (
        <Text style={[s.avatarTexto, { fontSize: tamano * 0.34 }]} maxFontSizeMultiplier={1}>
          {iniciales}
        </Text>
      )}
    </View>
  );
}

// ---------- Formularios ----------

const AsegurarVisibleContext = createContext<() => void>(() => {});

/** Para campos propios dentro de <Formulario>: llamarla en onFocus. */
export const useAsegurarVisible = () => useContext(AsegurarVisibleContext);

/**
 * ScrollView para formularios. Al abrir el teclado o pasar a otro campo, desplaza el campo
 * activo hasta que quede por encima del teclado (funciona igual en iOS y Android edge-to-edge).
 */
export function Formulario({ children, ...props }: ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const desplazamiento = useRef(0);
  const bordeTeclado = useRef<number | null>(null); // y del borde superior del teclado
  const [altoTeclado, setAltoTeclado] = useState(0);

  const asegurarVisible = useCallback(() => {
    const borde = bordeTeclado.current;
    const campo = TextInput.State.currentlyFocusedInput?.(); // no existe en web, donde no hace falta
    if (borde === null || !campo) return;
    campo.measureInWindow((_x, y, _ancho, alto) => {
      const tapado = y + alto + 24 - borde;
      if (tapado > 0) ref.current?.scrollTo({ y: desplazamiento.current + tapado, animated: true });
    });
  }, []);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const mostrar = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      bordeTeclado.current = e.endCoordinates.screenY;
      setAltoTeclado(e.endCoordinates.height);
      setTimeout(asegurarVisible, ios ? 300 : 100); // espera la animación y el relleno inferior
    });
    const ocultar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      bordeTeclado.current = null;
      setAltoTeclado(0);
    });
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, [asegurarVisible]);

  return (
    <AsegurarVisibleContext value={asegurarVisible}>
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEventThrottle={16}
        onScroll={(e) => {
          desplazamiento.current = e.nativeEvent.contentOffset.y;
        }}
        {...props}
      >
        {children}
        {/* Relleno del alto del teclado: deja espacio para subir los últimos campos. */}
        <View style={{ height: altoTeclado }} />
      </ScrollView>
    </AsegurarVisibleContext>
  );
}

/** Campo de texto con etiqueta opcional, ayuda, error por campo y botón para ver la contraseña. */
export function Campo({
  icono,
  etiqueta,
  ayuda,
  error,
  clave = false,
  ref,
  onFocus,
  ...props
}: TextInputProps & {
  icono?: LucideIconName;
  etiqueta?: string;
  ayuda?: string;
  error?: string;
  clave?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const asegurarVisible = useAsegurarVisible();
  const [verClave, setVerClave] = useState(false);
  return (
    <View style={s.campoGrupo}>
      {etiqueta && <Text style={s.campoEtiqueta}>{etiqueta}</Text>}
      <View style={[s.campo, error && s.campoConError]}>
        {icono && <Lucide name={icono} size={18} color={error ? color.peligro : color.textoTenue} />}
        <TextInput
          placeholderTextColor={color.textoTenue}
          selectionColor={color.acento}
          cursorColor={color.acento}
          accessibilityLabel={etiqueta ?? props.placeholder}
          accessibilityHint={error ?? ayuda}
          {...props}
          ref={ref}
          style={s.campoInput}
          secureTextEntry={clave && !verClave}
          onFocus={(e) => {
            onFocus?.(e);
            setTimeout(asegurarVisible, 60);
          }}
        />
        {clave && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setVerClave((v) => !v)}
            style={s.ojo}
          >
            <Lucide name={verClave ? 'eye' : 'eye-off'} size={20} color={color.textoTenue} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={s.campoErrorTexto} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={s.campoAyuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    alCentro: { textAlign: 'center' },
    inactivo: { opacity: 0.4 },

    boton: {
      minHeight: 52,
      borderRadius: radio.m,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    botonPrimario: { backgroundColor: color.acento },
    primarioInactivo: { backgroundColor: color.superficieAlta },
    botonSecundario: { backgroundColor: color.superficie, borderWidth: 1, borderColor: color.borde },
    brillo: { boxShadow: '0px 8px 24px rgba(212, 255, 58, 0.22)' },
    botonTexto: { fontSize: 16, fontWeight: '700' },

    iconoBoton: {
      width: TOQUE,
      height: TOQUE,
      borderRadius: TOQUE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    iconoSobreImagen: { backgroundColor: color.velo, borderColor: 'transparent' },

    chip: {
      minHeight: TOQUE,
      paddingHorizontal: 16,
      borderRadius: TOQUE / 2,
      justifyContent: 'center',
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    chipActivo: { backgroundColor: color.acento, borderColor: color.acento },
    chipTexto: { color: color.textoSecundario, fontSize: 14, fontWeight: '600' },
    chipTextoActivo: { color: color.sobreAcento },

    segmentos: {
      flexDirection: 'row',
      padding: 4,
      gap: 4,
      borderRadius: radio.m,
      backgroundColor: color.fondo,
      borderWidth: 1,
      borderColor: color.borde,
    },
    segmento: {
      flex: 1,
      minHeight: TOQUE,
      paddingHorizontal: 4,
      borderRadius: radio.s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentoActivo: { backgroundColor: color.acento },
    segmentoTexto: { color: color.textoSecundario, fontSize: 14, fontWeight: '700' },
    segmentoTextoActivo: { color: color.sobreAcento },

    etiqueta: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    etiquetaTexto: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },

    tarjeta: {
      backgroundColor: color.superficie,
      borderRadius: radio.l,
      borderWidth: 1,
      borderColor: color.borde,
      padding: 16,
    },
    tarjetaTitulo: { marginBottom: 10 },

    encabezado: {
      height: 56,
      paddingHorizontal: MARGEN,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    encabezadoTitulo: {
      position: 'absolute',
      left: 80,
      right: 80,
      textAlign: 'center',
      color: color.texto,
      fontSize: 16,
      fontWeight: '700',
    },
    encabezadoDerecha: { flexDirection: 'row', gap: 8 },

    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
    vacioIcono: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.acentoSuave,
    },
    vacioMensaje: { maxWidth: 280 },
    vacioAccion: { marginTop: 12, minWidth: 200 },

    aviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: MARGEN,
      marginBottom: 12,
      paddingLeft: 14,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    avisoBoton: { minHeight: TOQUE, minWidth: 96, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    avisoBotonTexto: { color: color.acento, fontWeight: '700', fontSize: 14 },

    marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    marcaLogo: { width: 36, height: 36 },
    marcaNombre: { color: color.texto, fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },

    hero: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    heroVelo: {
      experimental_backgroundImage: `linear-gradient(180deg, rgba(10, 10, 10, 0.5) 0%, rgba(10, 10, 10, 0.2) 45%, ${color.fondo} 100%)`,
    },

    avatar: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.acentoSuave,
    },
    avatarTexto: { color: color.acento, fontWeight: '800' },

    campoGrupo: { gap: 6 },
    campoEtiqueta: { color: color.textoSecundario, fontSize: 13, fontWeight: '600', marginLeft: 2 },
    campo: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 16,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    campoConError: { borderColor: color.peligro },
    campoInput: { flex: 1, minHeight: 52, color: color.texto, fontSize: 16, paddingRight: 16 },
    campoErrorTexto: { color: color.peligro, fontSize: 13, lineHeight: 18, marginLeft: 2 },
    campoAyuda: { color: color.textoTenue, fontSize: 12, lineHeight: 17, marginLeft: 2 },
    ojo: { width: TOQUE + 8, height: 52, alignItems: 'center', justifyContent: 'center' },
  });
