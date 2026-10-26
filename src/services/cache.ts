import AsyncStorage from '@react-native-async-storage/async-storage';

/** Copia local en AsyncStorage. Nunca lanza: si falla, la app sigue con los datos en memoria. */
export async function leerCache<T>(clave: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(clave);
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

export function guardarCache<T>(clave: string, valor: T): Promise<void> {
  return AsyncStorage.setItem(clave, JSON.stringify(valor)).catch(() => {});
}
