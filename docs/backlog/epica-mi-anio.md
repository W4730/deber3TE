# Épica A · Mi año en cine

Fuente: [PRD](../prd/PRD.md). Cada criterio se comprueba con un test (**T**) o con una acción en el teléfono (**M**). La tabla criterio → verificación está en la [spec](../specs/01-mi-anio-en-cine.md).

## HU-A.1 · Como usuario, quiero que la app recuerde cuándo vi cada obra

| Id   | Criterio                                                                                                                                 | Decisión | Verif.                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- |
| A1.1 | **DADO** una obra "por ver" **CUANDO** la marco como vista y guardo **ENTONCES** `vistaEn` queda con la fecha del servidor               | D1       | T + M                   |
| A1.2 | **DADO** una obra vista **CUANDO** la paso a "viendo" o "por ver" **ENTONCES** `vistaEn` vuelve a `null`                                 | D1       | T + M                   |
| A1.3 | **DADO** una obra vista **CUANDO** solo cambio la calificación o el comentario **ENTONCES** `vistaEn` no cambia                          | D1       | T                       |
| A1.4 | **DADO** que agrego una película **CUANDO** se guarda **ENTONCES** el documento tiene `generos` en español, `duracionMin` y `directores` | D5       | M                       |
| A1.5 | **DADO** que agrego una serie **CUANDO** se guarda **ENTONCES** `duracionMin` es `null` y `directores` es `[]`                           | D5       | M                       |
| A1.6 | **DADO** una escritura con `duracionMin: -5` **CUANDO** llega a Firestore **ENTONCES** las reglas la rechazan                            | 1.6      | M (simulador de reglas) |

## HU-A.2 · Como usuario, quiero ver mi resumen del año

| Id    | Criterio                                                                                                                                                                    | Decisión | Verif. |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| A2.1  | **DADO** obras vistas en el año **CUANDO** abro Mi año **ENTONCES** veo el total, y cuántas son películas y cuántas series                                                  | D3       | T + M  |
| A2.2  | **DADO** películas de 120 y 105 min **CUANDO** se calcula **ENTONCES** las horas son 3,8 h y las series no suman                                                            | D7       | T      |
| A2.3  | **DADO** una película con datos y sin duración **CUANDO** se calcula **ENTONCES** no suma horas y el resumen dice "1 película sin duración"                                 | D7       | T + M  |
| A2.4  | **DADO** dos géneros empatados en obras **CUANDO** se calcula **ENTONCES** gana el de mayor promedio de calificación; si ninguno tiene calificadas o empatan, el alfabético | D8       | T      |
| A2.5  | **DADO** películas con directores **CUANDO** se calcula **ENTONCES** gana el más repetido, con el mismo desempate que D8; las series no cuentan                             | D9       | T      |
| A2.6  | **DADO** que ninguna película tiene director **CUANDO** veo la tarjeta **ENTONCES** dice que no hay datos suficientes                                                       | D9       | T + M  |
| A2.7  | **DADO** obras en varios meses **CUANDO** se calcula **ENTONCES** veo 12 barras (incluidas las de 0) y el mes más activo; un empate lo gana el mes más reciente             | D10      | T + M  |
| A2.8  | **DADO** obras calificadas **CUANDO** se calcula **ENTONCES** la destacada es la de mayor calificación; un empate lo gana la de `vistaEn` más reciente                      | D11      | T      |
| A2.9  | **DADO** que no hay obras calificadas en el año **CUANDO** veo la tarjeta destacada **ENTONCES** me invita a calificar                                                      | D11      | T + M  |
| A2.10 | **DADO** una obra vista el 31-dic a las 23:30 hora local **CUANDO** se calcula **ENTONCES** cuenta en ese año, no en el siguiente                                           | D3       | T      |

## HU-A.3 · Como usuario, quiero cambiar de año

