# PRD · Cinta (Mi Cartelera Personal)

## Producto

Cinta es una app móvil para llevar una lista personal de películas y series de TMDB. Cada obra está por ver, viendo o vista y puede tener calificación (1–5) y comentario. La lista es privada: cada usuario solo ve la suya (Firebase Auth + Firestore).

## Épica A · Mi año en cine

**Problema:** el usuario guarda y califica lo que ve, pero no puede mirar atrás: no sabe cuánto vio en un año ni qué le gustó más.

**Objetivo:** una pestaña nueva con el resumen de un año calendario:

- obras vistas, separadas en películas y series;
- horas de cine;
- género y director más vistos;
- mes más activo, con una barra por mes;
- obra destacada;
- selector de año.

**Fuera de alcance:**

- Revisionados: cada obra cuenta una vez.
- Compartir el resumen.
- Estadísticas de varios años juntos.
- Notificaciones.
- Gráficas con librerías externas.

**Métrica de éxito:** con una lista de al menos 10 obras vistas, el resumen carga en menos de 2 s con conexión. Sin conexión muestra la última copia con un aviso.

## Cambios al modelo

Ruta sin cambios: `usuarios/{uid}/mi_lista/{itemId}`. Se agregan cuatro campos opcionales:

| Campo         | Tipo                   | Regla                                                |
| ------------- | ---------------------- | ---------------------------------------------------- |
| `vistaEn`     | timestamp o `null`     | D1, D2                                               |
| `generos`     | lista de texto (≤ 10)  | D5; si falta el campo, la obra está "sin datos" (D6) |
| `duracionMin` | entero 1–1000 o `null` | D5                                                   |
| `directores`  | lista de texto (≤ 10)  | D5                                                   |

## Reglas de negocio (decisiones del cliente)

| #   | Tema                           | Regla                                                                                                                                                                                                                                                                    |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Fecha de visionado             | Al pasar a "vista", `vistaEn = serverTimestamp`. Si deja de estar vista, vuelve a `null`; si vuelve a vista, toma la fecha nueva. Editar calificación o comentario no la cambia                                                                                          |
| D2  | Obras vistas antes de la épica | Al abrir Mi año en cine, las obras vistas sin `vistaEn` reciben `vistaEn = actualizadoEn`. Se hace una vez y se guarda en Firestore                                                                                                                                      |
| D3  | Año de una obra                | El año calendario de `vistaEn` en la hora local del teléfono. Cada obra cuenta una sola vez                                                                                                                                                                              |
| D4  | Años del selector              | Años con al menos una obra vista, más el año actual, del más reciente al más antiguo. Se abre en el año actual                                                                                                                                                           |
| D5  | Datos de TMDB                  | Al agregar se guardan `generos` (en español), `duracionMin` (solo películas; `null` en series) y `directores` (solo películas; lista vacía en series)                                                                                                                    |
| D6  | Obras sin esos datos           | Al abrir el resumen se completan desde TMDB las obras vistas del año elegido que no los tienen, de una en una y con progreso visible. Si TMDB falla para una obra, cuenta en el total pero no en horas, género ni director, y el resumen dice cuántas quedaron sin datos |
| D7  | Horas de cine                  | Suma de `duracionMin` de las películas vistas, en horas con un decimal (37,5 h). Las series no suman horas. Una película sin duración no suma y el resumen lo indica                                                                                                     |
| D8  | Género más visto               | Cada obra suma 1 a cada uno de sus géneros y gana el que tenga más obras. Empate: mayor promedio de calificación personal entre sus obras calificadas (sin calificadas pierde). Si persiste, orden alfabético                                                            |
| D9  | Director más visto             | Solo películas; cada director suma 1. Mismo desempate que D8. Si ninguna película tiene director, la tarjeta dice que no hay datos suficientes                                                                                                                           |
| D10 | Mes más activo                 | El mes con más obras vistas; empate, el más reciente. Se muestran los 12 meses, también los que tienen 0                                                                                                                                                                 |
| D11 | Obra destacada                 | La de mayor calificación personal; empate, la de `vistaEn` más reciente. Sin obras calificadas, la tarjeta invita a calificar                                                                                                                                            |
| D12 | Resumen vacío                  | Un año sin obras vistas muestra un estado vacío con el botón "Ir a Mi lista"                                                                                                                                                                                             |
| D13 | Sin conexión                   | El resumen se calcula con la copia de AsyncStorage y muestra un aviso. Sin conexión no se completan datos ni se migran fechas                                                                                                                                            |

Todas se calculan en funciones puras de `src/dominio/`, probadas con Vitest. El año actual llega como parámetro y nunca se lee con `new Date()` dentro del dominio.

## Puntos abiertos

Son decisiones tomadas por el equipo a falta de regla del cliente. Se confirman con el docente.

| #   | Caso no cubierto                                                                                                 | Decisión provisional                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | ¿Qué es "sin datos" en D6, si una serie tiene legítimamente `directores: []` y `duracionMin: null`?              | "Sin datos" = el documento **no tiene el campo `generos`**. Una lista de géneros vacía que vino de TMDB sí cuenta como "con datos"                              |
| P2  | D7 dice "una película sin duración no suma y el resumen lo indica". ¿Se cuentan también las que no tienen datos? | `peliculasSinDuracion` cuenta solo películas con datos y `duracionMin = null`. Las que no tienen datos van en `obrasSinDatos` (D6), para no contarlas dos veces |
| P3  | D10 cuando no hay obras en el año                                                                                | `mesTop = null`; la tarjeta no se muestra porque aplica el estado vacío de D12                                                                                  |
| P4  | D11 si también empata `vistaEn`                                                                                  | Gana el título en orden alfabético, para que el resultado sea determinista                                                                                      |
| P5  | D2 escribe `vistaEn`, pero las reglas exigen `actualizadoEn == request.time` en cada escritura                   | La migración también actualiza `actualizadoEn`; `vistaEn` copia el valor **anterior**                                                                           |
| P6  | D3 y la zona horaria en los tests                                                                                | Los tests fijan `TZ=America/Guayaquil` y cubren el borde 31-dic / 1-ene                                                                                         |
| P7  | Agregar desde el ícono de Buscar (sin detalle cargado)                                                           | La obra se agrega al instante y los datos de TMDB se piden después; si fallan, D6 los completa al abrir el resumen                                              |
