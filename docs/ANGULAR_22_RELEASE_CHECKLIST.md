# Checklist de release Angular 22

Estado: borrador operativo para usar antes de publicar Hosting.

Este checklist complementa `docs/ANGULAR_22_MIGRATION_PLAN.md`. No reemplaza el plan: sirve para ejecutar el corte final con evidencia y rollback claro.

## Reglas antes de publicar

- No publicar sin confirmacion explicita del usuario.
- No publicar `public/firebase-config.js`.
- No publicar `web/public/firebase-config.js`.
- No publicar `public/content/private-content.json`.
- No publicar `public/private-assets/`.
- No publicar logos, escudos, mascotas, fotografias oficiales, marcas, tipografias comerciales ni arte protegido.
- Mantener disponible rollback a `public/`.

## Estado esperado del cutover

```txt
firebase.json hosting.public = web/dist/web/browser
```

El build publicado debe contener Angular, no la app estatica legacy.

## Preparacion local

Desde la raiz del repo:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
cd web
npm run verify:migration
npm audit --omit=dev
cd ..
```

`npm run verify:migration` debe pasar completo. Actualmente ejecuta:

```txt
format:check
check:angular-practices
build
test:ci
smoke:focusables
smoke:hosting
smoke:keyboard-real
```

El gate `check:angular-practices` bloquea NgModule, bootstrap legacy, decorators
`@Input`/`@Output`, `EventEmitter`, directivas estructurales legacy, `ngClass`/`ngStyle`,
constructores en codigo Angular de app y componentes sin `OnPush`.

## Verificacion de teclado real

La verificacion automatizada con navegador real ya forma parte de `npm run verify:migration`:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
cd web
npm run smoke:keyboard-real
cd ..
```

Ese smoke usa Playwright/Chromium contra `http://127.0.0.1:5000/coleccion?qa=keyboard-real` y valida:

- Tab inicial enfoca `Saltar al contenido principal`.
- Enter en el skip link enfoca `main#main-content`.
- Tab llega a busqueda, tab `Cromos` y un cromo.
- Enter abre el dialogo de detalle.
- Tab y Shift+Tab se mantienen dentro del dialogo.
- Escape cierra el dialogo.

Pasada manual opcional en navegador visible, util antes de un release publico si se quiere revisar sensacion visual:

1. Abrir `http://127.0.0.1:5000/coleccion?qa=manual-tab`.
2. Hacer hard refresh si se ve un bundle viejo.
3. Presionar `Tab` desde el inicio de la pagina.
4. Confirmar que aparece `Saltar al contenido principal`.
5. Presionar `Enter` sobre el skip link y confirmar que el foco va al contenido principal.
6. Seguir con `Tab` por marca, navegacion, nickname, boton de sobre local, busqueda, selects y tabs.
7. Llegar a un cromo y presionar `Enter`.
8. Confirmar que se abre el dialogo de detalle.
9. Confirmar que el foco queda dentro del dialogo.
10. Presionar `Escape` y confirmar que el dialogo cierra.
11. Repetir revision rapida en mobile viewport si el navegador lo permite.

Evidencia a registrar en `docs/ANGULAR_22_MIGRATION_PLAN.md`:

```txt
Fecha:
Ruta:
Resultado:
Notas:
```

## Smoke local de Hosting

Si Hosting Emulator no esta activo:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
npx -y firebase-tools@14.19.0 emulators:start --only hosting --project albun-panini-fake-2026
```

Revisar:

```txt
http://127.0.0.1:5000/coleccion
http://127.0.0.1:5000/paises
http://127.0.0.1:5000/sedes
http://127.0.0.1:5000/retos
http://127.0.0.1:5000/service-worker.js
```

`/service-worker.js` debe servir JavaScript de cleanup, no `index.html`.

## Deploy

El deploy normal debe ocurrir automaticamente con GitHub Actions cuando se hace push/merge a `main`.
El workflow vive en:

```txt
.github/workflows/firebase-hosting-merge.yml
```

Requiere el secret de Actions:

```txt
FIREBASE_SERVICE_ACCOUNT_ALBUN_PANINI_FAKE_2026
```

Antes de mergear a `main`, el PR preview workflow corre desde:

```txt
.github/workflows/firebase-hosting-pull-request.yml
```

Deploy manual de fallback, solo despues de confirmacion explicita:

```powershell
$env:PATH = 'C:\Users\Admin\AppData\Local\nvm\v24.15.0;' + $env:PATH
cd web
npm run verify:migration
cd ..
npx -y firebase-tools@14.19.0 deploy --only hosting --project albun-panini-fake-2026
```

## Verificacion posterior al deploy

En la URL publicada:

- `/coleccion` carga Angular.
- `/paises` muestra 48 paises y 1,248 jugadores.
- `/sedes` muestra 16 sedes.
- `/retos` muestra 4 retos.
- `/firebase-config.js` no se sirve como JavaScript de produccion.
- `/service-worker.js` se sirve como cleanup worker.
- No hay errores de consola bloqueantes.
- Modo local sigue funcionando.

## Rollback

Si la URL publicada falla:

1. Cambiar temporalmente `firebase.json`:

```json
{
  "hosting": {
    "public": "public"
  }
}
```

2. Mantener rewrites/headers solo si aplican al rollback.
3. Ejecutar:

```powershell
npx -y firebase-tools@14.19.0 deploy --only hosting --project albun-panini-fake-2026
```

4. Restaurar el cambio Angular en una rama de fix y repetir el checklist.

## Criterios para cerrar Fase 10

- Deploy publicado completado.
- URL publicada sirve Angular.
- `npm run smoke:keyboard-real` pasa antes de deploy.
- `npm run verify:migration` pasa despues del deploy.
- Rollback queda documentado y no ejecutado salvo incidente.
