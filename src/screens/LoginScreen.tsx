import Lucide from '@react-native-vector-icons/lucide';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, Formulario, Hero } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { iniciarSesion, registrar, traducirErrorAuth } from '../services/authService';
import { UsuarioOcupadoError } from '../services/perfilService';
import { MARGEN, TOQUE, type Tema } from '../theme';
import {
  errorClaveNueva,
  errorConfirmacion,
  errorCorreo,
  errorNombre,
  errorUsuario,
  limpiarUsuario,
  soloErrores,
} from '../utils/validacion';

type NombreCampo = 'nombre' | 'apellido' | 'usuario' | 'correo' | 'clave' | 'confirmacion';
type Errores = Partial<Record<NombreCampo, string>>;
type Entrada = ComponentRef<typeof TextInput>;

const VACIO: Record<NombreCampo, string> = { nombre: '', apellido: '', usuario: '', correo: '', clave: '', confirmacion: '' };

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const [esRegistro, setEsRegistro] = useState(false);
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Un ref por campo para pasar al siguiente con la tecla "Siguiente".
  const apellidoRef = useRef<Entrada>(null);
  const usuarioRef = useRef<Entrada>(null);
  const correoRef = useRef<Entrada>(null);
  const claveRef = useRef<Entrada>(null);
  const confirmacionRef = useRef<Entrada>(null);

  const cambiar = (campo: NombreCampo) => (valor: string) => {
    setDatos((d) => ({ ...d, [campo]: campo === 'usuario' ? limpiarUsuario(valor) : valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const validar = (): Errores =>
    esRegistro
      ? soloErrores({
          nombre: errorNombre(datos.nombre, 'nombre'),
          apellido: errorNombre(datos.apellido, 'apellido'),
          usuario: errorUsuario(datos.usuario),
          correo: errorCorreo(datos.correo),
          clave: errorClaveNueva(datos.clave),
          confirmacion: errorConfirmacion(datos.clave, datos.confirmacion),
        })
      : soloErrores({
          correo: errorCorreo(datos.correo),
          clave: datos.clave ? null : 'Escribe tu contraseña.',
        });

  const enviar = async () => {
    const encontrados = validar();
    setErrores(encontrados);
    setErrorGeneral(null);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      if (esRegistro) await registrar(datos);
      else await iniciarSesion(datos.correo, datos.clave);
      // Al detectar la sesión, la navegación cambia sola a las pestañas.
    } catch (e) {
      if (e instanceof UsuarioOcupadoError) setErrores({ usuario: 'Ese nombre de usuario ya está en uso. Elige otro.' });
      else setErrorGeneral(traducirErrorAuth(e));
      setEnviando(false);
    }
  };

  const alternarModo = () => {
    setEsRegistro((v) => !v);
    setErrores({});
    setErrorGeneral(null);
  };

  return (
    <Formulario style={s.pantalla} contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 12 }]} bounces={false}>
      <Hero alto={(esRegistro ? 170 : 250) + insets.top} etiqueta={esRegistro ? 'Registro' : 'Inicio de sesión'} />

      <View style={[s.cuerpo, esRegistro && s.cuerpoRegistro]}>
        <Text style={texto.display} accessibilityRole="header">
          {esRegistro ? 'Crea tu cuenta' : 'Iniciar Sesión'}
        </Text>
        <Text style={[texto.cuerpo, s.intro]}>
          {esRegistro
            ? 'Completa tus datos para empezar a guardar películas, calificarlas y armar tu lista.'
            : 'Continúa con tu correo y contraseña para volver a tu lista de películas.'}
        </Text>

        <View style={s.campos}>
          {esRegistro && (
            <>
              <View style={s.fila}>
                <View style={s.flex}>
                  <Campo
                    icono="user"
                    placeholder="Nombre"
                    value={datos.nombre}
                    onChangeText={cambiar('nombre')}
                    error={errores.nombre}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    textContentType="givenName"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => apellidoRef.current?.focus()}
                  />
                </View>
                <View style={s.flex}>
                  <Campo
                    ref={apellidoRef}
                    placeholder="Apellido"
                    value={datos.apellido}
                    onChangeText={cambiar('apellido')}
                    error={errores.apellido}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    textContentType="familyName"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => usuarioRef.current?.focus()}
                  />
                </View>
              </View>
              <Campo
                ref={usuarioRef}
                icono="at-sign"
                placeholder="Nombre de usuario"
                value={datos.usuario}
                onChangeText={cambiar('usuario')}
                error={errores.usuario}
                ayuda="Minúsculas, números, punto o guion bajo (3 a 20)."
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                textContentType="username"
                maxLength={20}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => correoRef.current?.focus()}
              />
            </>
          )}
          <Campo
            ref={correoRef}
            icono="mail"
            placeholder="Correo electrónico"
            value={datos.correo}
            onChangeText={cambiar('correo')}
            error={errores.correo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => claveRef.current?.focus()}
          />
          <Campo
            ref={claveRef}
            icono="lock"
            clave
            placeholder="Contraseña"
            value={datos.clave}
            onChangeText={cambiar('clave')}
            error={errores.clave}
            ayuda={esRegistro ? 'Al menos 8 caracteres, con letras y números.' : undefined}
            autoCapitalize="none"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            textContentType={esRegistro ? 'newPassword' : 'password'}
            returnKeyType={esRegistro ? 'next' : 'go'}
            submitBehavior={esRegistro ? 'submit' : 'blurAndSubmit'}
            onSubmitEditing={esRegistro ? () => confirmacionRef.current?.focus() : enviar}
          />
          {esRegistro && (
            <Campo
              ref={confirmacionRef}
              icono="lock-keyhole"
              clave
              placeholder="Confirmar contraseña"
              value={datos.confirmacion}
              onChangeText={cambiar('confirmacion')}
              error={errores.confirmacion}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={enviar}
            />
          )}
          {errorGeneral && (
            <View style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Lucide name="circle-alert" size={16} color={color.peligro} />
              <Text style={s.errorTexto}>{errorGeneral}</Text>
            </View>
          )}
        </View>

        <View style={s.espacio} />

        <Boton titulo={esRegistro ? 'Crear cuenta' : 'Ingresar'} onPress={enviar} cargando={enviando} />
        <View style={s.alternar}>
          <Text style={texto.pequeno}>{esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}</Text>
          <Pressable accessibilityRole="button" onPress={alternarModo} style={s.alternarBoton}>
            <Text style={s.alternarTexto}>{esRegistro ? 'Inicia sesión' : 'Regístrate'}</Text>
          </Pressable>
        </View>
      </View>
    </Formulario>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { flexGrow: 1 },
    cuerpo: { flex: 1, paddingHorizontal: MARGEN, marginTop: -12 },
    cuerpoRegistro: { marginTop: 8 },
    intro: { marginTop: 8 },
    campos: { marginTop: 24, gap: 12 },
    fila: { flexDirection: 'row', gap: 12 },
    error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 },
    errorTexto: { flex: 1, color: color.peligro, fontSize: 14, lineHeight: 20 },
    espacio: { flex: 1, minHeight: 28 },
    alternar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    alternarBoton: { minHeight: TOQUE, justifyContent: 'center', paddingHorizontal: 6 },
    alternarTexto: { color: color.acento, fontSize: 13, fontWeight: '700' },
  });
