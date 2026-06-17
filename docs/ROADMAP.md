# Roadmap de versiones

## Plan transversal - Migracion Angular 22

El plan detallado de migracion vive en:

```txt
docs/ANGULAR_22_MIGRATION_PLAN.md
```

Este plan debe ejecutarse en paralelo dentro de `web/` hasta que la app Angular cumpla los criterios de aceptacion y pueda reemplazar el Hosting actual sin romper el modo local ni Firebase.

## v0.1 — Prototipo visual local

Estado: en progreso en este PR.

Objetivo: tener una app estática funcional para validar UX visual.

Incluye:

- Álbum HTML/CSS/JS en `public/`.
- 48 equipos ficticios.
- 240 cromos generados.
- Sobres locales.
- Repetidas locales.
- Filtros, progreso, retos y vista por páginas.
- Firebase Hosting configurado.

Limitaciones:

- El progreso vive en `localStorage`.
- Los sobres se generan en el cliente.
- No hay login.
- No hay intercambio real entre usuarios.

## v0.2 — Preparación Firebase

Objetivo: preparar proyecto para nube sin cambiar toda la UI de golpe.

Tareas:

- Crear proyecto Firebase.
- Configurar Authentication.
- Configurar Firestore.
- Configurar Hosting.
- Probar Emulator Suite.
- Sembrar catálogo ficticio en Firestore.
- Crear wrapper JS para Firebase SDK.

## v0.3 — Login y perfil

Objetivo: que cada jugador tenga identidad propia.

Tareas:

- Login anónimo o email/password.
- Nickname y avatar ficticio.
- Crear documento `users/{uid}`.
- Reclamar primer sobre solo una vez.
- Migrar progreso de `localStorage` a Firestore.

## v0.4 — Economía de sobres

Objetivo: quitar apertura ilimitada.

Tareas:

- Mostrar sobres disponibles.
- Agregar monedas.
- Implementar `claimStarterPack`.
- Implementar `openPack` en Cloud Functions.
- Implementar `completeMission`.
- Implementar compra de sobre con monedas.
- Quitar botones de prueba como `Pegar 10 al azar` en modo producción.

## v0.5 — Misiones y retos

Objetivo: que el jugador gane sobres con dinámicas cortas.

Tareas:

- Misiones diarias.
- Trivia de 3 preguntas.
- Mini reto de memoria.
- Recompensa por primer intercambio del día.
- Racha semanal.
- Insignias.

## v0.6 — Salas privadas

Objetivo: jugar con familia y amigos.

Tareas:

- Crear sala por código.
- Unirse a sala.
- Ver miembros.
- Ver progreso de miembros.
- Definir privacidad alta por defecto.

## v0.7 — Intercambio de cromos

Objetivo: que las repetidas tengan valor social.

Tareas:

- Pantalla `Mis repetidas`.
- Pantalla `Mis faltantes`.
- Propuestas de intercambio.
- Aceptar/rechazar/cancelar.
- Validar inventario con transacciones.
- Notificaciones en tiempo real.
- Sugerencias automáticas de cambios.

## v0.8 — Metas grupales

Objetivo: colaboración familiar.

Tareas:

- Donar repetidas a meta de sala.
- Progreso grupal.
- Sobre familiar para todos.
- Retos de fin de semana.

## v1.0 — MVP público controlado

Objetivo: versión jugable con amigos.

Debe incluir:

- Login.
- Inventario en Firestore.
- Sobres ganados.
- Misiones.
- Salas privadas.
- Intercambios seguros.
- Reglas Firestore revisadas.
- Pruebas con emuladores.
- Sin marcas ni contenido protegido.
