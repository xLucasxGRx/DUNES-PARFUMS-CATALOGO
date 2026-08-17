# Reporte de Auditoría SEO Inicial — FASE M29 (ANTES)

Fecha de auditoría: 2026-08-17  
Dominio oficial objetivo: https://dunesparfums.com/

---

## 1. Resumen de Hallazgos y Diagnóstico

### A. Dominio Antiguo en Recursos Públicos (`xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO`)
- **`sitemap.xml`**: Todas las etiquetas `<loc>` contenían el dominio antiguo de GitHub Pages.
- **`robots.txt`**: La directiva `Sitemap:` apuntaba a `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/sitemap.xml`.
- **`index.html`**:
  - `canonical` apuntaba a `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/`.
  - JSON-LD `Store` y `WebSite` utilizaban URLs del dominio antiguo en `url`, `image` y `logo`.
- **`catalogo.html`**: `canonical` apuntaba a `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/catalogo.html`.
- **`ayuda.html`**: `canonical` apuntaba a `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/ayuda.html`.
- **`js/interfaz.js`**: La función `actualizarSeoProducto()` generaba el canonical dinámico y las URLs de imágenes en `producto.html?id=...` utilizando el dominio antiguo.

---

### B. Indexabilidad y Metadatos Meta Robots
- **Páginas Indexables**:
  - `index.html` (`index, follow`) — Canonical a actualizar a `https://dunesparfums.com/`.
  - `catalogo.html` (`index, follow`) — Canonical a actualizar a `https://dunesparfums.com/catalogo.html`.
  - `producto.html` (`index, follow`) — Canonical dinámico a actualizar a `https://dunesparfums.com/producto.html?id=...`.
  - `ayuda.html` (`index, follow`) — Canonical a actualizar a `https://dunesparfums.com/ayuda.html`.
- **Páginas Utilitarias (NoIndex)**:
  - `404.html` (`noindex, follow`) — Correcto. Omitido de `sitemap.xml`.
  - `favoritos.html` (`noindex, follow`) — Correcto. Omitido de `sitemap.xml`.
  - `carrito.html` (`noindex, follow`) — Correcto. Omitido de `sitemap.xml`.
  - `comparador.html` — Falta `<meta name="robots" content="noindex, follow">`. Se agregará y omitirá de `sitemap.xml`.

---

### C. Datos Estructurados JSON-LD
- **`LocalBusiness` (`index.html`)**:
  - Contenía `"priceRange": "$$"` (dato no verificado).
  - Faltaba objeto `geo` con coordenadas exactas (`-6.4626252`, `-76.4491609`).
  - Utilizaba URLs de imagen y sitio antiguas.
- **`Product` (`js/interfaz.js` para `producto.html`)**:
  - En ofertas activas (`oferta === true`), si existía `precio_oferta`, no siempre se asignaba como precio actual de venta en la estructura `Offer`.
  - Las URLs absolutas del esquema `Product` utilizaban el dominio de GitHub Pages.

---

### D. Open Graph y Twitter Cards
- Las etiquetas de metadatos sociales (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:site_name`, `og:locale`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) no estaban estandarizadas en todas las plantillas HTML públicas.

---

## 2. Plan de Acción Técnico para la Fase M29

1. **Migración total de URLs públicas a `https://dunesparfums.com`** en canonicals, `sitemap.xml`, `robots.txt`, JSON-LD y generadores dinámicos.
2. **Normalización de `LocalBusiness`** con datos reales exactos (Nombre, Dirección, Coordenadas, Teléfono, País, Moneda) omitiendo campos inventados (`postalCode`, `email`, `openingHours`, `reviews`).
3. **Estandarización de `Product` JSON-LD** reflejando el precio real de oferta (`precio_oferta`), variantes de decant y estado de disponibilidad (`InStock` / `OutOfStock`).
4. **Configuración Meta Robots y Sitemap**: Mantener indexables solo las 4 páginas principales (`index.html`, `catalogo.html`, `producto.html`, `ayuda.html`).
5. **Creación de suite de pruebas automatizadas** en `tests/seo-m29.test.js`.
