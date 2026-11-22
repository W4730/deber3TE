# DESIGN.md · Cinta

Sistema de diseño para el agente. Las decisiones visuales están en [docs/diseno/brand-board.html](docs/diseno/brand-board.html) y el brief en [docs/diseno/BRIEF.md](docs/diseno/BRIEF.md). Los valores viven **solo** en `src/tema/`; este archivo explica cuándo usar cada uno. **El agente no modifica este archivo por su cuenta.**

## Principios

1. **La luz la pone el contenido.** Fondo casi negro; el color fuerte lo aportan los pósters y un solo acento lima.
2. **Un acento, un significado.** Lima marca lo importante: la acción principal, la selección actual y el dato ganador. Si todo es lima, nada lo es.
3. **Datos grandes, contexto pequeño.** Cifra con el nivel `dato`, rótulo con `etiqueta` y explicación con `pequeno`.
4. **Accesible por defecto.** Contraste de al menos 4,5:1, toque de 44 px, etiquetas para el lector de pantalla y respeto por las tres preferencias de Accesibilidad.
5. **Nativo antes que decorado.** Fuente del sistema, controles de React Native e íconos de un solo set (Lucide).

## Tokens

Se leen siempre del tema: `const { color, texto } = useTema()` y estilos con `useEstilos((tema) => StyleSheet.create(...))`. Así cambian con alto contraste y con la escala de texto.

### Color (`color.*`)

| Token                                   | Normal           | Alto contraste | Uso                                               |
| --------------------------------------- | ---------------- | -------------- | ------------------------------------------------- |
| `fondo`                                 | #0A0A0A          | #000000        | Fondo de pantalla                                 |
| `superficie`                            | #131313          | #0D0D0D        | Tarjetas, campos, barra de pestañas               |
| `superficieAlta`                        | #1B1B1B          | #1F1F1F        | Póster vacío, etiqueta "por ver"                  |
| `borde`                                 | #262626          | #6B6B66        | Bordes de 1 px                                    |
| `texto`                                 | #F4F4F1          | #F4F4F1        | Títulos y datos                                   |
| `textoSecundario`                       | #A3A3A0          | #E6E6E2        | Cuerpo                                            |
| `textoTenue`                            | #8A8A86          | #CFCFCA        | Placeholder, rótulos, íconos inactivos            |
| `estrellaVacia`                         | #4A4A47          | #8A8A86        | Estrellas sin llenar                              |
| `acento`                                | #D4FF3A          | #D4FF3A        | Acción principal, selección, mes más activo       |
| `sobreAcento`                           | #0A0A0A          | #0A0A0A        | Texto e íconos sobre `acento`                     |
| `acentoSuave`                           | lima al 12 %     | lima al 22 %   | Fondo de "viendo", avatar e ícono de estado vacío |
| `peligro`                               | #FF7A6B          | #FF9C90        | Errores y acciones destructivas                   |
| `velo`                                  | negro al 62 %    | negro al 85 %  | Controles sobre imágenes                          |
| `barra`                                 | #666662          | #A3A3A0        | Barras de meses no ganadores                      |
| `bordeContorno`                         | lima al 40 %     | lima al 40 %   | Borde de la etiqueta sobre imagen                 |
| `brillo`                                | sombra lima 22 % | igual          | Sombra del botón primario                         |
| `veloHero`, `veloPoster`, `veloPortada` | degradados       | igual          | Fundidos sobre fotos                              |

**Estados de una obra:**

| Estado  | Fondo            | Texto             |
| ------- | ---------------- | ----------------- |
| Por ver | `superficieAlta` | `textoSecundario` |
| Viendo  | `acentoSuave`    | `acento`          |
| Vista   | `acento`         | `sobreAcento`     |
| Error   | —                | `peligro`         |

### Tipografía (`texto.*`, fuente del sistema)

| Token       | Tamaño / peso                            | Uso                          |
| ----------- | ---------------------------------------- | ---------------------------- |
| `display`   | 32 / 800, tracking −0,8                  | Título de pantalla           |
| `dato`      | 34 / 800, tracking −1, números tabulares | Cifras del resumen           |
| `titulo`    | 22 / 700                                 | Título de obra o sección     |
| `subtitulo` | 16 / 600                                 | Títulos de fila y de tarjeta |
| `cuerpo`    | 15 / 22                                  | Párrafos                     |
| `pequeno`   | 13 / 18                                  | Ayudas, notas y avisos       |
| `etiqueta`  | 11 / 700, mayúsculas, tracking 1,1       | Rótulos de sección y de dato |

Todos los tamaños se multiplican por la escala de Accesibilidad (1, 1,15 o 1,3).

### Espacio y forma

