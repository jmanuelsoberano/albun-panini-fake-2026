# Plan de migracion a Angular 22

Estado: en seguimiento - Fases 1 a 9 completadas para el corte local; Fase 10 parcial; gates automatizados de formato, practicas Angular 22, focusables, teclado real en Chromium y cleanup de service worker stale agregados; siguiente foco: deploy publicado con confirmacion explicita  
Ultima actualizacion: 2026-06-17  
Objetivo: migrar la app estatica actual a Angular 22 sin romper el modo local, Firebase, ni el deploy existente mientras se hace el traspaso.

## Referencias oficiales

- Angular LLM index: https://angular.dev/llms.txt
- Angular v22 release: https://angular.dev/events/v22
- Angular style guide: https://angular.dev/style-guide
- Angular version compatibility: https://angular.dev/reference/versions
- Angular update guide: https://angular.dev/update-guide
- Angular CLI: https://angular.dev/tools/cli

## Referencias internas

- Checklist de release Angular 22: `docs/ANGULAR_22_RELEASE_CHECKLIST.md`

## Archivo adjunto

No encontre un archivo adjunto dentro del workspace ni en `docs/` al crear este plan. Cuando el archivo este disponible, se debe agregar aqui:

- Ruta del archivo:
- Reglas nuevas:
- Reglas que contradicen este plan:
- Cambios aplicados al plan:

No iniciar la fase de implementacion final sin revisar ese archivo si el usuario lo vuelve a proporcionar.

## Estado actual del repo

La aplicacion principal vive en `public/`:

```txt
public/index.html
public/styles.css
public/script.js
public/firebase-client.js
public/firebase-config.example.js
public/content/worldcup-facts.js
public/content/private-content.example.json
```

Firebase vive en la raiz y en `functions/`:

```txt
firebase.json
firestore.rules
firestore.indexes.json
functions/index.js
functions/package.json
```

Ya existe workspace Angular en paralelo:

```txt
web/
  angular.json
  package.json
  package-lock.json
  src/main.ts
  src/app/app.ts
  src/app/app.routes.ts
```

La app estatica legacy sigue en `public/` y no se debe eliminar todavia.

El proyecto ya tiene cambios importantes sin commitear en la rama actual. Antes de iniciar la migracion real, revisar `git status` y decidir si se crea PR/commit de esos cambios.

## Restricciones de producto

- Mantener el proyecto como experiencia de datos reales de texto, sin logos ni assets protegidos.
- Se permiten datos factuales de texto, como paises, sedes y nombres de jugadores.
- No versionar logos, escudos, mascotas, fotos oficiales, marcas, tipografias comerciales ni arte protegido.
- Mantener `public/firebase-config.js` fuera de git.
- Mantener `public/content/private-content.json` y `public/private-assets/` fuera de git y fuera de Hosting.
- No romper el modo local mientras Angular no este listo.
- No permitir escritura directa del cliente en inventario.
- Acciones sensibles deben pasar por Cloud Functions o por la capa controlada acordada para Spark/local.

## Compatibilidad Angular 22

Segun la tabla oficial de compatibilidad, Angular 22 requiere:

```txt
Angular: 22.0.x
Node.js: ^22.22.3 || ^24.15.0 || ^26.0.0
TypeScript: >=6.0.0 <6.1.0
RxJS: ^6.5.3 || ^7.4.0
```

Estado local detectado el 2026-06-17:

```txt
node inicial: v24.13.1
npm inicial: 11.8.0
runtime bundled node: v24.14.0
node compatible instalado con nvm4w: v24.15.0
npm compatible instalado con nvm4w: 11.12.1
```

Accion requerida para continuar: ejecutar comandos de `web/` con Node `24.15.0+`, `22.22.3+` o `26.0.0+`. En esta maquina se puede usar:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
```

## Estrategia tecnica

Crear Angular en paralelo dentro de `web/` para no pisar la app estatica actual:

```txt
web/
  angular.json
  package.json
  src/
