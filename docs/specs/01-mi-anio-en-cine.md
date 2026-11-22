# Spec 01 · Mi año en cine

Fuentes: [PRD](../prd/PRD.md) (D1–D13, puntos abiertos P1–P7), [backlog](../backlog/epica-mi-anio.md) (criterios y tickets T1–T6) y [DESIGN.md](../../DESIGN.md).

## Alcance

**Dentro:**

- Pestaña **Mi año**, con resumen anual y selector de año.
- Fecha de visionado (`vistaEn`) y datos de TMDB al agregar.
- Migraciones D2 (fechas) y D6 (datos), con progreso.
- Estados de carga, vacío, sin conexión y datos faltantes.
- Tokens en `src/tema/` y pantallas del Proyecto 3 sin colores fijos.

**Fuera:** revisionados, compartir el resumen, varios años a la vez, notificaciones y librerías de gráficas.

## Modelo

`ItemLista` (`src/types/index.ts`) suma:

| Campo         | TypeScript            | Firestore                          | Lectura de documentos viejos              |
| ------------- | --------------------- | ---------------------------------- | ----------------------------------------- |
| `vistaEn`     | `number \| null` (ms) | timestamp o `null`                 | campo ausente → `null`                    |
| `generos`     | `string[] \| null`    | lista; **nunca se escribe `null`** | campo ausente → `null` = "sin datos" (P1) |
| `duracionMin` | `number \| null`      | entero 1–1000 o `null`             | ausente → `null`                          |
| `directores`  | `string[]`            | lista                              | ausente → `[]`                            |

La copia de AsyncStorage guarda el mismo `ItemLista`. Las copias viejas se normalizan al leerse con los mismos valores por defecto.

## Dominio (`src/dominio/`, puro y probado)

**`resumenAnual.ts`:**

- `anioDe(ms)`: año local (D3).
- `aniosDisponibles(items, anioActual)`: implementa D4.
- `resumenAnual(items, anio): ResumenAnual`: devuelve la forma del enunciado 1.6 y aplica D3 y D6–D11.

**`vistaEn.ts`:**

- `cambioVistaEn(anterior, nuevo)` devuelve `'fijar' | 'borrar' | 'mantener'` (D1).
- `tieneDatos(item)` responde a P1.
- `tareasAlAbrir(items, anio, sinConexion)` devuelve `{ fechas, datos }`, con las obras que hay que migrar (D2) y completar (D6). Si `sinConexion` es verdadero, devuelve ambas listas vacías (D13).

Precisiones:

- **D6:** "del año elegido" usa `vistaEn ?? actualizadoEn` para contar también las obras que D2 está por migrar.
- **D7:** `horas = round(minutos / 60 × 10) / 10`. `peliculasSinDuracion` cuenta solo películas **con datos** (P2).
- **D8 y D9:** el desempate es el promedio de las calificaciones de esas obras. Un género sin calificadas tiene promedio −∞. Después se ordena alfabéticamente con `localeCompare('es')`.
- **D10:** `mesTop` es `null` si no hay obras (P3).
- **D11:** el empate final se decide por título alfabético (P4).

## Servicios

- **`tmdbService.obtenerDetalle`:** suma `duracionMin` (`runtime`, solo películas) y `directores` (el `crew` con `job === 'Director'`, solo películas, máximo 10) al `DetalleObra`. Usa la misma petición con `append_to_response=credits`.
- **`tmdbService.datosObra(tipo, id)`:** devuelve `{ generos, duracionMin, directores }` a partir de `obtenerDetalle`.
- **`listaService.agregar(uid, obra, datos | null)`:** escribe los datos si los hay (si no, omite `generos`) y `vistaEn: null`.
- **`listaService.actualizar(uid, id, cambios, cambioVistaEn)`:** con `'fijar'` escribe `vistaEn: serverTimestamp()`, con `'borrar'` escribe `null` y con `'mantener'` no toca el campo.
- **`listaService.fijarVistaEn(uid, id, actualizadoEnMs)`:** implementa D2; también escribe `actualizadoEn: serverTimestamp()` (P5).
- **`listaService.completarDatos(uid, id, datos)`:** implementa D6.

