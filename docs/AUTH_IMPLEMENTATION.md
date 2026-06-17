# Implementación de autenticación

## Decisión inicial

Para jugar con familia y amigos, el MVP debe iniciar con **login anónimo** y nickname.

Ventajas:

- Baja fricción para niños y amigos.
- No obliga a capturar correo al primer uso.
- Permite guardar progreso por usuario.
- Más adelante se puede convertir la cuenta anónima a email/password o Google.

## Archivos agregados

```txt
public/firebase-config.example.js
public/firebase-client.js
```

`firebase-config.example.js` sirve como plantilla local.

`firebase-client.js` centraliza:

- Inicialización de Firebase.
- Conexión a emuladores.
- Login anónimo.
- Creación/actualización de perfil.
- Listeners de perfil e inventario.
- Llamadas a Cloud Functions.

## Flujo de UX recomendado

1. Mostrar modal inicial: “Elige tu nickname”.
2. Botón: “Entrar como invitado”.
3. Llamar `signInGuest(nickname)`.
4. Crear documento `users/{uid}`.
5. Mostrar estado de sesión en el header.
6. Mostrar botón “Reclamar sobre inicial”.
7. Llamar `claimStarterPack()`.
8. Mostrar sobres disponibles.
9. Abrir sobres con `openPack()` desde Cloud Functions.

## Cambios pendientes en UI

- Agregar panel de sesión en `index.html`.
- Convertir `script.js` para consumir estado desde Firebase cuando exista sesión.
- Mantener modo local solo para desarrollo.
- Remover botones de prueba en modo online.

## Estados de sesión

| Estado | UI |
| --- | --- |
| Sin Firebase configurado | Modo local de prueba |
| Firebase configurado, sin sesión | Modal de nickname |
| Sesión anónima activa | Álbum online |
| Perfil creado | Mostrar nickname y progreso |

## Reglas importantes

- El cliente puede mostrar datos, pero no debe modificar inventario directamente.
- `openPack` debe ser Cloud Function.
- `claimStarterPack` debe validar que no haya sido cobrado antes.
- Las monedas y recompensas deben vivir en backend.
- El inventario debe escucharse en tiempo real desde Firestore.
