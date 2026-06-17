# Handoff para continuar con Codex en local

Este documento resume el estado actual del proyecto y el siguiente paso recomendado para continuar desde una máquina local usando Codex y Firebase.

## Contexto del proyecto

Este repo contiene un álbum digital fanmade/no oficial de cromos ficticios 2026.

La visión del producto es convertir el prototipo local en una experiencia social para jugar con familia y amigos:

- Inicio de sesión.
- Primer sobre gratis una sola vez.
- Sobres ganados con misiones y monedas.
- Inventario persistido por usuario.
- Cromos repetidos útiles para intercambio.
- Salas privadas por código.
- Intercambios seguros en tiempo real.

El proyecto debe mantenerse claramente ficticio y no oficial. No debe usar marcas, logos, escudos, jugadores reales, selecciones reales, mascotas oficiales ni arte protegido.

## Estado actual en `main`

Ya existe:

```txt
public/
  index.html
  styles.css
  script.js
  firebase-config.example.js
  firebase-client.js

functions/
  index.js
  package.json

docs/
  PRODUCT_STRATEGY.md
  FIREBASE_ARCHITECTURE.md
  FIREBASE_SETUP.md
  AUTH_IMPLEMENTATION.md
  ROADMAP.md
  BACKLOG.md

firebase.json
firestore.rules
firestore.indexes.json
.firebaserc.example
.gitignore
```

El prototipo visual todavía usa `localStorage` para la experiencia local.

`public/firebase-client.js` ya centraliza la base para:

- Inicializar Firebase.
- Conectar emuladores.
- Login anónimo.
- Crear perfil con nickname.
- Escuchar perfil e inventario.
- Llamar Cloud Functions.

`functions/index.js` ya tiene esqueletos para:

- `claimStarterPack`
- `openPack`
- `completeMission`
- `createTrade`
- `acceptTrade`

## Siguiente objetivo recomendado

Implementar la primera versión online mínima:

> Login anónimo con nickname + perfil en Firestore + reclamar sobre inicial + abrir sobre desde Cloud Functions + renderizar inventario desde Firestore.

Este es el puente entre el prototipo local y el juego online real.

## Plan activo de migracion Angular

Existe un plan persistido para migrar la app estatica a Angular 22 sin romper el modo local ni Firebase:

```txt
docs/ANGULAR_22_MIGRATION_PLAN.md
```

Antes de iniciar cambios Angular, leer ese plan y continuar desde la primera fase pendiente.
Estado al 2026-06-17: `web/` ya existe con Angular 22; shell/rutas, estado local con signals,
la pagina de Paises y la componentizacion de Coleccion estan completados. La primera capa de
servicios Firebase Angular ya existe con fallback local y el flujo guest local fue verificado con
Firebase Emulator Suite: perfil, starter pack, apertura controlada, inventario online y reglas
contra doble reclamo/escritura directa. Fase 8 ya tiene mejora inicial de accesibilidad: foco visible,
labels en cromos y dialogos con `aria-labelledby`/`aria-describedby`, foco inicial y cierre con Escape.
Tambien se agrego `@angular/cdk` para `cdkTrapFocus` en dialogos; fue verificado en navegador con anclas
de foco del CDK y `npm audit --omit=dev` sin vulnerabilidades de produccion.
El siguiente foco recomendado es hacer deploy de Hosting cuando el usuario confirme publicacion. El cutover local ya esta
preparado: `firebase.json` apunta a `web/dist/web/browser`, el build de produccion excluye config/privados,
y Hosting Emulator sirve Angular en `http://127.0.0.1:5000`. Tambien se agrego
`web/public/service-worker.js` como cleanup worker para desregistrar service workers viejos que puedan servir
bundles anteriores durante QA o deploy; `/service-worker.js` tiene headers no-cache en `firebase.json`.
Hay un smoke repetible: `cd web && npm run smoke:hosting`, y un verificador completo
`cd web && npm run verify:migration`. `verify:migration` ejecuta `format:check`, `check:angular-practices`, build,
tests, `smoke:focusables`, smoke de Hosting y `smoke:keyboard-real`. `format:check` usa Prettier sobre `src/**/*.{ts,html,css}`,
`scripts/**/*.mjs` y configs raiz del workspace; `format:write` aplica el mismo alcance. El gate
`check:angular-practices` bloquea regresiones obvias contra Angular 22:
NgModule, constructores en codigo Angular de app, `@Input`/`@Output` decorators, `EventEmitter`, `*ngIf`/`*ngFor`/`*ngSwitch`,
`ngClass`/`ngStyle` y componentes sin `ChangeDetectionStrategy.OnPush`. `smoke:focusables` renderiza el
build Angular en jsdom y valida focusables de rutas clave, 240 cromos con role/button/aria-label,
Enter sobre un cromo para abrir detalle, skip link global, main#main-content, 48 paises, 16 sedes y 4 retos.
Tambien se agrego un skip link visible al foco: "Saltar al contenido principal". `smoke:keyboard-real`
usa Playwright/Chromium contra Hosting Emulator y valida Tab real al skip link, Enter al contenido principal,
Tab hasta busqueda/tab `Cromos`/cromo, Enter para abrir detalle, focus trap con Tab y Shift+Tab, y Escape para cerrar.
El smoke de Hosting ya valida repo guards,
dist sin privados, rutas SPA y que `/service-worker.js` sea JavaScript de cleanup en lugar de caer al
rewrite de `index.html`.
La QA responsive de `/coleccion` y `/paises` en desktop/mobile ya no detecta overflow horizontal.

Antes de publicar, seguir el checklist persistido:

