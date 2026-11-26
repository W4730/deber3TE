# Auditoría · Mi Cartelera (Cinta)

## Auditoría inicial — 2026-11-22

Punto de partida: tag `p3-final` (commit `c97920f`), rama `epica-mi-anio`.

**Referencia:** los RF1–RF10 del enunciado del Proyecto 3. El repositorio no tiene `SPEC.md` (ver H-01).

**Gravedad:**

- **Alta:** rompe un requisito o expone datos.
- **Media:** deuda que afecta a la épica.
- **Baja:** mejora menor.

**Decisión:**

- **Corregir ahora:** se resuelve en el Hito 1.
- **Riesgo conocido:** se documenta y no se corrige ahora.
- **Fuera de alcance:** no se trabaja en esta épica.

### Requisitos del Proyecto 3

| RF                                                           | Estado                   | Evidencia                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RF1 Auth, sesión persistente, errores traducidos             | Cumple                   | `services/firebase.ts` (`initializeAuth` + `getReactNativePersistence`), `services/authService.ts` (`traducirErrorAuth`)                       |
| RF2 Búsqueda con carga, error y sin resultados               | Cumple                   | `screens/BuscarScreen.tsx` (debounce de 400 ms, bandera `vigente`, `EstadoVacio`)                                                              |
| RF3 Detalle; funciona sin póster ni sinopsis                 | Cumple                   | `components/obra.tsx` (`Poster` → "Sin póster", `TarjetaSinopsis` → texto alternativo)                                                         |
| RF4 Agregar sin duplicados                                   | Cumple                   | `services/listaService.ts` (`crearItemId` = `tipo_tmdbId`), `context/CarteleraContext.tsx` (`agregar`), `firestore.rules` (id = `tipo_tmdbId`) |
| RF5 Filtro por estado y tipo                                 | Cumple                   | `screens/MiListaScreen.tsx` (`visibles`)                                                                                                       |
| RF6 Estado, calificación 1–5 solo si vista, comentario ≤ 500 | Cumple, con deuda (H-05) | `context/CarteleraContext.tsx` (`actualizar`), `firestore.rules` (`itemValido`)                                                                |
| RF7 Confirmar antes de borrar                                | Cumple                   | `screens/EditarScreen.tsx` (`confirmarEliminar`)                                                                                               |
| RF8 Firestore + copia en AsyncStorage + aviso sin conexión   | Cumple                   | `services/firebase.ts` (`conTiempoMaximo`), `services/cache.ts`, `components/ui.tsx` (`AvisoSinConexion`)                                      |
| RF9 Créditos con logo y atribución de TMDB, cerrar sesión    | Cumple                   | `screens/CreditosScreen.tsx`, `components/obra.tsx` (`AvisoTmdb`)                                                                              |
| RF10 TypeScript por capas, sin `any`, claves fuera del repo  | Cumple, con deuda (H-07) | Sin `any` explícitos en `src/`; `.env` ignorado y sin claves en el historial de git                                                            |

### Hallazgos

