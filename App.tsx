import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccesibilidadProvider } from './src/context/AccesibilidadContext';
import { CarteleraProvider } from './src/context/CarteleraContext';
import { Navegacion } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AccesibilidadProvider>
        <CarteleraProvider>
          <Navegacion />
          <StatusBar style="light" />
        </CarteleraProvider>
      </AccesibilidadProvider>
    </SafeAreaProvider>
  );
}