| Token     | Valores                                    |
| --------- | ------------------------------------------ |
| `espacio` | 4 · 8 · 12 · 16 · 20 · 24 · 32             |
| `MARGEN`  | 20 (lateral de toda pantalla)              |
| `radio`   | s 10 · m 14 · l 20; las pastillas usan 999 |
| `TOQUE`   | **44**, alto mínimo de todo lo tocable     |

## Componentes

Viven en `src/components/` y se reutilizan; no se crean variantes sueltas en las pantallas.

| Componente                                    | Dónde                | Uso                                                                                            |
| --------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `Boton` (primario, secundario, peligro)       | `ui.tsx`             | Un solo primario por pantalla                                                                  |
| `Chip`, `Segmentado`                          | `ui.tsx`             | Filtros y selección única; el seleccionado va en `acento`                                      |
| `Tarjeta`                                     | `ui.tsx`             | Contenedor con rótulo `etiqueta` opcional                                                      |
| `Etiqueta`, `EtiquetaEstado`                  | `ui.tsx`, `obra.tsx` | Distintivos no interactivos                                                                    |
| `Poster`, `Estrellas`, `AvisoTmdb`            | `obra.tsx`           | Póster con relleno, calificación, atribución                                                   |
| `EstadoVacio`, `Cargando`, `AvisoSinConexion` | `ui.tsx`             | Estados de pantalla                                                                            |
| `TarjetaDato` (nuevo)                         | `resumen.tsx`        | Rótulo + cifra `dato` + nota `pequeno`                                                         |
| `BarrasPorMes` (nuevo)                        | `resumen.tsx`        | 12 `View`; `acento` solo en el mes más activo y `barra` en el resto; sin librerías de gráficas |
| `TarjetaDestacada` (nuevo)                    | `resumen.tsx`        | Póster + "Tu mejor obra" + estrellas; sin calificadas invita a calificar                       |
| `SelectorAnio` (nuevo)                        | `resumen.tsx`        | Chips horizontales; abre en el año actual                                                      |

## Pantallas

- **Pestañas:** Buscar, Mi lista, **Mi año** y Perfil. Las pantallas de detalle van en la pila, sin barra de pestañas.
- **Mi año:**
  1. Título `display`.
  2. `SelectorAnio`.
  3. Avisos: sin conexión, progreso de datos y datos faltantes.
  4. Una grilla de 2 × 2 con `TarjetaDato`: obras, horas, género y director.
  5. `BarrasPorMes` con el mes más activo como rótulo.
  6. `TarjetaDestacada`.

  Estados: cargando, vacío (D12, con "Ir a Mi lista") y sin conexión (D13).

## Voz

Habla de tú, con frases cortas: primero el problema y luego qué hacer. Celebra sin exagerar y nunca usa códigos técnicos.

| Caso            | Mensaje                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| Vacío           | "No viste nada en 2023. Marca obras como vistas y aquí aparecerá tu año."              |
| Sin conexión    | "Sin conexión. Ves la última copia guardada de tu lista."                              |
| Datos faltantes | "1 obra quedó sin datos de TMDB." / "2 películas no tienen duración y no suman horas." |
| Sin calificadas | "Califica lo que viste este año y aquí aparecerá tu mejor obra."                       |

## Accesibilidad

- Contraste ≥ 4,5:1 en todo texto; la tabla está en el brand board.
- Todo lo tocable mide al menos 44 × 44 y tiene `accessibilityRole` y `accessibilityLabel`.
- Las barras por mes anuncian "octubre, 6 obras"; la tarjeta de dato se lee completa ("Horas de cine, 37,5 horas").
- Se respetan tamaño de texto, alto contraste y reducir movimiento (sin animaciones si está activo).

## Sí y no

| Sí                                              | No                                                  |
| ----------------------------------------------- | --------------------------------------------------- |
| Colores y tamaños desde `src/tema/`             | Hexadecimales o `rgba()` en pantallas y componentes |
| Un único botón primario por pantalla            | Dos acciones en lima compitiendo                    |
| Barras con `View`                               | Librerías de gráficas                               |
| Cifras con `texto.dato`                         | Números grandes con estilos sueltos                 |
| Íconos de Lucide                                | Emojis o glifos Unicode como íconos                 |
| Logo de TMDB más pequeño que la marca           | TMDB más visible que Cinta                          |
| Estados vacío, error y sin conexión con mensaje | Pantallas en blanco o "Error" a secas               |

## Decisiones pendientes

- **Brillo lima del botón primario:** viene de las maquetas originales. Confirmar si se conserva o se reemplaza por una sombra neutra.
- **Fuente:** decidir si se reemplaza la fuente del sistema por Inter, la de la maqueta. Hoy se usa la del sistema por rendimiento y por el aspecto nativo.