| Id   | Hallazgo                                                                                                                                                                | Evidencia                                                                                                                           | Gravedad | Decisión                                                                                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-01 | No existe `SPEC.md`; la especificación del P3 quedó repartida entre el enunciado y el README                                                                            | Raíz del repositorio                                                                                                                | Media    | Corregir ahora: esta auditoría usa los RF1–RF10 como referencia y la épica tendrá su spec en `docs/specs/`                                                     |
| H-02 | `AGENTS.md` es la plantilla de Expo y ordena usar Expo Router, pero la app usa React Navigation (requisito del P3). Un agente en sesión nueva haría cambios equivocados | `AGENTS.md`, sección "Navigation & Routing"                                                                                         | Alta     | Corregir ahora: reescribir `AGENTS.md` y crear `CLAUDE.md`                                                                                                     |
| H-03 | No hay ningún test automático ni sensor que compruebe el trabajo del agente                                                                                             | `package.json` sin script `test`                                                                                                    | Alta     | Corregir ahora: Vitest con un primer test (H-05)                                                                                                               |
| H-04 | No hay formato automático ni convención de commits                                                                                                                      | Sin Prettier; historial con mensajes libres ("app completa", "nuevas imagenes")                                                     | Media    | Corregir ahora: hook de Prettier y skill `/commit`                                                                                                             |
| H-05 | La regla "solo se califica si el estado es vista" vive dentro de un `useCallback` del contexto; no se puede probar sin React                                            | `context/CarteleraContext.tsx`, `actualizar`                                                                                        | Media    | Corregir ahora: extraerla a `src/dominio/` como función pura y probarla                                                                                        |
| H-06 | Hay colores fijos fuera del tema: un hexadecimal y 10 `rgba(...)` (degradados, velos, sombra y borde de etiqueta)                                                       | `context/AccesibilidadContext.tsx` (`#000`); `rgba` en `components/ui.tsx`, `screens/BuscarScreen.tsx` y `screens/EditarScreen.tsx` | Media    | Riesgo conocido: se resuelve en el Hito 4 al pasar las pantallas a `src/tema/`. El sensor detectará hex **y** `rgb(a)`                                         |
| H-07 | Los documentos de Firestore se leen como `DocumentData` (tipado laxo), sin validar la forma                                                                             | `services/listaService.ts` (`aItem`), `services/perfilService.ts` (`escucharPerfil`)                                                | Baja     | Riesgo conocido: las reglas validan la escritura; la lectura asume documentos válidos                                                                          |
| H-08 | El token de TMDB y la configuración de Firebase se pegaron en el chat del agente, y el agente leyó `.env`                                                               | Sesión de desarrollo del P3                                                                                                         | Alta     | Corregir ahora: regenerar el token de TMDB y actualizarlo en `.env` y en EAS. La regla "nunca leer .env" entra en `AGENTS.md`. Momento clave para `docs/IA.md` |
| H-09 | Tres capturas con el nombre real de una persona en un repositorio público                                                                                               | `docs/image copy.png`, `image copy 2.png`, `image copy 3.png` (commit `c97920f`)                                                    | Media    | Riesgo conocido: decisión del estudiante. Se recomienda difuminarlas                                                                                           |
| H-10 | `nombresUsuario/{usuario}` permite `get` sin sesión (revela el uid de un nombre de usuario)                                                                             | `firestore.rules`, `match /nombresUsuario`                                                                                          | Baja     | Riesgo conocido: necesario para comprobar disponibilidad antes del registro; no expone datos personales                                                        |
| H-11 | El paquete Android sigue siendo `com.w4730.filmjournal` tras renombrar la app a "Cinta"                                                                                 | `app.json`, `android.package`                                                                                                       | Baja     | Fuera de alcance: cambiarlo crea una app distinta en el teléfono                                                                                               |

### Notas para la épica (no son fallos del P3)

- Las reglas actuales usan `hasOnly` con 10 campos. Los 4 campos nuevos (`vistaEn`, `generos`, `duracionMin`, `directores`) deben sumarse a esa lista o toda escritura con ellos será rechazada.
- D3 depende de la zona horaria. Los tests de dominio fijan `TZ=America/Guayaquil` para no depender de la máquina.
- `tmdbService.obtenerDetalle` ya pide `credits`. Los directores salen del `crew` sin otra petición.

## Auditoría final — 2026-11-22

Rama `epica-mi-anio`. `npm test`: 40 de 40 pasan, entre ellos el sensor de colores. `npx tsc --noEmit`, `npx expo lint` y `npx expo-doctor` (21 de 21) también pasan.

### Hallazgos iniciales

| Id         | Estado                             | Cómo                                                                                                              |
| ---------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| H-01       | Resuelto                           | PRD, backlog y spec en `docs/`; la auditoría usa los RF1–RF10 como referencia                                     |
| H-02       | Resuelto                           | `AGENTS.md` propio (React Navigation, capas, reglas) y `CLAUDE.md`                                                |
| H-03       | Resuelto                           | Vitest: 40 tests de dominio y sensores                                                                            |
| H-04       | Resuelto                           | Hook de Prettier y skill `/commit`; el historial de la épica sigue `docs:` → `test:` → `feat:`                    |
| H-05       | Resuelto                           | `src/dominio/lista.ts` (`normalizarCambios`) con su test                                                          |
| H-06       | Resuelto                           | Tema en `src/tema/`; las pantallas usan tokens y el sensor de colores fijos está en verde                         |
| H-07       | Riesgo conocido                    | Sin cambios; la lectura ahora tolera los campos nuevos ausentes (`aItem`)                                         |
| H-08       | **Pendiente del estudiante**       | Regenerar el token de TMDB y actualizarlo en `.env` y en EAS. La regla "nunca leer `.env`" ya está en `AGENTS.md` |
| H-09       | Riesgo conocido                    | Sin cambios (decisión del estudiante)                                                                             |
| H-10, H-11 | Riesgo conocido / fuera de alcance | Sin cambios                                                                                                       |

