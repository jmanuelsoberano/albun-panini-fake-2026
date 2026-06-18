# Álbum Mundial 2026

Aplicación web de colección digital del Mundial 2026 con datos reales de selecciones, grupos,
sedes, calendario, marcadores y plantillas.

## Alcance

- Colección digital de 240 cromos destacados: 48 selecciones, 5 cromos por selección.
- Plantillas reales de 26 jugadores por selección en la vista de equipos.
- Grupos A-L, 72 partidos de fase de grupos y llave de eliminación de 32 equipos.
- Estado sin sesión en solo lectura con CTA de inicio de sesión.
- Sobres, inventario, monedas y misiones conectados a Firebase/Cloud Functions cuando la sesión está activa.

## Reglas de contenido

- Usar datos factuales del Mundial 2026.
- Mostrar nombres reales de selecciones, jugadores, sedes y marcadores verificados.
- No inventar resultados, sedes, equipos ni jugadores.
- No incluir logos, escudos, mascotas, fotografías, tipografías ni arte protegido.
- Si un resultado o goleador no está verificado, debe mostrarse como pendiente.

## Desarrollo

```bash
cd web
npm install
npm start
```

Verificación completa:

```bash
cd web
npm run verify:migration
```
