# Backlog inicial

## Prioridad alta

- [ ] Seguir `docs/ANGULAR_22_MIGRATION_PLAN.md` para migrar la app estatica a Angular 22 en `web/`.
- [x] Instalar o seleccionar Node compatible con Angular 22 antes de crear el workspace.
- [ ] Configurar proyecto Firebase real.
- [ ] Activar Firebase Authentication.
- [ ] Activar Cloud Firestore.
- [ ] Activar Firebase Hosting.
- [x] Correr Firebase Emulator Suite.
- [ ] Sembrar catálogo ficticio en Firestore.
- [x] Crear perfil de usuario con nickname y avatar.
- [x] Implementar sobre inicial gratis una sola vez.
- [ ] Mover apertura de sobres del cliente a Cloud Functions.
- [x] Quitar apertura ilimitada en modo online.

## Prioridad media

- [ ] Crear sistema de monedas.
- [ ] Crear misiones diarias.
- [ ] Implementar compra de sobres con monedas.
- [ ] Crear salas privadas por código.
- [ ] Mostrar miembros de sala.
- [ ] Crear propuesta de intercambio.
- [ ] Aceptar intercambio con transacción.
- [ ] Rechazar/cancelar intercambio.
- [ ] Mostrar propuestas en tiempo real.

## Prioridad baja

- [ ] Meta grupal de donación de repetidas.
- [ ] Sobres regionales.
- [ ] Sobres brillantes semanales.
- [ ] Insignias.
- [ ] Ranking amistoso.
- [ ] Mini juego de trivia.
- [ ] Mini juego de memoria.
- [ ] Mini juego de penales.

## Criterios de MVP

El MVP se considera listo cuando:

- Un usuario puede iniciar sesión.
- Puede recibir un único sobre inicial.
- Puede ganar al menos un sobre con una misión.
- Puede abrir sobres desde backend.
- Su inventario se guarda en Firestore.
- Puede entrar a una sala privada.
- Puede proponer un cambio.
- Otro usuario puede aceptar el cambio.
- El intercambio actualiza ambos inventarios correctamente.
