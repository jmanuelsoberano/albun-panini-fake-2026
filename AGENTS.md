# Instrucciones para agentes de desarrollo

## Contexto

Este proyecto es un álbum digital del Mundial 2026 con datos reales de texto.

## Regla vigente de producto

- Usar selecciones reales del Mundial 2026.
- Usar jugadores reales de las plantillas disponibles en el repositorio.
- Usar grupos, sedes, calendario, marcadores y goleadores verificados.
- No inventar resultados, sedes, equipos ni jugadores.
- Mantener la interfaz en español.
- No usar logos, escudos, mascotas, fotografías, tipografías ni arte protegido.
- Si un dato deportivo no está verificado, mostrarlo como pendiente.

## Objetivo técnico inmediato

Leer primero:

1. `docs/CODEX_HANDOFF.md`
2. `docs/FIREBASE_ARCHITECTURE.md`
3. `docs/AUTH_IMPLEMENTATION.md`
4. `docs/ROADMAP.md`
5. `docs/BACKLOG.md`

El bloque de trabajo vigente es:

> Login con Google + nickname + perfil en Firestore + sobre inicial + apertura de sobres desde
> Cloud Functions + inventario renderizado desde Firestore.

## Reglas técnicas

- Mantener el modo local solo como fallback de desarrollo, oculto de la UI pública.
- La experiencia pública sin sesión debe ser solo lectura con CTA claro de login.
- Las acciones sensibles deben pasar por Cloud Functions.
- El cliente no debe modificar inventario directamente.
- `openPack` debe consumir sobres disponibles desde backend.
- `claimStarterPack` debe poder ejecutarse solo una vez por usuario.
- Los intercambios futuros deben usar transacciones.

## Firebase

Archivos relevantes:

```txt
public/firebase-config.example.js
public/firebase-client.js
firebase.json
firestore.rules
firestore.indexes.json
functions/index.js
```

Configuración local esperada:

```bash
cp .firebaserc.example .firebaserc
cp public/firebase-config.example.js public/firebase-config.js
cd functions
npm install
cd ..
firebase emulators:start
```

`public/firebase-config.js` no debe subirse al repositorio.

## Criterio general de cambios

Hacer cambios pequeños y verificables.

Cada PR debe explicar:

- Qué cambia.
- Cómo probarlo.
- Qué issue avanza.
- Qué queda pendiente.
