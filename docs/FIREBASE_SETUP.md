# Setup Firebase

## 1. Crear proyecto Firebase

Crear un proyecto nuevo en Firebase Console y activar:

- Authentication.
- Cloud Firestore.
- Cloud Functions.
- Firebase Hosting.

## 2. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 3. Conectar el repo al proyecto

Copiar el archivo de ejemplo:

```bash
cp .firebaserc.example .firebaserc
```

Editar `.firebaserc` y reemplazar `TU_PROJECT_ID_DE_FIREBASE`.

## 4. Instalar dependencias de Functions

```bash
cd functions
npm install
cd ..
```

## 5. Correr local con emuladores

```bash
firebase emulators:start
```

Abrir:

```txt
http://localhost:5000
```

Emulator UI:

```txt
http://localhost:4000
```

## 6. Deploy Hosting

```bash
firebase deploy --only hosting
```

## 7. Deploy completo cuando Functions esté listo

```bash
firebase deploy
```

## Pendientes antes de producción

- Definir método de login inicial: anónimo, email/password o Google.
- Sembrar catálogo de cromos en `catalog/stickers`.
- Implementar validación completa en `acceptTrade`.
- Revisar reglas de Firestore con emuladores.
- Agregar App Check antes de publicación abierta.
- Ocultar botones de prueba de la versión local.
