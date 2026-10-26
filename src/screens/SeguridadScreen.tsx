import Lucide from '@react-native-vector-icons/lucide';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Encabezado, Etiqueta, Formulario, Tarjeta } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import type { PropsPila } from '../navigation';
import {
  cambiarClave,
  cambiarCorreo,
  correoVerificado,
  reenviarVerificacion,
  traducirErrorAuth,
} from '../services/authService';
import { MARGEN, type Tema } from '../theme';
import { errorClaveNueva, errorConfirmacion, errorCorreo, soloErrores } from '../utils/validacion';

// En esta pantalla "credencial inválida" solo puede significar que la contraseña actual está mal.
const ERRORES_CLAVE_ACTUAL = {
  'auth/invalid-credential': 'La contraseña actual no es correcta.',
  'auth/wrong-password': 'La contraseña actual no es correcta.',
  'auth/email-already-in-use': 'Ese correo ya pertenece a otra cuenta.',
};

export function SeguridadScreen({ navigation }: PropsPila<'Seguridad'>) {
  const insets = useSafeAreaInsets();
  const s = useEstilos(estilos);
  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado titulo="Seguridad" onAtras={navigation.goBack} />
      <Formulario contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 24 }]}>
        <EstadoCorreo />
        <CambiarCorreo />
        <CambiarClave />
      </Formulario>
    </View>
  );
}

function EstadoCorreo() {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const { usuario } = useCartelera();
  const [verificado, setVerificado] = useState(usuario?.emailVerified ?? false);
  const [enviando, setEnviando] = useState(false);

  // El estado de verificación solo se actualiza al recargar la cuenta.
  useEffect(() => {
    correoVerificado().then(setVerificado, () => {});
  }, []);

  const reenviar = async () => {
    setEnviando(true);
    try {
      await reenviarVerificacion();
      Alert.alert('Correo enviado', `Revisa ${usuario?.email} y abre el enlace para verificar tu cuenta.`);
    } catch (e) {
      Alert.alert('No se pudo enviar', traducirErrorAuth(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Correo de la cuenta" style={s.tarjeta}>
      <View style={s.correo}>
        <Lucide name={verificado ? 'mail-check' : 'mail-warning'} size={20} color={verificado ? color.acento : color.textoSecundario} />
        <Text style={[texto.subtitulo, s.flex]} numberOfLines={1}>
          {usuario?.email}
        </Text>
        <Etiqueta texto={verificado ? 'Verificado' : 'Sin verificar'} tono={verificado ? 'acento' : 'neutro'} />
      </View>
      {!verificado && (
        <>
          <Text style={texto.pequeno}>Verificar tu correo te permite recuperar la cuenta si olvidas la contraseña.</Text>
          <Boton titulo="Reenviar verificación" icono="mail" variante="secundario" onPress={reenviar} cargando={enviando} />
        </>
      )}
    </Tarjeta>
  );
}

function CambiarCorreo() {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const [nuevo, setNuevo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<{ nuevo?: string; clave?: string }>({});
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const encontrados = soloErrores({ nuevo: errorCorreo(nuevo), clave: clave ? null : 'Escribe tu contraseña actual.' });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      await cambiarCorreo(clave, nuevo);
      Alert.alert(
        'Revisa tu nuevo correo',
        `Te enviamos un enlace a ${nuevo.trim()}. Tu correo cambiará cuando lo abras; después tendrás que iniciar sesión de nuevo.`,
      );
      setNuevo('');
      setClave('');
    } catch (e) {
      setErrores({ clave: traducirErrorAuth(e, ERRORES_CLAVE_ACTUAL) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Cambiar correo" style={s.tarjeta}>
      <Text style={texto.pequeno}>Por seguridad, el cambio se confirma desde el correo nuevo.</Text>
      <Campo
        etiqueta="Nuevo correo"
        icono="mail"
        value={nuevo}
        onChangeText={setNuevo}
        error={errores.nuevo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Campo
        etiqueta="Contraseña actual"
        icono="lock"
        clave
        value={clave}
        onChangeText={setClave}
        error={errores.clave}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <Boton titulo="Enviar enlace de verificación" onPress={enviar} cargando={enviando} />
    </Tarjeta>
  );
}

function CambiarClave() {
  const s = useEstilos(estilos);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<{ actual?: string; nueva?: string; confirmacion?: string }>({});
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const encontrados = soloErrores({
      actual: actual ? null : 'Escribe tu contraseña actual.',
      nueva: errorClaveNueva(nueva) ?? (nueva === actual ? 'Debe ser distinta de la actual.' : null),
      confirmacion: errorConfirmacion(nueva, confirmacion),
    });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      await cambiarClave(actual, nueva);
      Alert.alert('Contraseña actualizada', 'Usa la nueva contraseña la próxima vez que inicies sesión.');
      setActual('');
      setNueva('');
      setConfirmacion('');
    } catch (e) {
      setErrores({ actual: traducirErrorAuth(e, ERRORES_CLAVE_ACTUAL) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Cambiar contraseña" style={s.tarjeta}>
      <Campo
        etiqueta="Contraseña actual"
        icono="lock"
        clave
        value={actual}
        onChangeText={setActual}
        error={errores.actual}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <Campo
        etiqueta="Nueva contraseña"
        icono="key-round"
        clave
        value={nueva}
        onChangeText={setNueva}
        error={errores.nueva}
        ayuda="Al menos 8 caracteres, con letras y números."
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Campo
        etiqueta="Confirmar nueva contraseña"
        icono="lock-keyhole"
        clave
        value={confirmacion}
        onChangeText={setConfirmacion}
        error={errores.confirmacion}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Boton titulo="Cambiar contraseña" onPress={enviar} cargando={enviando} />
    </Tarjeta>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 4, gap: 14 },
    tarjeta: { gap: 14 },
    correo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  });
