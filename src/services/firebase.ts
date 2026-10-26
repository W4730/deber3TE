import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Expo solo inyecta variables EXPO_PUBLIC_* escritas así, con acceso directo (no desestructurar process.env).
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fast Refresh vuelve a ejecutar este módulo, e initializeAuth falla si se llama dos veces.
const yaIniciada = getApps().length > 0;
const app = yaIniciada ? getApp() : initializeApp(config);

// La persistencia en AsyncStorage mantiene la sesión al cerrar y reabrir la app (RF1).
// En web, getAuth ya persiste en el navegador y getReactNativePersistence no existe.
export const auth =
  yaIniciada || Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);

/** Sin red, Firestore deja la escritura en cola y la promesa no se resuelve hasta reconectar. */
export class SinConexionError extends Error {}

export function conTiempoMaximo<T>(promesa: Promise<T>, ms = 8000): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new SinConexionError('Sin conexión con Firestore')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}
