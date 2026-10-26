import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const ANCHO = 320;

/**
 * Abre la cámara o la galería con recorte cuadrado y devuelve un JPEG de ~30 KB como data URI.
 * ponytail: la foto vive en Firestore (máx. ~200 KB) porque Firebase Storage exige el plan Blaze;
 * con Blaze, subirla a Storage y guardar solo la URL.
 */
export async function elegirFoto(origen: 'camara' | 'galeria'): Promise<string | null> {
  if (origen === 'camara') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('Activa el permiso de cámara en los ajustes del teléfono para tomar una foto.');
  }
  const opciones: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const resultado =
    origen === 'camara'
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
  if (resultado.canceled) return null;

  const contexto = ImageManipulator.manipulate(resultado.assets[0].uri);
  contexto.resize({ width: ANCHO });
  const imagen = await contexto.renderAsync();
  const { base64 } = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!base64) throw new Error('No se pudo procesar la imagen.');
  return `data:image/jpeg;base64,${base64}`;
}