```

La app estatica en `public/` se mantiene como fallback hasta que Angular cumpla todos los criterios de aceptacion. Solo al final se cambia `firebase.json` para publicar el build Angular.

Target de Hosting despues del cutover:

```txt
web/dist/<app-name>/browser
```

Durante la migracion:

- `public/` sigue sirviendo la version estable.
- `web/` sirve la version Angular en desarrollo.
- Firebase Functions, Firestore rules e indexes siguen en raiz.

## Arquitectura Angular objetivo

Usar Angular 22 moderno:

- Standalone components.
- Routing por feature.
- Signals para estado local derivado.
- `computed` para progreso, repetidos y filtros.
- `inject()` para DI; evitar constructores en codigo Angular de app salvo excepcion documentada.
- `@if`, `@for` y `@switch` para templates.
- `class` y `style` bindings en lugar de `ngClass`/`ngStyle` cuando aplique.
- Componentes enfocados en presentacion; logica de dominio en servicios o utilidades.
- `protected` para miembros usados solo por templates.
- `readonly` para inputs, outputs, queries y dependencias que no deben reasignarse.
- Pruebas cerca del codigo probado con sufijo `.spec.ts`.
- Carpetas por feature, no por tipo generico.

Estructura propuesta:

```txt
web/src/
  main.ts
  app/
    app.config.ts
    app.routes.ts
    shell/
      app-shell.component.ts
      app-shell.component.html
      app-shell.component.css
    features/
      album/
      collection/
      countries/
      packs/
      session/
      stadiums/
      challenges/
    core/
      firebase/
      state/
      data/
      models/
      utils/
    shared/
      ui/
