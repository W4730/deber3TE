# Mi Cartelera Personal · Film Journal

App móvil (React Native + Expo, TypeScript) donde cada usuario busca películas y series en TMDB, las agrega a su lista personal y las organiza por estado (por ver, viendo, vista) con calificación y comentario propios. La lista es privada: se guarda en Firestore bajo el uid de cada usuario.

## Objetivo

Integrar en una sola app autenticación con Firebase Auth, datos propios en Firestore y una API externa pública (TMDB), con navegación, estado global, caché sin conexión y reglas de seguridad.

## Pantallas

| Pantalla | Contenido | Navegación |
|---|---|---|
| Login / Registro | Registro con nombre, apellido, usuario único, correo, contraseña y confirmación; errores por campo | Solo sin sesión |
| Buscar | Búsqueda por título (películas y series), carátula, año y nota de TMDB; carga, error y sin resultados; paginación al hacer scroll | Pestaña |
| Detalle | Póster, sinopsis, calificación TMDB, elenco, tráiler, compartir y "Agregar a mi lista" | Pila |
| Mi lista | Filtros por estado (Por ver / Viendo / Vista) y tipo (Películas / Series); aviso sin conexión | Pestaña |
| Editar mi entrada | Estado, calificación 1–5 (solo si está "Vista"), comentario hasta 500 caracteres y quitar con confirmación | Pila |
| Perfil (Acerca de) | Foto, nombre, @usuario, accesos a cuenta y preferencias, atribución y logo de TMDB, cerrar sesión | Pestaña |
| Editar perfil | Foto (cámara o galería), nombre, apellido y nombre de usuario | Pila |
| Seguridad | Verificación del correo, cambio de correo y de contraseña (piden la contraseña actual) | Pila |
| Accesibilidad | Tamaño de texto, alto contraste y reducir movimiento; se aplican a toda la app | Pila |
| Créditos | Atribución de TMDB, créditos de imágenes, versión y cerrar sesión | Pila |

## Instalación

Requisitos: Node 22.13 o superior y la app **Expo Go** para SDK 57 en el teléfono (el proyecto usa Expo SDK 57).

```bash
npm install
cp .env.example .env   # y completar los valores
npm run dev            # escanear el QR con Expo Go
```

### Variables de entorno (`.env`)

| Variable | De dónde sale |
|---|---|
| `EXPO_PUBLIC_TMDB_TOKEN` | TMDB → Ajustes → API → *API Read Access Token* (el token largo `eyJ…`, **no** la API Key corta) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` y demás `EXPO_PUBLIC_FIREBASE_*` | Firebase → Configuración del proyecto → Tus apps → app web |

`.env` está en `.gitignore`. Las variables `EXPO_PUBLIC_*` quedan dentro del paquete de la app: para este proyecto no comercial es aceptable, pero cualquiera que descomprima la app podría leer el token de TMDB. La solución completa es un proxy en un servidor propio.

### APK para Android (EAS Build)

El proyecto está enlazado a EAS (`@w4730/mi-cartelera`) y [eas.json](eas.json) tiene el perfil `preview`, que genera un APK instalable.

```bash
npx eas-cli@latest build -p android --profile preview
```

Como `.env` no se sube, las variables `EXPO_PUBLIC_*` están cargadas en el entorno **preview** de EAS. Si cambia alguna:

```bash
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_TMDB_TOKEN --value "<nuevo>" --visibility sensitive
```

La clave de firma (keystore) la guarda EAS; no hace falta Android Studio ni Java.

### Firebase

1. Authentication → habilitar **Correo/contraseña**.
2. Firestore → crear la base de datos.
3. Copiar el contenido de [firestore.rules](firestore.rules) en Firestore → Reglas y publicar.

## Estructura

```
App.tsx                      Proveedores y navegación
firestore.rules              Reglas de seguridad (cada usuario solo ve su lista)
src/
  types/                     Interfaces de TMDB, ItemLista, EstadoPeticion<T>
  services/                  Único lugar que llama a Firebase, TMDB y la cámara/galería
    firebase.ts              Inicialización (sesión persistente) y tiempo máximo de escritura
    authService.ts           Login, registro, reautenticación, cambio de correo/contraseña
    perfilService.ts         Perfil y nombres de usuario únicos
    fotoService.ts           Elegir, recortar y comprimir la foto de perfil
    tmdbService.ts           buscar, obtenerDetalle, urlImagen
    listaService.ts          CRUD de usuarios/{uid}/mi_lista
    cache.ts                 Copia local genérica en AsyncStorage
  context/CarteleraContext   Usuario, perfil, lista y acciones (actualización optimista)
  context/AccesibilidadContext  Preferencias de accesibilidad y tema
  utils/validacion.ts        Reglas de los formularios (las mismas que firestore.rules)
  hooks/usePeticion.ts       Estados cargando / error / éxito para cualquier petición
  navigation/                Pila + pestañas; Login condicional según la sesión
  screens/                   Una pantalla por archivo
  components/                ui.tsx (botones, campos, formulario, tarjetas) y obra.tsx (póster, elenco, TMDB)
  theme.ts                   Colores (normal y alto contraste), radios y tipografía escalable
```

## Modelo de datos

| Ruta | Contenido |
|---|---|
| `usuarios/{uid}` | Perfil: `nombre`, `apellido`, `usuario`, `foto` (JPEG ~30 KB como data URI), `creadoEn`, `actualizadoEn` |
| `nombresUsuario/{usuario}` | `{ uid }`: reserva el nombre de usuario. Las reglas no permiten crear uno que ya existe, así no hay dos iguales |
| `usuarios/{uid}/mi_lista/{itemId}` | `itemId = tipo_tmdbId` (por ejemplo `movie_550`), así una obra no puede guardarse dos veces. Campos: `tmdbId`, `tipo`, `titulo`, `anio`, `posterPath`, `estado`, `calificacionPersonal`, `comentario`, `agregadoEn`, `actualizadoEn` |

La foto de perfil se guarda en Firestore porque Firebase Storage exige el plan Blaze (de pago).

## Seguridad

- Las reglas ([firestore.rules](firestore.rules)) aíslan los datos por `uid` y validan cada campo en el servidor: longitudes, formato del usuario, tamaño y tipo de la foto, estados válidos y calificación solo si la obra está "Vista".
- El cambio de nombre de usuario reserva el nuevo y libera el anterior en un solo lote atómico.
- Cambiar el correo o la contraseña exige volver a escribir la contraseña actual (reautenticación). El correo nuevo se confirma con un enlace (`verifyBeforeUpdateEmail`).
- Al registrarse se envía un correo de verificación; contraseña de al menos 8 caracteres con letras y números.

## Accesibilidad

Tamaño de texto (normal, grande, máximo), alto contraste y reducir movimiento, guardados en el teléfono. Todos los elementos tocables miden al menos 44 px, tienen etiquetas para TalkBack y VoiceOver, y el texto respeta el tamaño de letra del sistema. Los formularios desplazan el campo activo por encima del teclado.

## Sin conexión

Al abrir la app se muestra primero la copia de AsyncStorage y luego se pide la lista a Firestore. Las escrituras tienen un tiempo máximo de 8 s: sin red, la UI ya cambió, Firestore deja la escritura en cola y aparece el aviso "Sin conexión".

## Atribución

This product uses the TMDB API but is not endorsed or certified by TMDB. Foto de portada: Rafi Mohammed en Unsplash.
