# Estrategia de producto y dinámica social

## Objetivo

Convertir el prototipo actual de álbum digital en una experiencia social para jugar con familia y amigos: abrir sobres, completar colección, ganar recompensas, juntar repetidas e intercambiarlas en salas privadas.

## Problema detectado

La primera versión funciona como prototipo visual, pero la acción principal es demasiado fácil: abrir sobres ilimitados hasta llenar el álbum. Eso reduce la emoción de coleccionar y elimina la necesidad de negociar con otros jugadores.

## Cambio de dinámica

Antes:

> Abro sobres ilimitados, hago clic, pego cromos y completo el álbum.

Después:

> Inicio sesión, recibo un sobre gratis, juego misiones cortas para ganar monedas/sobres, acumulo repetidas y hago cambios con amigos.

## Principios de diseño

1. **Primer contacto generoso**: el primer sobre debe ser gratis y entregarse una sola vez por cuenta.
2. **Sobres ganados**: los sobres normales se consiguen con monedas, misiones o retos.
3. **Repetidas útiles**: las repetidas sirven para intercambiar, reciclar o donar a metas grupales.
4. **Intercambio fácil**: el sistema debe sugerir cambios justos automáticamente.
5. **Salas privadas primero**: empezar con familia y amigos mediante código de sala, no con mercado público global.
6. **Sin monetización agresiva**: evitar compra de sobres, apuestas o mecánicas de presión para menores.
7. **Contenido ficticio**: no usar marcas, logos, jugadores reales, selecciones reales o assets protegidos.

## Loop principal del juego

1. El usuario inicia sesión.
2. Reclama un sobre inicial.
3. Abre el sobre y pega cromos nuevos.
4. Revisa faltantes y repetidas.
5. Completa misiones cortas para ganar monedas.
6. Compra/gana nuevos sobres.
7. Propone cambios en una sala privada.
8. Completa páginas, equipos y retos.
9. El grupo desbloquea recompensas cooperativas.

## Economía inicial sugerida

| Elemento | Regla propuesta |
| --- | --- |
| Sobre inicial | 1 gratis por cuenta |
| Sobre normal | 5 cromos |
| Costo de sobre normal | 100 monedas |
| Misión corta | 20-30 monedas |
| Límite diario inicial | 3 sobres normales ganables |
| Repetida base reciclada | 5 monedas |
| Repetida brillante reciclada | 15 monedas |
| Repetida holográfica reciclada | 40 monedas |
| Intercambios diarios iniciales | 10 |

## Tipos de sobres

| Tipo | Cómo se gana | Contenido |
| --- | --- | --- |
| Inicial | Crear cuenta | 5 cromos normales/mixtos |
| Normal | 100 monedas | 5 cromos |
| Regional | Reto por región | Más probabilidad de cierta región |
| Brillante | Reto semanal | Más probabilidad de brillantes/holo |
| Intercambio | Primer cambio del día | 3 cromos con menor probabilidad de repetidos |
| Familiar | Meta grupal | Recompensa para todos los miembros de la sala |

## Misiones recomendadas

- Trivia rápida de 3 preguntas.
- Mini juego de penales.
- Memoria de cromos.
- Adivinar silueta.
- Completar una página de equipo.
- Hacer el primer intercambio del día.
- Donar repetidas a la meta familiar.
- Entrar 3 días en la semana.

## Intercambio social

La sección de intercambio debe tener:

- Mis repetidas.
- Mis faltantes.
- Amigos de la sala.
- Cambios sugeridos.
- Propuestas enviadas.
- Propuestas recibidas.
- Lista de cromos buscados.

Flujo esperado:

1. Manuel ve que Diego tiene un cromo que le falta.
2. El sistema detecta qué repetida de Manuel le falta a Diego.
3. Manuel propone un cambio 1x1 o 2x1.
4. Diego recibe la propuesta en tiempo real.
5. Diego acepta, rechaza o hace contraoferta.
6. Si acepta, Firebase ejecuta el cambio de forma atómica.

## MVP recomendado

La primera versión online debe incluir:

- Login con Firebase Authentication.
- Perfil con nickname y avatar ficticio.
- Sobre inicial único.
- Inventario guardado en Cloud Firestore.
- Monedas y misiones básicas.
- Sobres disponibles limitados.
- Salas privadas por código.
- Propuestas de intercambio.
- Aceptación de intercambio con Cloud Functions.

## Seguridad y experiencia para niños

- Usar nickname, no nombre real.
- No pedir ubicación.
- Evitar chat libre al inicio.
- Usar mensajes prediseñados.
- Crear salas privadas por código.
- No vender sobres.
- No usar marcas o contenido protegido.
- Mantener privacidad alta por defecto.
