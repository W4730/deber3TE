# Cinta · Mi Cartelera Personal

App móvil (Expo SDK 58, React Native 0.88, TypeScript) donde cada usuario busca películas y series en TMDB y las organiza en su lista privada: por ver, viendo o vista, con calificación y comentario. Firebase Auth y Firestore guardan las cuentas y las listas; AsyncStorage guarda una copia para usarla sin conexión. Se prueba en **Expo Go** (SDK 58).

## Capas y carpetas

| Carpeta           | Responsabilidad                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `src/screens/`    | Pantallas. Solo UI: nunca importan `firebase/*` ni llaman a `fetch`                            |
| `src/components/` | Componentes reutilizables (`ui.tsx`, `obra.tsx`)                                               |
| `src/services/`   | **Único** lugar que habla con Firebase, TMDB, AsyncStorage y la cámara o galería               |
| `src/context/`    | Estado global: `CarteleraContext` (usuario, perfil, lista) y `AccesibilidadContext` (tema)     |
| `src/dominio/`    | Lógica de negocio pura: sin Firebase, sin React y sin `new Date()`. Cada función tiene su test |
| `src/hooks/`      | Hooks genéricos (`usePeticion`)                                                                |
| `src/navigation/` | **React Navigation** (pila + pestañas). No usar Expo Router                                    |
| `src/types/`      | Tipos de dominio y respuestas de TMDB                                                          |
| `src/utils/`      | Validación de formularios                                                                      |
| `firestore.rules` | Reglas publicadas en Firebase; deben coincidir con lo que escribe `services/`                  |
| `docs/`           | Auditoría, PRD, backlog, specs, diseño, verificación y bitácora de IA                          |

## Comandos de verificación

```bash
npm test             # Vitest (dominio y sensores)
npx tsc --noEmit     # TypeScript
npx expo lint        # ESLint
npx expo-doctor      # dependencias compatibles con el SDK
```

`npm test` y `npx tsc --noEmit` deben pasar antes de cada commit de código.

## Reglas

- **Antes de tocar pantallas o componentes, leer [DESIGN.md](DESIGN.md).** Colores, tipografía y tamaños salen de `src/tema/`; nunca un hexadecimal ni un `rgba()` fuera de ahí. `DESIGN.md` no se modifica sin que lo pida el estudiante.

- **Nunca leer, mostrar ni editar `.env`**, ni pedir claves de Firebase o TMDB. Las variables se usan solo como `process.env.EXPO_PUBLIC_*` dentro de `src/services/`.
- **Pantallas sin Firebase:** la lógica de negocio va en `src/dominio/` y el acceso a datos en `src/services/`.
- **Sin `any`.** Si es indispensable, justificarlo con un comentario en la misma línea.
- **Ningún código sin spec:** primero el documento (`docs:`), luego el test (`test:`) y después el código (`feat:` o `fix:`).
- **No borrar ni saltar tests** para que pasen.
- **Dependencias de la app:** solo si la spec las justifica, con `npx expo install` y compatibles con Expo Go. Nada de librerías de gráficas.
- **Toda petición maneja tres estados:** cargando, error y éxito.
- **Accesibilidad:** elementos tocables de al menos 44 px; las acciones destructivas piden confirmación.
- **Atribución de TMDB:** siempre visible y menos prominente que la marca de la app.
- **Commits:** en español, con la skill `/commit`.
- **API de Expo:** antes de usar una API de Expo o React Native, consultar la documentación de la versión instalada (`https://docs.expo.dev/versions/v58.0.0/`), no la memoria.