En `CarteleraContext`:

- `agregar` inserta al instante y pide los datos de TMDB después (P7); si fallan, la obra queda sin datos.
- `actualizar` usa `cambioVistaEn`.
- `prepararResumen(anio, alProgresar)` ejecuta las tareas de `tareasAlAbrir`: fechas primero, luego datos de una en una, informando el progreso. Lo que falle se omite.

## Reglas de Firestore

En `itemValido`:

- `hasOnly` suma los 4 campos (V1 de la auditoría).
- Se agrega el bloque del enunciado 1.6 con `get(campo, valorPorDefecto)`, para que los documentos viejos sigan siendo válidos.
- Una escritura con `duracionMin: -5` se rechaza.

Las reglas se publican desde la consola y la copia queda en `firestore.rules`.

## Componentes y pantalla (según DESIGN.md)

- **Componentes nuevos** en `src/components/resumen.tsx`: `TarjetaDato`, `BarrasPorMes`, `TarjetaDestacada` y `SelectorAnio`.
- **Componentes que se reutilizan:** `EstadoVacio`, `Cargando`, `AvisoSinConexion`, `Poster`, `Estrellas` y `Boton`.
- **Pantalla:** `src/screens/MiAnioScreen.tsx`, como pestaña "Mi año" (ícono `chart-column`). Sigue la composición de DESIGN.md › Pantallas.
- **Tema:** se mueve de `src/theme.ts` a `src/tema/index.ts`, y se suman los tokens `dato`, `espacio`, `barra`, `bordeContorno`, `brillo`, `veloHero`, `veloPoster`, `veloPortada` y `fondoCarga`.

## Tickets

T1–T6 del backlog, en orden: T1 y T2 (tests primero), T3, T4, T5 y T6.

## Criterio → verificación

| Criterio         | Verificación                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| A1.1–A1.3        | `vistaEn.test.ts` (`cambioVistaEn`) + M: marcar vista y revisar el campo en la consola         |
| A1.4, A1.5       | M: agregar una película y una serie y revisar el documento                                     |
| A1.6             | M: simulador de reglas con `duracionMin: -5` → denegado                                        |
| A2.1, A2.10      | `resumenAnual.test.ts` › totales y borde de año                                                |
| A2.2, A2.3       | `resumenAnual.test.ts` › horas                                                                 |
| A2.4             | `resumenAnual.test.ts` › género                                                                |
| A2.5, A2.6       | `resumenAnual.test.ts` › director                                                              |
| A2.7             | `resumenAnual.test.ts` › meses + M: 12 barras                                                  |
| A2.8, A2.9       | `resumenAnual.test.ts` › destacada + M: invitación                                             |
| A3.1, A3.2       | `resumenAnual.test.ts` › `aniosDisponibles`                                                    |
| A3.3, A3.4       | M: abre en el año actual; un año vacío muestra "Ir a Mi lista"                                 |
| A4.1, A4.2       | `vistaEn.test.ts` › `tareasAlAbrir` (fechas) + M: consola                                      |
| A4.3, A4.4       | `vistaEn.test.ts` › `tareasAlAbrir` (datos) + `resumenAnual.test.ts` › sin datos + M: progreso |
| A5.1, A5.3, A5.4 | M                                                                                              |
| A5.2             | `vistaEn.test.ts` › sin conexión + M: modo avión                                               |
| Colores          | `src/tema/sinColoresFijos.test.ts`                                                             |
| RF6 (P3)         | `src/dominio/lista.test.ts`                                                                    |

La verificación manual (M) se registra en [VERIFICACION.md](../VERIFICACION.md).
