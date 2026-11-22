---
name: commit
description: Crea un commit en español con prefijo convencional (docs:, feat:, fix:, test:, chore:) después de verificar tests y tipos. Usar cuando el usuario pida "commit", "/commit" o guardar cambios en git.
---

# /commit

1. Revisa `git status` y `git diff`. Solo entra lo relacionado con un único cambio; nunca `.env` ni claves.
2. Si el cambio toca código (`src/`, `firestore.rules`, `App.tsx`), corre `npm test` y `npx tsc --noEmit`. Si alguno falla, **no hagas el commit**: muestra el error. La única excepción es un commit `test:` con tests en rojo escritos antes del código.
3. Elige el prefijo:
   - `docs:` auditoría, PRD, backlog, spec, diseño, README, AGENTS.md
   - `test:` tests nuevos o cambiados
   - `feat:` funcionalidad nueva
   - `fix:` corrección de un fallo
   - `chore:` configuración, dependencias, harness
4. Mensaje en español, en imperativo o descriptivo, de 72 caracteres o menos en la primera línea; el porqué va en el cuerpo si hace falta.
5. Orden de la épica: el `docs:` de un cambio va antes que su `test:`, y el `test:` antes que su `feat:` o `fix:`.
