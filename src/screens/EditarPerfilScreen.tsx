import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Boton, Campo, Cargando, Encabezado, Formulario, Tarjeta } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import type { PropsPila } from '../navigation';
import { traducirErrorAuth } from '../services/authService';
import { elegirFoto } from '../services/fotoService';
import { UsuarioOcupadoError, guardarPerfil } from '../services/perfilService';
import { MARGEN, TOQUE, type Tema } from '../theme';
import type { Perfil } from '../types';
import { errorNombre, errorUsuario, limpiarUsuario, soloErrores } from '../utils/validacion';

type NombreCampo = 'nombre' | 'apellido' | 'usuario';

export function EditarPerfilScreen({ navigation }: PropsPila<'EditarPerfil'>) {
  const insets = useSafeAreaInsets();
  const s = useEstilos(estilos);
  const { usuario, perfil } = useCartelera();

  return (
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <Encabezado titulo={perfil === null ? 'Completa tu perfil' : 'Editar perfil'} onAtras={navigation.goBack} />
      {perfil === undefined || !usuario ? (
        <Cargando />
      ) : (
        <FormularioPerfil
          uid={usuario.uid}
          perfil={perfil}
          margenInferior={insets.bottom}
          onListo={navigation.goBack}
          onSeguridad={() => navigation.navigate('Seguridad')}
        />
      )}
    </View>
  );
}

/** Se monta cuando el perfil ya cargó, así los valores iniciales son los correctos. */
function FormularioPerfil({
  uid,
  perfil,
  margenInferior,
  onListo,
  onSeguridad,
}: {
  uid: string;
  perfil: Perfil | null;
  margenInferior: number;
  onListo: () => void;
  onSeguridad: () => void;
}) {
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const [datos, setDatos] = useState({
    nombre: perfil?.nombre ?? '',
    apellido: perfil?.apellido ?? '',
    usuario: perfil?.usuario ?? '',
  });
  const [foto, setFoto] = useState<string | null>(perfil?.foto ?? null);
  const [errores, setErrores] = useState<Partial<Record<NombreCampo, string>>>({});
  const [guardando, setGuardando] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  const hayCambios =
    !perfil ||
    datos.nombre.trim() !== perfil.nombre ||
    datos.apellido.trim() !== perfil.apellido ||
    datos.usuario !== perfil.usuario ||
    foto !== perfil.foto;

  const cambiar = (campo: NombreCampo) => (valor: string) => {
    setDatos((d) => ({ ...d, [campo]: campo === 'usuario' ? limpiarUsuario(valor) : valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const cambiarFoto = async (origen: 'camara' | 'galeria') => {
    setProcesandoFoto(true);
    try {
      const nueva = await elegirFoto(origen);
      if (nueva) setFoto(nueva);
    } catch (e) {
      Alert.alert('No se pudo usar la foto', e instanceof Error ? e.message : 'Vuelve a intentarlo.');
    } finally {
      setProcesandoFoto(false);
    }
  };

  const guardar = async () => {
    const encontrados = soloErrores({
      nombre: errorNombre(datos.nombre, 'nombre'),
      apellido: errorNombre(datos.apellido, 'apellido'),
      usuario: errorUsuario(datos.usuario),
    });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setGuardando(true);
    try {
      const resultado = await guardarPerfil(uid, { ...datos, foto }, perfil);
      if (resultado === 'pendiente') {
        Alert.alert('Sin conexión', 'Tus cambios se guardarán en cuanto vuelva la conexión.');
      }
      onListo();
    } catch (e) {
      if (e instanceof UsuarioOcupadoError) setErrores({ usuario: 'Ese nombre de usuario ya está en uso. Elige otro.' });
      else Alert.alert('No se guardó el perfil', traducirErrorAuth(e));
      setGuardando(false);
    }
  };

  const iniciales = `${datos.nombre.trim()[0] ?? ''}${datos.apellido.trim()[0] ?? ''}`.toUpperCase() || '?';

  return (
    <Formulario contentContainerStyle={[s.contenido, { paddingBottom: margenInferior + 24 }]}>
      <View style={s.foto}>
        <View>
          <Avatar foto={foto} iniciales={iniciales} tamano={104} />
          {procesandoFoto && (
            <View style={s.fotoCargando}>
              <ActivityIndicator color={color.acento} />
            </View>
          )}
        </View>
        <View style={s.fotoAcciones}>
          <View style={s.flex}>
            <Boton titulo="Galería" icono="image" variante="secundario" onPress={() => cambiarFoto('galeria')} deshabilitado={procesandoFoto} />
          </View>
          <View style={s.flex}>
            <Boton titulo="Cámara" icono="camera" variante="secundario" onPress={() => cambiarFoto('camara')} deshabilitado={procesandoFoto} />
          </View>
        </View>
        {foto && (
          <Pressable accessibilityRole="button" onPress={() => setFoto(null)} style={s.quitar}>
            <Text style={s.quitarTexto}>Quitar foto</Text>
          </Pressable>
        )}
      </View>

      <Tarjeta titulo="Datos personales" style={s.tarjeta}>
        <Campo
          etiqueta="Nombre"
          value={datos.nombre}
          onChangeText={cambiar('nombre')}
          error={errores.nombre}
          autoCapitalize="words"
          autoComplete="name-given"
          textContentType="givenName"
          maxLength={40}
        />
        <Campo
          etiqueta="Apellido"
          value={datos.apellido}
          onChangeText={cambiar('apellido')}
          error={errores.apellido}
          autoCapitalize="words"
          autoComplete="name-family"
          textContentType="familyName"
          maxLength={40}
        />
        <Campo
          etiqueta="Nombre de usuario"
          icono="at-sign"
          value={datos.usuario}
          onChangeText={cambiar('usuario')}
          error={errores.usuario}
          ayuda="Minúsculas, números, punto o guion bajo (3 a 20). Debe ser único."
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </Tarjeta>

      <Pressable accessibilityRole="button" onPress={onSeguridad} style={s.enlace}>
        <Text style={texto.pequeno}>
          ¿Quieres cambiar tu correo o contraseña? <Text style={s.enlaceTexto}>Seguridad de la cuenta</Text>
        </Text>
      </Pressable>

      <Boton titulo="Guardar cambios" onPress={guardar} cargando={guardando} deshabilitado={!hayCambios || procesandoFoto} />
    </Formulario>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingTop: 8, gap: 16 },

    foto: { alignItems: 'center', gap: 14 },
    fotoCargando: {
      ...StyleSheet.absoluteFill,
      borderRadius: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.velo,
    },
    fotoAcciones: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
    quitar: { minHeight: TOQUE, justifyContent: 'center', paddingHorizontal: 12 },
    quitarTexto: { color: color.peligro, fontSize: 14, fontWeight: '700' },

    tarjeta: { gap: 14 },
    enlace: { minHeight: TOQUE, justifyContent: 'center' },
    enlaceTexto: { color: color.acento, fontWeight: '700' },
  });