```

## Mapeo de archivos actuales

| Actual | Angular destino | Notas |
| --- | --- | --- |
| `public/index.html` | `web/src/app/shell` + routes | Dividir hero, nav, stats y secciones. |
| `public/styles.css` | `web/src/styles.css` + estilos de componentes | Primero portar global, luego reducir por componente. |
| `public/script.js` | servicios + componentes + stores | Separar datos, estado, Firebase, render y eventos. |
| `public/firebase-client.js` | `core/firebase/*.service.ts` | Mantener API equivalente para no cambiar reglas de negocio de golpe. |
| `public/content/worldcup-facts.js` | `core/data/worldcup-facts.ts` | Tipar `Team`, `Sticker`, `Player`, `Stadium`. |
| `public/content/private-content.example.json` | `web/public/content/` o `web/src/assets/content/` | Mantener privado fuera de git/deploy si aplica. |
| `functions/index.js` | sin cambio inicial | Functions no dependen de Angular. |
| `firestore.rules` | sin cambio inicial | Verificar con emuladores despues. |

## Fases de migracion

### Fase 0 - Preparacion y referencias

Estado: completada para arranque

Tareas:

- [x] Crear este plan persistido.
- [x] Registrar referencias oficiales de Angular.
- [x] Detectar version local de Node.
- [x] Instalar Node compatible `24.15.0` con nvm4w.
- [ ] Integrar archivo adjunto del usuario cuando este disponible.
- [x] Decidir estrategia para cambios actuales: crear `web/` en paralelo y no tocar `public/` durante el scaffold.

Salida esperada:

- Plan aprobado.
- Worktree entendido.
- Requisitos de entorno claros.

Verificacion:

```bash
git status --short
node --version
npm --version
```

### Fase 1 - Crear workspace Angular 22 en paralelo

Estado: completada

Tareas:

- [x] Instalar/seleccionar Node compatible con Angular 22.
- [x] Crear `web/` con Angular CLI 22.
- [x] Configurar `web/package.json` con scripts claros.
- [x] Activar routing y standalone components.
- [x] Confirmar build limpio.

Comando base propuesto:

```bash
npx -p @angular/cli@22 ng new web --standalone --routing --style=css --skip-git
cd web
npm run build
```

Si el CLI no acepta crear en `web/` desde raiz por conflictos, crear en carpeta temporal y mover.

Comandos ejecutados en esta maquina:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
npx -p @angular/cli@22 ng new web --standalone --routing --style=css --skip-git --package-manager=npm --defaults --ssr=false
cd web
npm install --package-lock-only
npm run build
npm run test:ci
```

Verificacion:

```bash
cd web
npm run build
npm run test:ci
```

Resultado 2026-06-17:

```txt
Angular CLI: 22.0.2
Angular packages: ^22.0.0
Node usado: v24.15.0
npm usado: 11.12.1
Build: pasa
Tests: 1 file, 2 tests, pasan
```

Nota: `npm install --package-lock-only` reporto 5 vulnerabilidades en dependencias del scaffold. No se aplico `npm audit fix --force` porque podria introducir cambios incompatibles; revisar en una fase de mantenimiento.

### Fase 2 - Migrar modelo de dominio y datos

Estado: completada

Tareas:

- [x] Crear tipos `Team`, `Player`, `Sticker`, `Stadium`, `InventoryCopies`, `UserProfile`.
- [x] Migrar `worldcup-facts.js` a TypeScript.
- [x] Mantener `fullSquads` para 26 jugadores por pais.
- [x] Mantener `squadHighlights` para los 5 cromos por pais.
- [x] Crear utilidades puras para rareza, conteos, repetidos, progreso y busqueda.
- [x] Agregar pruebas unitarias para utilidades de dominio.

Archivos creados:

```txt
web/src/app/core/models/album.models.ts
web/src/app/core/data/worldcup-facts.ts
web/src/app/core/utils/album-domain.ts
web/src/app/core/utils/album-domain.spec.ts
```

Verificacion:

```bash
cd web
npm run build
npm run test:ci
```

Resultado 2026-06-17:

```txt
Build: pasa
Tests: 2 files, 4 tests, pasan
```

### Fase 3 - App shell y navegacion

Estado: completada

Tareas:

- [x] Crear layout principal con header, nav y footer.
- [x] Crear rutas equivalentes: coleccion, paises, sedes, retos.
- [x] Portar hero sin cambiar el lenguaje visual de forma agresiva.
- [x] Asegurar responsive mobile/desktop base.
- [x] Mantener reglas de assets: sin logos, escudos, fotos ni arte protegido.

Archivos creados:

```txt
web/src/app/shell/app-shell.component.ts
web/src/app/shell/app-shell.component.html
web/src/app/shell/app-shell.component.css
web/src/app/features/collection/collection-page.component.*
web/src/app/features/countries/countries-page.component.*
web/src/app/features/stadiums/stadiums-page.component.*
web/src/app/features/challenges/challenges-page.component.*
web/src/app/app.routes.ts
```

Verificacion:

```bash
cd web
npm start
```

QA visual:

- [x] La primera pantalla carga.
- [x] La navegacion Angular no recarga la pagina completa.
- [x] La ruta `/coleccion` renderiza 240 cromos.
- [x] No se agregan logos, escudos, mascotas ni fotos oficiales.

Resultado 2026-06-17:

```txt
npm run build: pasa sin warnings
npm run test:ci: 3 files, 8 tests, pasan
Browser: http://127.0.0.1:4200/coleccion renderiza 240 cromos
```

### Fase 4 - Estado local con signals

Estado: completada

Tareas:

- [x] Crear `AlbumStore` con signals.
- [x] Migrar `localStorage` como fallback.
- [x] Modelar `copies`, `packsOpened`, `theme`, filtros y vista activa.
- [x] Usar `computed` para progreso, repetidos, coleccion filtrada y retos.
- [x] Mantener apertura local solo como fallback/desarrollo.

Archivos creados:

```txt
web/src/app/core/state/album-store.service.ts
web/src/app/core/state/album-store.service.spec.ts
```

Verificacion:

- [x] Abrir sobre local actualiza inventario.
- [x] Refresh mantiene progreso local.
- [x] Filtros y busqueda funcionan desde signals.
- [x] Retos se recalculan desde signals.

Resultado 2026-06-17:

```txt
Browser: abrir sobre local cambia 0 -> 5 cromos pegados.
Browser: refresh mantiene 5 cromos pegados y 1 sobre abierto.
Browser: /retos muestra 4 retos y marca "Primer sobre" como completado.
npm run build: pasa sin warnings
npm run test:ci: 3 files, 8 tests, pasan
```

### Fase 5 - Componentes de coleccion

Estado: completada

Tareas:

- [x] `StickerCardComponent`.
- [x] `CollectionFiltersComponent`.
- [x] `CollectionGridComponent`.
- [x] `TeamPagesComponent`.
- [x] `StickerDetailDialogComponent`.
- [x] `PackDialogComponent`.
- [x] `CollectionStatsComponent`.
- [x] `PackStripComponent` temporal para ultimo sobre.

Archivos creados:

```txt
web/src/app/features/collection/sticker-card/sticker-card.component.*
web/src/app/features/collection/collection-filters/collection-filters.component.*
web/src/app/features/collection/collection-grid/collection-grid.component.*
web/src/app/features/collection/team-pages/team-pages.component.*
web/src/app/features/collection/collection-stats/collection-stats.component.*
web/src/app/features/collection/pack-strip/pack-strip.component.*
web/src/app/features/collection/sticker-detail-dialog/sticker-detail-dialog.component.*
web/src/app/features/collection/pack-dialog/pack-dialog.component.*
```

Buenas practicas:

- Inputs con `input()`.
- Outputs con `output()`.
- `readonly` donde aplique.
- `protected` para miembros solo usados por template.
- Nombres de handlers por accion: `openPack()`, `showStickerDetail()`, `resetLocalAlbum()`.

Verificacion:

- [x] Los 240 cromos se renderizan.
- [x] Los nombres de jugadores se ven aunque el cromo falte.
- [x] La vista de paginas renderiza 48 grupos por pais y 240 cromos agrupados.
- [x] El detalle muestra codigo, pais, posicion, numero, rareza, copias y altura.

Resultado 2026-06-17:

```txt
npm run build: pasa sin warnings
npm run test:ci: 9 files, 14 tests, pasan
Browser: /coleccion muestra 240 cromos en vista Cromos
Browser: /coleccion muestra 48 paginas en vista Paginas
Browser: abrir sobre local muestra PackDialog con 5 cromos
Browser: seleccionar un cromo abre StickerDetailDialog con metadata y copias
```

### Fase 6 - Seccion Paises y plantillas completas

Estado: completada

Tareas:

- [x] Crear `CountriesPageComponent`.
- [x] Mostrar 48 paises.
- [x] Mostrar 26 jugadores por pais.
- [x] Mantener scroll interno para plantillas largas.
- [x] Mostrar confederacion y conteo de jugadores.

Verificacion:

- [x] Total visible o consultable: 1,248 jugadores.
- [x] Cada pais muestra 26 jugadores.
- [x] Mexico, USA, Argentina, Brazil, France, Spain y Germany tienen nombres reales de plantilla.
- [x] No se cargan fotos oficiales ni escudos.

Resultado 2026-06-17:

```txt
Browser: /paises renderiza 48 tarjetas.
Browser: /paises suma 1,248 filas de jugadores.
Browser: primera tarjeta muestra 26/26 jugadores.
```

### Fase 7 - Firebase en Angular

Estado: completada para flujo local/guest con emuladores

Decision:

- Se eligio Firebase modular SDK directo (`firebase` npm), no `@angular/fire`.
- Motivo: conservar el contrato ya implementado en `public/firebase-client.js`, evitar otra capa de abstraccion durante la migracion y mantener imports Firebase en chunks lazy.
- Se aumento el budget inicial de warning de 500 kB a 550 kB en `web/angular.json`; el build queda en ~509 kB raw / ~112 kB transfer y Firebase queda en lazy chunks.

Tareas:

- [x] Crear `FirebaseConfigService`.
- [x] Crear `AuthService` para Google y guest local/emulator.
- [x] Crear `UserProfileService`.
- [x] Crear `InventoryService`.
- [x] Crear `PackService`.
- [x] Crear `FirebaseSessionStore`.
- [x] Crear `SessionPanelComponent`.
- [x] Conservar fallback local cuando Firebase no este configurado o no haya sesion.
- [x] Conservar regla: abrir sobre online usa backend/control layer.
- [x] Verificar flujo guest local completo con Firebase Emulator Suite.

Archivos creados:

```txt
web/src/app/core/firebase/firebase-config.service.ts
web/src/app/core/firebase/firebase-app.service.ts
web/src/app/core/firebase/auth.service.ts
web/src/app/core/firebase/user-profile.service.ts
web/src/app/core/firebase/inventory.service.ts
web/src/app/core/firebase/pack.service.ts
web/src/app/core/firebase/firebase-session.store.ts
web/src/app/core/firebase/firebase-errors.ts
web/src/app/features/session/session-panel/session-panel.component.*
web/public/firebase-config.example.js
```

Verificacion con emuladores:

```bash
firebase emulators:start
cd web
npm start
```

Criterios:

- [x] Modo local carga sin Firebase.
- [ ] Login Google funciona cuando esta configurado en entorno real.
- [x] Guest solo se permite local/emulator.
- [x] `claimStarterPack` no se reclama dos veces.
- [x] Inventario online refresca UI.
- [x] Errores se muestran amigables en el panel de sesion.

Resultado parcial 2026-06-17:

```txt
npm install firebase
npm run build: pasa sin warnings
npm run test:ci: 10 files, 15 tests, pasan
npm audit --omit=dev: 0 vulnerabilidades
Browser sin web/public/firebase-config.js: modo local, Google deshabilitado, 240 cromos
Browser: Abrir sobre local desde SessionPanel muestra PackDialog con 5 cromos
```

Resultado con emuladores 2026-06-17:

```txt
JDK usado: C:\Users\Admin\.jdks\openjdk-26.0.1\bin\java.exe
Firebase CLI usado: npx -y firebase-tools@14.19.0
Emuladores: Auth 127.0.0.1:9099, Firestore 127.0.0.1:8080, UI 127.0.0.1:4000
Browser: /coleccion inicia en modo local y activa Invitado local con web/public/firebase-config.js.
Browser: login invitado cambia a Modo Firebase, crea perfil y listener de inventario.
Browser: Reclamar sobre inicial cambia Sobres 0 -> 1 y deshabilita el boton de reclamo.
Browser: Abrir sobre Firebase cambia Sobres 1 -> 0 y la coleccion pasa a 5 pegados / 235 faltantes.
Admin emulator read: users/{uid} queda con starterPackClaimed=true, packsAvailable=0, packsOpened=1.
Admin emulator read: users/{uid}/inventory contiene 5 documentos con copies=1.
Admin emulator read: packOpenings contiene stickerIds[5] y source='firestore-client'.
Rules REST: crear perfil seguro 200, primer starter claim 200, segundo starter claim 403, escritura directa a inventory 403.
npm run build: pasa.
npm run test:ci: 10 files, 16 tests, pasan.
```

Notas pendientes de esta fase:

- Validar login Google contra un proyecto real o emulador configurado para ese provider.
- Cuando haya Blaze/Functions, activar `USE_CLOUD_FUNCTIONS=true` y repetir apertura con callable `openPack`.

### Fase 8 - Estilos y accesibilidad

Estado: completada para el corte local

Tareas:

- [x] Migrar estilos globales sin copiar layout comercial protegido.
- [x] Encapsular estilos por componente donde ayude.
- [x] Revisar contraste, foco visible y navegacion con teclado inicial.
- [x] Usar Angular Aria o CDK solo donde aporte valor real.
- [x] Mantener dialogos accesibles en pack/detail.

Verificacion:

- Navegacion por teclado.
- Botones tienen texto o `aria-label`.
- Modales anuncian titulo y se pueden cerrar.
- No hay texto cortado en mobile.

Resultado parcial 2026-06-17:

```txt
Global: se agrego foco visible con :focus-visible y helper .sr-only.
StickerCard: role=button, tabindex=0, aria-label descriptivo y Space evita scroll.
PackDialog: role=dialog, aria-labelledby, aria-describedby, backdrop fuera del tab order y foco inicial en cerrar.
StickerDetailDialog: role=dialog, aria-labelledby, aria-describedby, backdrop fuera del tab order y foco inicial en cerrar.
Browser: primera tarjeta abre detalle con Enter; foco cae en "Cerrar detalle"; Escape cierra el dialogo.
npm run build: pasa.
npm run test:ci: 10 files, 17 tests, pasan.
```

Decision CDK A11y 2026-06-17:

```txt
Se agrego @angular/cdk para usar A11yModule y cdkTrapFocus solo en los dialogos.
Motivo: los dialogos ya tenian aria/foco inicial/Escape, pero faltaba atrapar el foco dentro del modal.
Browser: detalle de cromo abre con Enter, panel tiene cdkTrapFocus, CDK crea 2 focus anchors,
foco inicial cae en "Cerrar detalle" y Escape cierra.
npm audit --omit=dev: 0 vulnerabilidades.
```

QA responsive 2026-06-17:

```txt
Hosting Emulator /coleccion desktop 1280x720: 240 cromos, sin overflow horizontal, sin errores.
Hosting Emulator /coleccion mobile 390x844: 240 cromos, sin overflow horizontal, sin errores.
Hosting Emulator /paises desktop 1280x720: 48 paises, sin overflow horizontal, sin errores.
Hosting Emulator /paises mobile 390x844: 48 paises, sin overflow horizontal, sin errores.
Fix aplicado: el panel de sesion del hero ya no desborda en desktop; se ajusto la columna del hero y wrap del estado.
```

QA focusable 2026-06-17:

```txt
/coleccion expone focusables en orden DOM: marca, nav, nickname, abrir sobre local, acciones, busqueda, selects, tabs y cromos.
Los cromos tienen role=button, tabindex=0 y aria-label descriptivo.
Nota historica: la automatizacion del navegador integrado no movio foco con Tab real.
navegador integrado 2026-06-17: /coleccion en Hosting Emulator renderiza 240 cromos y 255 focusables; click por coordenadas
en el input de busqueda enfoca INPUT correctamente, pero los comandos Tab del driver no cambian document.activeElement.
Se agrego skip link "Saltar al contenido principal" antes del header y main#main-content con tabindex="-1".
npm run smoke:focusables: pasa; renderiza el build Angular en jsdom y valida:
- skip link global y main#main-content en todas las rutas revisadas.
- /coleccion: 240 cromos focusables con role=button/tabindex/aria-label, 2 inputs, 3 selects, 2 tabs.
- /coleccion: Enter sobre el primer cromo abre el dialogo de detalle con aria-labelledby.
- /paises: 48 tarjetas de pais, 48 totales de plantilla y 2 links de fuente.
- /sedes: 16 tarjetas de sede.
- /retos: 4 tarjetas de reto.
npm run smoke:keyboard-real: pasa con Playwright/Chromium real contra Hosting Emulator; valida:
- Tab inicial enfoca "Saltar al contenido principal".
- Enter en skip link enfoca main#main-content.
- Tab alcanza busqueda, tab "Cromos" y un cromo.
- Enter abre dialogo de detalle.
- El foco permanece dentro del dialogo con Tab y Shift+Tab.
- Escape cierra el dialogo.
```

### Fase 9 - Testing y calidad

Estado: completada para el corte local

Tareas:

- [x] Unit tests de utilidades de dominio.
- [x] Tests de servicios de estado.
- [x] Tests de componentes criticos iniciales.
- [x] Gate automatizado de practicas Angular 22.
- [x] Smoke automatizado de focusables y detalle con teclado sobre build Angular.
- [x] Smoke script basico de Hosting Angular.
- [x] Smoke E2E de teclado con navegador real Chromium.
- [x] Verificador local de migracion Angular.
- [x] E2E basico de modo local con navegador real.
- [x] Smoke test manual con Firebase emulators.
- [x] Formato formal con Prettier como gate de migracion.
- [ ] Lint formal con reglas semanticas adicionales, si se decide agregar ESLint despues.

Gates minimos antes de cutover:

```bash
cd web
npm run format:check
npm run check:angular-practices
npm run build
npm test -- --watch=false
npm run smoke:focusables
npm run smoke:hosting
npm run smoke:keyboard-real
```

Mas emuladores:

```bash
firebase emulators:start
```

Resultado parcial 2026-06-17:

```txt
npm run format:check: pasa; Prettier cubre src/**/*.{ts,html,css}, scripts/**/*.mjs y configs raiz del workspace.
npm run build: pasa sin warnings
npm run test:ci: 10 files, 17 tests, pasan
Browser/emulators: flujo guest Firebase verificado manualmente.
Browser/a11y: detalle de cromo abre con teclado, enfoca cierre y cierra con Escape.
npm run check:angular-practices: pasa; bloquea NgModule, BrowserModule/platformBrowserDynamic,
constructores en codigo Angular de app, @Input/@Output decorators, EventEmitter,
*ngIf/*ngFor/*ngSwitch, ngClass/ngStyle y componentes sin OnPush.
npm run smoke:focusables: pasa; valida focusables y Enter en cromo sobre build renderizado en jsdom.
npm run smoke:hosting: pasa contra http://127.0.0.1:5000.
npm run verify:migration: pasa; ejecuta format:check, check:angular-practices, build, test:ci, smoke:focusables, smoke:hosting y smoke:keyboard-real.
Smoke hosting: verifica repo guards, dist sin config/privados, rutas SPA y cleanup service-worker.js.
2026-06-17 15:52 America/Mexico_City: npm run verify:migration vuelve a pasar despues de mover
inicializacion/effects fuera de constructores y endurecer el gate.
2026-06-17 15:58 America/Mexico_City: npm run verify:migration vuelve a pasar con smoke:keyboard-real integrado.
El smoke usa @playwright/test y Chromium real contra http://127.0.0.1:5000 para validar skip link, Tab, Enter,
focus trap del dialogo y Escape.
```

### Fase 10 - Firebase Hosting cutover

Estado: parcial

Tareas:

- [x] Cambiar `firebase.json` hosting public al build Angular.
- [x] Verificar rewrites para SPA.
- [x] Garantizar que archivos privados no se publiquen desde el build de produccion.
- [x] Mantener rollback a `public/` documentado.
- [x] Agregar cleanup para service worker stale de builds anteriores.
- [x] Crear checklist persistido de release/deploy.
- [ ] Deploy a Hosting.

Verificacion:

```bash
cd web
npm run build
cd ..
firebase emulators:start --only hosting
firebase deploy --only hosting
```

Antes de ejecutar deploy publicado, seguir `docs/ANGULAR_22_RELEASE_CHECKLIST.md`.

Criterios:

- [x] URL local de Hosting sirve Angular.
- [ ] URL publicada sirve Angular.
- `public/firebase-config.js` no esta versionado.
- `private-content.json` y `private-assets/` no se despliegan.

Decision de cutover 2026-06-17:

```txt
firebase.json hosting.public -> web/dist/web/browser
web/angular.json production.assets excluye:
- firebase-config.js
- content/private-content.json
- private-assets/**

web/public/service-worker.js se publica a proposito como cleanup worker:
- borra caches del origen.
- toma control solo para refrescar ventanas abiertas.
- se desregistra solo.
- evita que un service worker viejo sirva bundles Angular anteriores durante QA/deploy.

firebase.json agrega headers para /service-worker.js:
- Cache-Control: no-cache, no-store, must-revalidate
- Service-Worker-Allowed: /
```

Rollback:

```txt
1. Cambiar temporalmente firebase.json hosting.public de "web/dist/web/browser" a "public".
2. Ejecutar firebase deploy --only hosting.
3. Mantener web/ intacto para corregir y repetir el cutover.
```

Nota: en desarrollo `ng serve` sigue pudiendo leer `web/public/firebase-config.js` local/ignorado. En build
de produccion se excluye para evitar publicar configuraciones locales o privadas accidentalmente.

Verificacion local 2026-06-17:

```txt
cd web && npm run build: pasa.
cd web && npm run test:ci: 10 files, 17 tests, pasan.
Dist: web/dist/web/browser/firebase-config.js ausente.
Dist: web/dist/web/browser/content/private-content.json ausente.
Dist: web/dist/web/browser/private-assets ausente.
Dist: web/dist/web/browser/service-worker.js presente como cleanup worker.
Hosting Emulator: sirve archivos desde web/dist/web/browser en http://127.0.0.1:5000.
HTTP: /coleccion y /paises devuelven index.html Angular 200.
HTTP: /service-worker.js devuelve JavaScript de cleanup, no el rewrite a index.html.
Browser: http://127.0.0.1:5000/paises renderiza 48 tarjetas y resumen 48 / 1,248 / 26 sin errores de consola.
npm run verify:migration: pasa despues de agregar el guard del cleanup worker.
```

## Criterios de aceptacion final

La migracion se considera completa solo cuando:

- [x] Existe workspace Angular 22 en `web/`.
- [x] Angular build pasa.
- [x] Tests minimos pasan.
- [x] Modo local equivalente funciona.
- [x] Firebase Auth/inventario/sobres funcionan con emuladores para flujo guest local.
- [x] Hosting local sirve Angular, no la app estatica legacy.
- [ ] Hosting publicado sirve Angular.
- [x] App conserva la experiencia visual base sin romper responsive en rutas principales verificadas.
- [x] La seccion Paises muestra 48 paises y 26 jugadores por pais.
- [x] La coleccion mantiene 240 cromos jugables o se documenta una decision distinta.
- [x] No se versionan ni publican assets privados o protegidos.
- [x] Hay rollback documentado.

## Seguimiento rapido

| Fase | Estado | Proximo paso |
| --- | --- | --- |
| 0 Preparacion | Completada para arranque | Integrar archivo adjunto si aparece. |
| 1 Workspace | Completada | Mantener build/test verdes. |
| 2 Dominio/datos | Completada | Mantener tests de utilidades verdes. |
| 3 Shell/routing | Completada | Mantener QA visual al mover componentes. |
| 4 Estado local | Completada | Mantener fallback mientras se prepara cutover. |
| 5 Coleccion | Completada | Mantener dialogos y origen local/Firebase separados. |
| 6 Paises | Completada | Mantener conteo 48/1,248 al cambiar datos. |
| 7 Firebase | Completada para guest/emuladores | Validar Google real y Cloud Functions cuando haya entorno. |
| 8 Accesibilidad/estilos | Completada para corte local | Mantener smoke de teclado real verde. |
| 9 Testing | Completada para corte local | Mantener verify:migration verde antes de publicar. |
| 10 Cutover Hosting | Parcial | Seguir checklist de release y deploy cuando el usuario confirme publicacion. |

## Como retomar con Codex

Prompt sugerido:

```txt
Lee docs/ANGULAR_22_MIGRATION_PLAN.md y continua desde la primera fase pendiente.
No rompas public/ hasta que el workspace Angular este verificado.
Usa Angular 22 y las referencias oficiales listadas en el plan.
Mantén Firebase, modo local y reglas de assets privados.
```
