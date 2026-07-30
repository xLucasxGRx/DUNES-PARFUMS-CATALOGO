# Guía de SEO, Metadatos y Sitemap - Dunes Parfums

Este documento detalla la configuración técnica de SEO, metadatos, favicons y mapas de sitio para la indexación adecuada en Google y motores de búsqueda.

---

## 1. URL Pública Oficial Actual
Durante la fase actual (GitHub Pages), la URL base del proyecto es:
```
https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/
```

> **IMPORTANTE**: No utilizar `https://dunesparfums.com/` como canonical hasta que la conexión de dominio personalizado con HTTPS en GitHub Pages esté 100% activa en la **FASE M23**.

---

## 2. Comandos de Desarrollo SEO

En la raíz del proyecto existen los siguientes comandos:

- **Generar Mapa de Sitio (Sitemap XML)**:
  ```bash
  npm run seo:generar
  ```
  *(Crea/actualiza el archivo `sitemap.xml` en la raíz incluyendo las páginas estáticas y todos los productos visibles de `data/productos.json`).*

- **Verificar Metadatos HTML**:
  ```bash
  npm run seo:verificar
  ```
  *(Audita que los archivos HTML tengan `lang="es-PE"`, títulos descriptivos y las directivas `noindex` en las páginas no indexables).*

---

## 3. Páginas Indexables vs Noindex

### Páginas Indexables (`meta name="robots" content="index, follow"`)
- `index.html` (Portada)
- `catalogo.html` (Catálogo)
- `ayuda.html` (Preguntas frecuentes y entregas)
- `producto.html?id=ID_REAL` (Ficha de producto existente y visible)

### Páginas No Indexables (`meta name="robots" content="noindex, follow"`)
- `carrito.html` (Carrito de compras / Proceso de checkout)
- `favoritos.html` (Lista de favoritos en cliente)
- `404.html` (Página de error)
- `producto.html` (Sin ID o cuando el producto no fue encontrado)

---

## 4. Estructura de Favicons
Se integran 4 formatos para compatibilidad universal en navegadores móviles, escritorio e iOS:
- `favicon.ico`
- `favicon-32x32.png`
- `favicon-48x48.png`
- `apple-touch-icon.png` (180x180)

---

## 5. Instrucciones para la FASE M23 (Conexión de Dominio `dunesparfums.com`)

Cuando el dominio personalizado `dunesparfums.com` esté conectado activamente con HTTPS:
1. Cambiar la variable `SITE_URL` en `tools/generar-seo.js` a:
   `const SITE_URL = "https://dunesparfums.com";`
2. Actualizar las etiquetas `<link rel="canonical" ...>` en los archivos HTML (`index.html`, `catalogo.html`, `ayuda.html`).
3. Actualizar la variable `canonicalUrl` en `js/interfaz.js` (`actualizarSeoProducto`).
4. Re-ejecutar `npm run seo:generar`.