### Hallazgos nuevos

| Id   | Hallazgo                                                                                                                                                                          | Evidencia                                         | Gravedad | Decisión                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| N-01 | Hasta publicar las reglas nuevas, toda obra que se agregaba se revertía (la app escribe los campos nuevos)                                                                        | `firestore.rules` (`itemValido`, `hasOnly`)       | Alta     | **Resuelto (22-nov):** reglas publicadas; en la verificación se aceptaron escrituras con los campos nuevos y se rechazó `duracionMin: -5` |
| N-02 | Los tests de dominio dependen de la zona horaria (D3)                                                                                                                             | `vitest.config.mts`                               | Media    | Resuelto: `TZ=America/Guayaquil` y un test del borde de año                                                                               |
| N-03 | El selector de año estiraba los chips (visto en la vista web previa)                                                                                                              | `components/resumen.tsx`                          | Baja     | Resuelto (`fix:`)                                                                                                                         |
| N-04 | D6 hace una petición a TMDB por obra; con muchas obras sin datos tarda (unos 300 ms cada una)                                                                                     | `CarteleraContext.prepararResumen`                | Baja     | Riesgo conocido: decisión del cliente (D6, de una en una); el progreso es visible                                                         |
| N-05 | La interfaz se había verificado solo en una vista web                                                                                                                             | `docs/VERIFICACION.md`                            | Media    | Resuelto en el emulador (22 y 26-nov): la columna "Resultado obtenido" está completa; queda la confirmación del estudiante en su teléfono |
| N-06 | En modo avión, `getDocs` devolvía la caché en memoria (vacía al abrir la app) y esa lista vacía reemplazaba la copia de AsyncStorage: Mi lista y Mi año salían vacíos y sin aviso | `services/listaService.ts` (`obtener`)            | Alta     | Resuelto: `getDocsFromServer`, que falla sin red; verificado en el emulador                                                               |
| N-07 | En Android el teclado tapaba el último campo: se mezclaban coordenadas de pantalla (teclado) y de ventana (campo)                                                                 | `components/ui.tsx` (`Formulario`)                | Media    | Resuelto: medición relativa al formulario y solo el alto del teclado; verificado en el emulador                                           |
| N-08 | Una cuenta recién registrada quedó sin perfil, aunque las reglas aceptan el mismo lote                                                                                            | `services/authService.ts` (`registrar`)           | Media    | Mitigado: un reintento ante `permission-denied`. No se pudo reproducir otra vez; si pasa, Perfil pide completarlo                         |
| N-09 | Justo después de cerrar sesión, el primer intento de registro puede responder "Sin conexión"; el segundo funciona                                                                 | `services/perfilService.ts` (`usuarioDisponible`) | Baja     | Riesgo conocido: Firestore tarda un momento en reconectar tras el cambio de usuario                                                       |
| N-10 | Las horas se mostraban "17 h" en vez de "17,0 h" (D7)                                                                                                                             | `screens/MiAnioScreen.tsx`                        | Baja     | Resuelto                                                                                                                                  |
| N-11 | Con texto Máximo, los nombres largos de las tarjetas de dato se cortaban a mitad de palabra                                                                                       | `components/resumen.tsx` (`TarjetaDato`)          | Media    | Resuelto (26-nov): el valor se achica hasta caber; verificado en el emulador                                                              |
| N-12 | Al abrir la app en frío, la primera consulta a Firestore fallaba y mostraba "Sin conexión" con red                                                                                | `services/listaService.ts` (`obtener`)            | Media    | Resuelto (26-nov): un reintento a los 1,5 s; sin red el aviso sigue apareciendo                                                           |

### Riesgos que quedan

- Regenerar el token de TMDB (H-08) y la prueba a mano en el teléfono (N-05) son **requisitos antes de la demo**.
- Las migraciones D2 y D6 escriben en Firestore al abrir Mi año. Una cuenta con cientos de obras sin datos tardaría varios minutos (N-04).
