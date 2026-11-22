# Verificación · Mi año en cine

**Cómo se llena:**

- La columna **Resultado obtenido** se completa **a mano** probando en el teléfono con Expo Go (SDK 57), con fecha.
- Los criterios marcados **T** también los cubre un test automático. Su estado está en la columna _Test_: cada test lleva el nombre de su archivo en `src/dominio/`, y "pasa" significa que pasó en `npm test` el 22-nov-2026.

**Antes de probar:**

1. Publica las reglas de [firestore.rules](../firestore.rules) en Firebase (Firestore → Reglas).
2. Corre `npx expo start -c` y abre la app en Expo Go.
3. Usa una cuenta con al menos 6 obras: películas y series, algunas vistas y calificadas.

| Id          | Pasos                                                                                 | Resultado esperado                                                                | Test                        | Resultado obtenido |
| ----------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------- | ------------------ |
| A1.1        | Editar una obra "por ver" → Vista → Guardar; revisar el documento en la consola       | `vistaEn` con la fecha de hoy                                                     | `vistaEn.test` pasa         |                    |
| A1.2        | Esa obra → Viendo → Guardar                                                           | `vistaEn` = `null`                                                                | `vistaEn.test` pasa         |                    |
| A1.3        | Obra vista → cambiar solo estrellas o comentario                                      | `vistaEn` no cambia                                                               | `vistaEn.test` pasa         |                    |
| A1.4        | Agregar una película desde Detalle y otra desde el ícono de Buscar                    | El documento tiene `generos` (en español), `duracionMin` y `directores`           | —                           |                    |
| A1.5        | Agregar una serie                                                                     | `duracionMin` = `null`, `directores` = `[]`                                       | —                           |                    |
| A1.6        | Simulador de reglas: `update` con `duracionMin: -5`                                   | Denegado                                                                          | —                           |                    |
| A2.1        | Abrir Mi año en el año actual                                                         | Total, películas y series correctos                                               | `resumenAnual.test` pasa    |                    |
| A2.2        | Comparar las horas con la suma de duraciones                                          | Horas con un decimal y coma (p. ej. 5,9 h); las series no suman                   | `resumenAnual.test` pasa    |                    |
| A2.3        | Tener una película sin duración                                                       | Nota "1 sin duración" y aviso de datos faltantes                                  | `resumenAnual.test` pasa    |                    |
| A2.4        | Revisar la tarjeta Género                                                             | Gana el de más obras; en empate, el de mejor promedio y luego el alfabético       | `resumenAnual.test` pasa    |                    |
| A2.5        | Revisar la tarjeta Director                                                           | Solo cuentan películas                                                            | `resumenAnual.test` pasa    |                    |
| A2.6        | Año con películas sin director                                                        | "No hay datos suficientes"                                                        | `resumenAnual.test` pasa    |                    |
| A2.7        | Revisar las barras                                                                    | 12 barras; el mes más activo en lima y en el rótulo                               | `resumenAnual.test` pasa    |                    |
| A2.8        | Revisar Tu mejor obra                                                                 | La de mayor calificación; tocarla abre Editar                                     | `resumenAnual.test` pasa    |                    |
| A2.9        | Año sin obras calificadas                                                             | La tarjeta invita a calificar                                                     | `resumenAnual.test` pasa    |                    |
| A2.10       | (Solo test) obra vista el 31-dic 23:30                                                | Cuenta en ese año                                                                 | `resumenAnual.test` pasa    | n/a                |
| A3.1        | Abrir el selector de año                                                              | Años con obras + el actual, del más reciente al más antiguo                       | `resumenAnual.test` pasa    |                    |
| A3.2        | Cuenta nueva sin obras vistas                                                         | Solo el año actual                                                                | `resumenAnual.test` pasa    |                    |
| A3.3        | Abrir Mi año                                                                          | Seleccionado el año actual                                                        | —                           |                    |
| A3.4        | Elegir un año sin obras (p. ej. crear vistas solo en uno)                             | "No viste nada en …" + botón "Ir a Mi lista" que abre la pestaña                  | —                           |                    |
| A4.1        | Con una cuenta del Proyecto 3 (obras vistas sin `vistaEn`), abrir Mi año con conexión | Las obras aparecen en el año de su última edición y `vistaEn` queda en la consola | `vistaEn.test` pasa         |                    |
| A4.2        | Cerrar y abrir Mi año otra vez                                                        | No se reescribe `vistaEn`                                                         | `vistaEn.test` pasa         |                    |
| A4.3        | Obras vistas del año sin `generos`                                                    | Aviso "Completando datos de TMDB… n de m" y luego los datos en la consola         | `vistaEn.test` pasa         |                    |
| A4.4        | Obra cuyo TMDB falla (difícil de forzar; opcional)                                    | Cuenta en el total y el aviso dice cuántas quedaron sin datos                     | `resumenAnual.test` pasa    |                    |
| A5.1        | Abrir Mi año recién iniciada la sesión                                                | Indicador de carga mientras llega la lista                                        | —                           |                    |
| A5.2        | Modo avión → abrir Mi año                                                             | Resumen con la copia local + aviso "Sin conexión"; sin progreso de datos          | `vistaEn.test` pasa         |                    |
| A5.3        | Año vacío                                                                             | Mensaje claro y "Ir a Mi lista"                                                   | —                           |                    |
| A5.4        | Obras sin datos o películas sin duración                                              | Aviso con cuántas son                                                             | —                           |                    |
| Diseño      | Perfil → Accesibilidad → texto Máximo y alto contraste → Mi año                       | Todo se lee y nada se corta; colores del tema de alto contraste                   | `sinColoresFijos.test` pasa |                    |
| Aislamiento | Cuenta B intenta leer `usuarios/{uidA}/mi_lista` en el simulador                      | Denegado                                                                          | —                           |                    |

## Lo que falló y cómo se resolvió

| Fecha  | Qué falló                                                                   | Qué se hizo                                   |
| ------ | --------------------------------------------------------------------------- | --------------------------------------------- |
| 22-nov | En la vista web previa, los chips del selector de año se estiraban a ~95 px | `fix: el selector de año no estira los chips` |
|        |                                                                             |                                               |
