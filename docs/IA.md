# Bitácora de IA

> **Borrador.** Lo escribió el agente con hechos reales del desarrollo. Antes de entregarlo, revísalo y reescríbelo con tus palabras: en la demo te pueden pedir que expliques cualquiera de estos momentos.

Herramienta: Claude Code (Claude Opus) con el harness del repositorio: `AGENTS.md`, `DESIGN.md`, la skill `/commit`, el hook de Prettier y los sensores de Vitest.

## 1. La plantilla de AGENTS.md mandaba usar Expo Router

- **Qué se pidió:** leer el proyecto y auditarlo contra los RF1–RF10.
- **Qué hizo el agente:** encontró que `AGENTS.md` era la plantilla de Expo y ordenaba usar Expo Router, mientras que la app usa React Navigation (requisito del P3).
- **Qué se corrigió:** se reescribió `AGENTS.md` con las capas reales, los comandos de verificación y las reglas (H-02).
- **Qué parte del harness lo habría evitado:** un `AGENTS.md` propio desde el inicio. Esa es justamente la "guía" del harness.

## 2. El token de TMDB y la configuración de Firebase se pegaron en el chat

- **Qué se pidió (P3):** arreglar la API de TMDB, que no funcionaba.
- **Qué hizo el agente:** recibió el token en el chat, leyó `.env` y vio que contenía la API Key en vez del Read Access Token.
- **Qué se corrigió:** el token quedó fuera del repositorio (`.env` ignorado, sin claves en el historial), pero queda expuesto en la conversación, así que hay que regenerarlo (H-08).
- **Qué parte del harness lo habría evitado:** la regla "nunca leer, mostrar ni editar `.env`" de `AGENTS.md` y no pegar claves en el chat.

## 3. El fragmento de reglas del enunciado no bastaba

- **Qué se pidió:** integrar las reglas de 1.6 para los campos nuevos.
- **Qué hizo el agente:** al revisar las reglas del P3 notó que `itemValido` usa `hasOnly([...])`; sin sumar los 4 campos, Firestore rechazaría toda escritura con ellos.
- **Qué se corrigió:** los campos se agregaron a `hasOnly` y quedó documentado en el PRD (P5), la spec y la auditoría (V1, N-01).
- **Qué parte del harness lo habría evitado:** la auditoría inicial antes de escribir código.

## 4. Los tests dependían de la zona horaria

- **Qué se pidió:** tests de D3 ("año de `vistaEn` en hora local").
- **Qué hizo el agente:** identificó que un test sin zona fija daría resultados distintos en otra máquina (una obra vista el 31-dic a las 23:30 cambia de año en UTC).
- **Qué se corrigió:** se fijó `TZ=America/Guayaquil` en `vitest.config.mts` y se agregó un test del borde de año.
- **Qué parte del harness lo habría evitado:** escribir los tests desde la spec antes que el código (commit `test:` en rojo).

## 5. Colores fijos que el sensor literal no veía

- **Qué se pidió:** un test que falle si hay un hexadecimal fuera de `src/tema/`.
- **Qué hizo el agente:** además del `#000`, encontró 10 colores `rgba()` (degradados, velos y sombra) que un sensor solo de hexadecimales dejaría pasar.
- **Qué se corrigió:** el sensor busca hex y `rgb()`/`rgba()`. Empezó en rojo con 34 hallazgos y quedó en verde al mover todo a tokens.
- **Qué parte del harness lo habría evitado:** `DESIGN.md` con la regla "Sí/No" y el propio sensor.
