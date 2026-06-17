# Arquitectura Firebase propuesta

## Servicios

| Servicio | Uso en el álbum |
| --- | --- |
| Firebase Authentication | Cuentas, sesión, usuarios anónimos convertibles a cuenta permanente |
| Cloud Firestore | Usuarios, inventario, misiones, sobres, salas privadas, propuestas de cambio |
| Cloud Functions | Abrir sobres, otorgar recompensas, aceptar cambios y validar economía |
| Firebase Hosting | Publicar la app web estática desde `public/` |
| Firebase Emulator Suite | Desarrollo local sin tocar datos reales |

## Regla importante

El cliente nunca debe decidir resultados importantes.

No debe hacer directamente:

- Generar cromos de un sobre.
- Sumar monedas.
- Otorgar sobres.
- Aceptar cambios.
- Modificar inventarios.

Todo eso debe pasar por Cloud Functions para evitar trampas desde el navegador.

## Modelo de datos inicial

```txt
users/{userId}
  nickname
  avatarId
  coins
  packsAvailable
  packsOpened
  starterPackClaimed
  createdAt
  updatedAt

users/{userId}/inventory/{stickerId}
  stickerId
  copies
  updatedAt

users/{userId}/missions/{missionId}
  progress
  claimed
  reward
  claimedAt

rooms/{roomId}
  name
  code
  ownerId
  memberIds[]
  createdAt
  updatedAt

rooms/{roomId}/members/{userId}
  nickname
  avatarId
  joinedAt

trades/{tradeId}
  fromUserId
  toUserId
  roomId
  offered[]
  requested[]
  status: pending | accepted | rejected | cancelled
  createdAt
  updatedAt
  acceptedAt

packOpenings/{openingId}
  userId
  packType
  stickerIds[]
  createdAt

catalog/stickers
  items[]
```

## Cloud Functions necesarias

| Función | Responsabilidad |
| --- | --- |
| `claimStarterPack` | Dar 1 sobre inicial solo una vez por usuario |
| `openPack` | Consumir un sobre disponible y sumar cromos al inventario |
| `completeMission` | Validar/cobrar misión y sumar monedas o sobres |
| `buyPack` | Convertir monedas en sobres |
| `createRoom` | Crear sala privada familiar/de amigos |
| `joinRoom` | Entrar con código de sala |
| `createTrade` | Crear propuesta de intercambio |
| `acceptTrade` | Validar copias y mover cromos de forma atómica |
| `rejectTrade` | Rechazar propuesta |
| `cancelTrade` | Cancelar propuesta propia |
| `recycleDuplicates` | Convertir repetidas en monedas |

## Intercambios atómicos

`acceptTrade` debe usar transacción:

1. Leer propuesta.
2. Confirmar que sigue pendiente.
3. Confirmar que el usuario que acepta es el destinatario.
4. Leer inventario de ambos jugadores.
5. Confirmar que ambos tienen suficientes copias disponibles.
6. Restar cromos al usuario A.
7. Sumar cromos al usuario B.
8. Restar cromos al usuario B.
9. Sumar cromos al usuario A.
10. Marcar propuesta como aceptada.

Si cualquiera de esos pasos falla, no debe aplicarse nada.

## Seguridad Firestore

Las reglas deben permitir lectura limitada y bloquear escritura directa en colecciones sensibles.

- `users/{uid}`: cada usuario puede editar solo datos de perfil no críticos.
- `inventory`: solo Cloud Functions modifica.
- `missions`: solo Cloud Functions modifica.
- `trades`: el cliente puede crear propuestas, pero aceptar/cancelar debe pasar por Functions.
- `catalog`: lectura pública, escritura bloqueada.

## Desarrollo local

Usar Firebase Emulator Suite para probar:

```bash
firebase emulators:start
```

Puertos propuestos:

- Auth: `9099`
- Firestore: `8080`
- Functions: `5001`
- Hosting: `5000`
- Emulator UI: `4000`

## Migración desde prototipo local

| Prototipo actual | Versión Firebase |
| --- | --- |
| `localStorage` | Firestore por usuario |
| `openPack()` en cliente | `openPack` Cloud Function |
| Repetidas locales | Subcolección `inventory` |
| Retos locales | `users/{uid}/missions` |
| Sin login | Firebase Authentication |
| Sin intercambio real | `trades` + listeners realtime |

## Eventos en tiempo real

Para propuestas e inventario se pueden usar listeners de Firestore:

- Escuchar `trades` donde `toUserId == uid` y `status == pending`.
- Escuchar `trades` donde `fromUserId == uid` para ver respuestas.
- Escuchar `users/{uid}/inventory` para actualizar progreso.
- Escuchar `rooms/{roomId}/members` para ver amigos de sala.
