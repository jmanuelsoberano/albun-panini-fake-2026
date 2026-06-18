# Codex handoff

## Estado del producto

Álbum digital del Mundial 2026 con datos reales de texto. La app debe permitir explorar la
colección, equipos, sedes, grupos, partidos, goleadores y llaves. La experiencia sin sesión es
solo lectura; las acciones de juego requieren login.

## Reglas vigentes

- Usar datos reales del Mundial 2026.
- Mantener nombres de selecciones, jugadores, sedes y calendario en español cuando aplique.
- No inventar marcadores, goleadores, equipos, sedes ni jugadores.
- Si un dato no está verificado, mostrarlo como pendiente.
- No usar logos, escudos, fotografías, mascotas, tipografías ni arte protegido.
- Mantener herramientas locales solo para desarrollo/QA.

## Archivos clave

```txt
web/src/app/core/data/worldcup-facts.ts
web/src/app/core/data/tournament-fixtures.ts
web/src/app/core/data/album-catalog.ts
web/src/app/core/firebase/
web/src/app/features/
functions/index.js
firestore.rules
firebase.json
```

## Flujo de autenticación esperado

- Sin sesión: lectura de colección, equipos, sedes y torneo.
- CTA principal: iniciar sesión con Google.
- Con sesión: reclamar sobre inicial, abrir sobres, inventario desde Firestore y misiones.
- El cliente no modifica inventario directamente.
- `claimStarterPack`, `openPack` y misiones pasan por Cloud Functions.

## Verificación recomendada

```bash
cd web
npm run verify:migration
```

Validaciones específicas:

- `npm run smoke:real-worldcup-content`
- `npm run smoke:tournament`
- `npm run smoke:auth-gate`
- `npm run smoke:responsive`

## Próximo bloque sugerido

1. Fortalecer login con Google y perfil editable.
2. Confirmar reglas Firestore con emuladores.
3. Añadir actualización controlada de resultados desde fuente verificada.
4. Preparar flujo de intercambios con transacciones.