```txt
docs/ANGULAR_22_RELEASE_CHECKLIST.md
```

Ese checklist incluye:

- comandos previos (`npm run verify:migration`, `npm audit --omit=dev`).
- smoke de teclado real con Playwright/Chromium.
- smoke local de Hosting.
- comando de deploy con `firebase-tools@14.19.0`.
- verificacion posterior al deploy.
- rollback temporal a `hosting.public = "public"`.

## Setup local esperado

```bash
git clone https://github.com/jmanuelsoberano/albun-panini-fake-2026.git
cd albun-panini-fake-2026

cp .firebaserc.example .firebaserc
cp public/firebase-config.example.js public/firebase-config.js
```

Editar `.firebaserc` con el `projectId` real de Firebase.

Editar `public/firebase-config.js` con la configuración real de la Web App de Firebase.

Para trabajar con emuladores, cambiar:

```js
export const USE_FIREBASE_EMULATORS = true;
```

Instalar dependencias de Functions:

```bash
cd functions
npm install
cd ..
```

Arrancar emuladores:

```bash
firebase emulators:start
```

Abrir:

```txt
http://localhost:5000
```

Panel de emuladores:

```txt
http://localhost:4000
```

## Orden de implementación sugerido

### 1. Crear modo Firebase en la UI

Modificar `public/index.html` para agregar un panel de sesión.

Debe mostrar:

- Estado local/Firebase.
- Nickname del jugador.
- Monedas.
- Sobres disponibles.
- Botón `Entrar como invitado`.
- Botón `Reclamar sobre inicial`.
- Botón `Abrir sobre` usando backend.

### 2. Convertir `script.js` a módulo

Cambiar en `index.html`:

```html
<script type="module" src="script.js"></script>
```

Después importar desde `firebase-client.js`:

```js
import {
  listenToSession,
  signInGuest,
  listenToInventory,
  listenToUserProfile,
  claimStarterPack,
  openPack as openPackFromFirebase
} from "./firebase-client.js";
```

### 3. Mantener fallback local

No eliminar todavía la lógica local.

Crear un flag simple:

```js
let onlineMode = false;
```

Cuando exista sesión Firebase, usar Firestore.

Cuando no exista sesión o Firebase no esté configurado, mantener modo local de prueba.

### 4. Login anónimo

Crear una acción UI:

```js
await signInGuest(nickname);
```

El nickname debe ser ficticio y editable.

No pedir nombre real ni datos personales.

### 5. Reclamar sobre inicial

Agregar botón:

```js
await claimStarterPack();
```

La Cloud Function debe garantizar que solo se pueda reclamar una vez por usuario.

### 6. Abrir sobre desde backend

Cuando el usuario esté en modo online, el botón de abrir sobre debe llamar:

```js
const result = await openPackFromFirebase("normal");
```

Después mostrar los cromos devueltos por la función en el modal de sobre.

### 7. Escuchar inventario en tiempo real

Usar:

```js
listenToInventory(user.uid, (copies) => {
  state.copies = copies;
  refresh();
});
```

El render actual puede seguir funcionando porque ya depende de `state.copies`.

### 8. Sembrar catálogo en Firestore

`openPack` depende de:

```txt
catalog/stickers
  items[]
```

Crear un script o función de seed para subir el catálogo generado por el frontend a Firestore.

Opción recomendada:

```txt
scripts/seed-catalog.js
```

Ese script debe escribir todos los cromos ficticios en `catalog/stickers`.

### 9. Validar reglas y emuladores

Probar:

- Un usuario puede iniciar sesión.
- Se crea `users/{uid}`.
- El usuario puede reclamar el sobre inicial una sola vez.
- El usuario no puede escribir inventario directo desde cliente.
- `openPack` consume un sobre disponible.
- `openPack` incrementa cromos en `users/{uid}/inventory`.
- El inventario se actualiza en UI sin recargar.

## Criterios de aceptación del siguiente PR

El siguiente PR debe cumplir:

- [ ] La app carga sin romper el modo local.
- [ ] `script.js` funciona como módulo.
- [ ] Existe UI de sesión mínima.
- [ ] Un jugador puede entrar con nickname usando Firebase Auth anónimo.
- [ ] Se crea/actualiza `users/{uid}` en Firestore.
- [ ] Se puede reclamar el sobre inicial una sola vez.
- [ ] Se puede abrir un sobre desde Cloud Functions.
- [ ] El inventario se guarda en Firestore.
- [ ] La colección se renderiza desde el inventario online.
- [ ] El modo local queda disponible solo como fallback/desarrollo.

## Prompt sugerido para Codex

Usa este prompt al abrir el repo localmente:

```txt
Quiero continuar el proyecto del álbum digital fanmade 2026. Lee primero docs/CODEX_HANDOFF.md, docs/FIREBASE_ARCHITECTURE.md, docs/AUTH_IMPLEMENTATION.md y docs/ROADMAP.md.

Objetivo del PR actual: implementar login anónimo con nickname, perfil en Firestore, reclamar sobre inicial, abrir sobre desde Cloud Functions y renderizar inventario desde Firestore, manteniendo fallback local.

No uses marcas, logos, jugadores reales ni contenido oficial. No elimines la experiencia visual existente. Haz cambios pequeños y verificables. Usa Firebase Emulator Suite para pruebas locales.
```

## Después de este paso

Cuando esté completo el login + inventario online, el siguiente bloque será:

1. Misiones y monedas reales.
2. Compra de sobres con monedas.
3. Salas privadas por código.
4. Intercambios en tiempo real.
5. Validación completa de `acceptTrade` con transacción.
