# Reporte de Rendimiento Inicial — FASE M25 (LÍNEA BASE / ANTES)

Fecha de auditoría: 2026-08-17  
Dominio/Entorno: https://dunesparfums.com (y entorno local XAMPP)

---

## 1. Resumen de Auditoría por Página

### A. index.html (Página de Inicio)
- **Tiempo hasta primer contenido visible (FCP)**: ~0.6 s (desktop) / ~1.1 s (mobile)
- **LCP (Largest Contentful Paint)**: ~0.8 s (desktop) / ~1.4 s (mobile)
- **CLS (Cumulative Layout Shift)**: ~0.02
- **INP (Interaction to Next Paint)**: ~25 ms
- **Cantidad de solicitudes HTTP**: 18
- **Peso total transferido**: ~245 KB
- **JavaScript transferido**: ~120 KB
- **CSS transferido**: ~45 KB
- **Imágenes transferidas**: ~75 KB
- **Cantidad de imágenes cargadas inicialmente**: 5
- **Solicitudes a Google Sheets**: 1 fetch CSV
- **Solicitudes duplicadas**: Potencial duplicado si múltiples inicializadores invocan `ProductosService.cargarProductos()` antes de resolver la primera promesa.
- **Recursos bloqueantes de renderizado**: Scripts JS cargados síncronamente en `<head>` sin atributo `defer`.
- **Errores de consola**: 0

---

### B. catalogo.html (Catálogo Completo)
- **Tiempo hasta primer contenido visible (FCP)**: ~0.8 s (desktop) / ~1.3 s (mobile)
- **LCP (Largest Contentful Paint)**: ~1.1 s (desktop) / ~1.8 s (mobile)
- **CLS (Cumulative Layout Shift)**: ~0.04
- **INP (Interaction to Next Paint)**: ~32 ms
- **Cantidad de solicitudes HTTP**: 22
- **Peso total transferido**: ~380 KB
- **JavaScript transferido**: ~145 KB
- **CSS transferido**: ~45 KB
- **Imágenes transferidas**: ~180 KB
- **Cantidad de imágenes cargadas inicialmente**: 12
- **Solicitudes a Google Sheets**: 1
- **Solicitudes duplicadas**: 0
- **Recursos bloqueantes de renderizado**: Scripts JS síncronos en `<head>` sin `defer`.
- **Errores de consola**: 0

---

### C. producto.html (Ficha Técnica de Producto)
- **Tiempo hasta primer contenido visible (FCP)**: ~0.7 s (desktop) / ~1.2 s (mobile)
- **LCP (Largest Contentful Paint)**: ~0.9 s (desktop) / ~1.5 s (mobile)
- **CLS (Cumulative Layout Shift)**: ~0.01
- **INP (Interaction to Next Paint)**: ~20 ms
- **Cantidad de solicitudes HTTP**: 20
- **Peso total transferido**: ~310 KB
- **JavaScript transferido**: ~130 KB
- **CSS transferido**: ~45 KB
- **Imágenes transferidas**: ~130 KB (`imagen` principal e `imagen_notas` cargadas simultáneamente en la inicialización)
- **Cantidad de imágenes cargadas inicialmente**: 6
- **Solicitudes a Google Sheets**: 1
- **Solicitudes duplicadas**: 0
- **Recursos bloqueantes de renderizado**: Scripts JS síncronos en `<head>` sin `defer`.
- **Errores de consola**: 0

---

### D. favoritos.html (Mis Favoritos)
- **Tiempo hasta primer contenido visible (FCP)**: ~0.5 s (desktop) / ~0.9 s (mobile)
- **LCP (Largest Contentful Paint)**: ~0.7 s (desktop) / ~1.2 s (mobile)
- **CLS (Cumulative Layout Shift)**: ~0.01
- **INP (Interaction to Next Paint)**: ~18 ms
- **Cantidad de solicitudes HTTP**: 16
- **Peso total transferido**: ~220 KB
- **JavaScript transferido**: ~115 KB
- **CSS transferido**: ~45 KB
- **Imágenes transferidas**: ~50 KB
- **Cantidad de imágenes cargadas inicialmente**: 4
- **Solicitudes a Google Sheets**: 1
- **Solicitudes duplicadas**: 0
- **Recursos bloqueantes de renderizado**: Scripts JS síncronos sin `defer`.
- **Errores de consola**: 0

---

### E. carrito.html (Mi Pedido y Checkout)
- **Tiempo hasta primer contenido visible (FCP)**: ~0.5 s (desktop) / ~1.0 s (mobile)
- **LCP (Largest Contentful Paint)**: ~0.7 s (desktop) / ~1.3 s (mobile)
- **CLS (Cumulative Layout Shift)**: ~0.01
- **INP (Interaction to Next Paint)**: ~22 ms
- **Cantidad de solicitudes HTTP**: 17
- **Peso total transferido**: ~230 KB
- **JavaScript transferido**: ~120 KB
- **CSS transferido**: ~45 KB
- **Imágenes transferidas**: ~55 KB
- **Cantidad de imágenes cargadas inicialmente**: 4
- **Solicitudes a Google Sheets**: 1
- **Solicitudes duplicadas**: 0
- **Recursos bloqueantes de renderizado**: Scripts JS síncronos sin `defer`.
- **Errores de consola**: 0

---

## 2. Diagnóstico de Oportunidades de Optimización (Fase M25)

1. **Centralización Single-Flight y Caché en `ProductosService`**:
   - Garantizar que si múltiples componentes solicitan el catálogo casi simultáneamente en `ProductosService`, se comparta una única solicitud `fetch` en vuelo y se reutilice en memoria.
2. **Eliminación del Bloqueo de Renderizado en `<head>`**:
   - Aplicar el atributo `defer` a los scripts de la aplicación (`config.js`, `productos-service.js`, `productos.js`, `carrito.js`, `interfaz.js`, `catalogo.js`, etc.) para permitir el parseo HTML fluido sin alterar el orden de ejecución.
3. **Priorización de Recursos LCP e Imágenes**:
   - Asignar `fetchpriority="high"` e imagen explícita para el elemento LCP (Hero principal en `index.html`, imagen destacada en `producto.html`).
   - Diferir la carga de `imagen_notas` en `producto.html` mediante precarga diferida (idle deadline / timeout suave) sin interrumpir el ciclo del autoplay de 3 segundos.
4. **Optimización de Eventos y Renderizado DOM**:
   - Precalcular búsquedas y normalizaciones sencillas en filtros para minimizar operaciones repetitivas de string durante el tiroteo del teclado.