| Id   | Criterio                                                                                                                      | Decisión | Verif. |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| A3.1 | **DADO** obras vistas en 2024 y 2026 y año actual 2026 **CUANDO** abro el selector **ENTONCES** veo 2026 y 2024, en ese orden | D4       | T      |
| A3.2 | **DADO** que no tengo obras vistas **CUANDO** abro el selector **ENTONCES** solo veo el año actual                            | D4       | T      |
| A3.3 | **DADO** que abro Mi año **CUANDO** carga **ENTONCES** está seleccionado el año actual                                        | D4       | M      |
| A3.4 | **DADO** un año sin obras vistas **CUANDO** lo elijo **ENTONCES** veo un estado vacío con el botón "Ir a Mi lista"            | D12      | M      |

## HU-A.4 · Como usuario, quiero ver mi resumen aunque mis obras sean anteriores a esta épica

| Id   | Criterio                                                                                                                                        | Decisión | Verif.            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| A4.1 | **DADO** obras vistas sin `vistaEn` **CUANDO** abro Mi año con conexión **ENTONCES** reciben `vistaEn = actualizadoEn` y se guarda en Firestore | D2       | T (selección) + M |
| A4.2 | **DADO** que la migración ya se hizo **CUANDO** vuelvo a abrir Mi año **ENTONCES** no se reescribe nada                                         | D2       | T                 |
| A4.3 | **DADO** obras vistas del año sin datos de TMDB **CUANDO** abro Mi año **ENTONCES** se completan de una en una y veo "Completando datos 2 de 5" | D6       | T (selección) + M |
| A4.4 | **DADO** que TMDB falla para una obra **CUANDO** termina **ENTONCES** la obra cuenta en el total y el resumen dice "1 obra sin datos"           | D6       | T + M             |

## HU-A.5 · Como usuario, quiero entender un resumen vacío o incompleto

| Id   | Criterio                                                                                                                                           | Decisión | Verif.            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| A5.1 | **DADO** que la lista está cargando **CUANDO** abro Mi año **ENTONCES** veo un indicador de carga                                                  | —        | M                 |
| A5.2 | **DADO** que estoy sin conexión **CUANDO** abro Mi año **ENTONCES** el resumen usa la copia local, aparece el aviso y no se migra ni completa nada | D13      | T (selección) + M |
| A5.3 | **DADO** un año vacío **CUANDO** lo veo **ENTONCES** el mensaje explica que no hay obras vistas ese año y ofrece "Ir a Mi lista"                   | D12      | M                 |
| A5.4 | **DADO** obras sin datos o películas sin duración **CUANDO** veo el resumen **ENTONCES** un aviso dice cuántas son                                 | D6, D7   | M                 |

## Tickets

**Definition of Done (todos los tickets):**

- Commit `docs:` previo si cambia la spec.
- Tests escritos antes (`test:`).
- `npm test` y `npx tsc --noEmit` en verde.
- Sin colores fuera de `src/tema/`.
- Criterios del ticket con verificación asignada.

| Ticket | Alcance                                                                                                    | Criterios                  |
| ------ | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| T1     | `src/dominio/resumenAnual.ts`: `resumenAnual`, `aniosDisponibles`, `anioDe`                                | A2.1–A2.10, A3.1, A3.2     |
| T2     | `src/dominio/vistaEn.ts`: transición de `vistaEn`, selección de migraciones y de obras sin datos           | A1.1–A1.3, A4.1–A4.4, A5.2 |
| T3     | Modelo y servicios: campos nuevos en `ItemLista`, directores en `tmdbService`, escritura en `listaService` | A1.1–A1.5                  |
| T4     | Reglas de Firestore con los 4 campos (`hasOnly` + validación)                                              | A1.6                       |
| T5     | `src/tema/`: mover el tema y tokens nuevos; quitar colores fijos de las pantallas                          | Sensor de colores          |
| T6     | Pantalla Mi año en cine + componentes (tarjeta de dato, barras, destacada, selector de año, estados)       | A2.x, A3.3, A3.4, A5.x     |
