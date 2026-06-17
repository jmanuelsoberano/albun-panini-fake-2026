# Contenido privado local

Este proyecto mantiene el repositorio y el deploy sin logos, escudos, mascotas, fotos oficiales, marcas ni arte protegido.

Los nombres de equipos, sedes y jugadores pueden usarse como datos factuales de texto. Las imagenes, escudos, uniformes, marcas y artes que no tengan permisos claros deben quedarse fuera del repositorio.

Si quieres probar contenido propio solo en tu maquina:

1. Copia `public/content/private-content.example.json` como `public/content/private-content.json`.
2. Coloca imagenes en `public/private-assets/players/`.
3. Usa rutas relativas como `private-assets/players/fg-001.webp` dentro del JSON.

Estos paths estan ignorados por git y por Firebase Hosting:

```txt
public/content/private-content.json
public/private-assets/
```

Formato recomendado para retratos:

```txt
Formato: WebP o JPG
Ratio: 4:5
Recomendado: 1200x1500 px
Minimo: 800x1000 px
Peso ideal: menos de 350 KB por imagen
Nombre: fg-001.webp, fg-002.webp, etc.
```

Para publicar, usa solo assets propios, ficticios/no oficiales o con derechos claros.
