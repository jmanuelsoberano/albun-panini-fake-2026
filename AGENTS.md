# Instrucciones para agentes de desarrollo

## Contexto

Este proyecto es un álbum digital fanmade/no oficial de cromos ficticios 2026.

Debe mantenerse claramente ficticio:

- No usar marcas oficiales.
- No usar logos, escudos o mascotas oficiales.
- No usar jugadores reales.
- No usar selecciones reales.
- No copiar arte, layout comercial o assets protegidos.

## Objetivo inmediato

Leer primero:

1. `docs/CODEX_HANDOFF.md`
2. `docs/FIREBASE_ARCHITECTURE.md`
3. `docs/AUTH_IMPLEMENTATION.md`
4. `docs/ROADMAP.md`
5. `docs/BACKLOG.md`

El siguiente bloque de trabajo es:

> Login anónimo con nickname + perfil en Firestore + sobre inicial + apertura de sobres desde Cloud Functions + inventario renderizado desde Firestore.

## Reglas técnicas

- Mantener la experiencia visual existente.
- No eliminar el modo local todavía; debe quedar como fallback/desarrollo.
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
