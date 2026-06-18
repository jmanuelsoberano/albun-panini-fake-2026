# Goal plan: modernización UX/UI y Mundial 2026 real

## Objetivo maestro

Convertir la app Angular en una experiencia moderna, atractiva y usable para coleccionar cromos y
seguir el Mundial 2026 con datos reales: selecciones, jugadores, grupos, sedes, calendario,
marcadores, goleadores y llaves.

## Criterios de producto

- La UI pública no debe mostrar textos técnicos de Firebase, modo local o Angular.
- Sin sesión: solo lectura con CTA claro para iniciar sesión.
- Con sesión: abrir sobres, reclamar sobre inicial, ver inventario, retos y progreso guardado.
- Datos deportivos: reales y en español.
- Si falta verificación de marcador o goleador, mostrar estado pendiente.
- No usar logos, escudos, mascotas, fotografías ni arte protegido.

## Alcance funcional

1. Autenticación limpia con Google y nickname.
2. Perfil en Firestore y estado de inventario desde backend.
3. Sobre inicial reclamable una vez por usuario.
4. Apertura de sobres desde Cloud Functions.
5. Colección de 240 cromos destacados.
6. Vista de 48 selecciones con plantillas de 26 jugadores.
7. Grupos A-L del Mundial 2026.
8. Calendario de 104 partidos: 72 de grupos y 32 de eliminación.
9. Marcadores y goleadores solo cuando estén verificados.
10. Ronda de 32, octavos, cuartos, semifinales, tercer lugar y final.

## Gate de verificación

- `npm run format:check`
- `npm run check:angular-practices`
- `npm run build`
- `npm run test:ci`
- `npm run smoke:real-worldcup-content`
- `npm run smoke:focusables`
- `npm run smoke:hosting`
- `npm run smoke:auth-gate`
- `npm run smoke:economy`
- `npm run smoke:keyboard-real`
- `npm run smoke:responsive`
- `npm run smoke:room`
- `npm run smoke:tournament`

## Objetivo para Codex

Ejecutar este plan de punta a punta hasta que la app muestre una experiencia visual renovada,
datos reales del Mundial 2026, login limpio, colección funcional, torneo navegable y verificación
automatizada completa sin regresiones de contenido deportivo no verificado.
