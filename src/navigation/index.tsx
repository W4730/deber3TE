import Lucide, { type LucideIconName } from '@react-native-vector-icons/lucide';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  NavigationContainer,
  type CompositeScreenProps,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import { AccesibilidadScreen } from '../screens/AccesibilidadScreen';
import { BuscarScreen } from '../screens/BuscarScreen';
import { CreditosScreen } from '../screens/CreditosScreen';
import { DetalleScreen } from '../screens/DetalleScreen';
import { EditarPerfilScreen } from '../screens/EditarPerfilScreen';
import { EditarScreen } from '../screens/EditarScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MiListaScreen } from '../screens/MiListaScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { SeguridadScreen } from '../screens/SeguridadScreen';
import { MARGEN, radio } from '../theme';
import type { TipoObra } from '../types';

export type PestanasParams = {
  Buscar: undefined;
  MiLista: undefined;
  Perfil: undefined;
};

type ObraParams = { tipo: TipoObra; tmdbId: number };

export type PilaParams = {
  Login: undefined;
  Pestanas: NavigatorScreenParams<PestanasParams> | undefined;
  Detalle: ObraParams;
  Editar: ObraParams;
  EditarPerfil: undefined;
  Seguridad: undefined;
  Accesibilidad: undefined;
  Creditos: undefined;
};

export type PropsPila<T extends keyof PilaParams> = NativeStackScreenProps<PilaParams, T>;
export type PropsPestana<T extends keyof PestanasParams> = CompositeScreenProps<
  BottomTabScreenProps<PestanasParams, T>,
  NativeStackScreenProps<PilaParams>
>;

const Pila = createNativeStackNavigator<PilaParams>();
const Pestanas = createBottomTabNavigator<PestanasParams>();

const ICONOS: Record<keyof PestanasParams, LucideIconName> = {
  Buscar: 'search',
  MiLista: 'bookmark',
  Perfil: 'user',
};

function PestanasPrincipales() {
  const insets = useSafeAreaInsets();
  const { color, escala } = useTema();
  return (
    <Pestanas.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.acento,
        tabBarInactiveTintColor: color.textoTenue,
        tabBarLabelStyle: { fontSize: 11 * escala, fontWeight: '600' },
        tabBarIcon: ({ color: tinta }) => <Lucide name={ICONOS[route.name]} size={22} color={tinta} />,
        // Barra flotante como en el diseño; queda en el flujo, así el contenido nunca pasa por debajo.
        tabBarStyle: {
          height: 56 + 14 * escala, // 70 con texto normal; crece con el texto grande
          paddingTop: 6,
          paddingBottom: 6,
          marginHorizontal: MARGEN,
          marginBottom: Math.max(insets.bottom, 12),
          borderRadius: radio.l,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: color.borde,
          backgroundColor: color.superficie,
        },
      })}
    >
      <Pestanas.Screen name="Buscar" component={BuscarScreen} />
      <Pestanas.Screen name="MiLista" component={MiListaScreen} options={{ title: 'Mi lista' }} />
      <Pestanas.Screen name="Perfil" component={PerfilScreen} />
    </Pestanas.Navigator>
  );
}

export function Navegacion() {
  const { usuario, iniciando } = useCartelera();
  const { color, animado } = useTema();

  // Sin esto, las transiciones muestran un destello blanco entre pantallas.
  const temaNavegacion = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: color.acento,
        background: color.fondo,
        card: color.fondo,
        text: color.texto,
        border: color.borde,
      },
    }),
    [color],
  );

  // Mientras Firebase lee la sesión guardada no se decide entre Login y la app.
  if (iniciando) return <View style={{ flex: 1, backgroundColor: color.fondo }} />;

  return (
    <NavigationContainer theme={temaNavegacion}>
      <Pila.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.fondo },
          animation: animado ? 'default' : 'none',
        }}
      >
        {usuario ? (
          <>
            <Pila.Screen name="Pestanas" component={PestanasPrincipales} />
            <Pila.Screen name="Detalle" component={DetalleScreen} />
            <Pila.Screen name="Editar" component={EditarScreen} />
            <Pila.Screen name="EditarPerfil" component={EditarPerfilScreen} />
            <Pila.Screen name="Seguridad" component={SeguridadScreen} />
            <Pila.Screen name="Accesibilidad" component={AccesibilidadScreen} />
            <Pila.Screen name="Creditos" component={CreditosScreen} />
          </>
        ) : (
          <Pila.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        )}
      </Pila.Navigator>
    </NavigationContainer>
  );
}
