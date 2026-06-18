# Implementation report

## Corrección aplicada

- La app usa datos reales de texto del Mundial 2026.
- Se reemplazó el generador anterior por grupos, calendario, sedes, plantillas y llaves reales.
- Los partidos futuros muestran estado programado.
- Los marcadores finalizados incluyen eventos de gol cuando están verificados.
- Se añadió ronda de 32 y partido por tercer lugar para completar 104 partidos.
- Se sustituyó el smoke de contenido por `smoke:real-worldcup-content`.

## UI

- La dirección visual vigente es un tablero deportivo moderno, con alto contraste y jerarquía de
  producto.
- La UI pública sin sesión permanece en solo lectura con CTA de login.
- Las herramientas de desarrollo quedan ocultas detrás de configuración QA.

## Pendiente de verificación final

- Ejecutar `npm run verify:migration`.
- Revisar capturas en `/inicio`, `/coleccion`, `/torneo/grupos`, `/torneo/partidos` y
  `/torneo/llaves`.
- Validar que no existan textos heredados en vistas públicas.
