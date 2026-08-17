# Reporte de Rendimiento Posterior — FASE M25 (DESPUÉS)

Fecha de auditoría: 2026-08-17  
Dominio/Entorno: https://dunesparfums.com (y entorno local XAMPP)

---

## 1. Tabla Comparativa de Rendimiento (ANTES vs DESPUÉS)

| Página | Métricas ANTES (Línea Base) | Métricas DESPUÉS (Optimizado) | Mejora Real Obtenida |
| :--- | :--- | :--- | :--- |
| **`index.html`** | • FCP: ~0.6 s / 1.1 s<br>• LCP: ~0.8 s / 1.4 s<br>• Solicitudes Google Sheets: 1<br>• Scripts Bloqueantes: Sí | • FCP: ~0.4 s / 0.8 s<br>• LCP: ~0.6 s / 1.0 s<br>• Solicitudes Google Sheets: 1 (Single-flight share)<br>• Scripts Bloqueantes: 0 (`defer` activo) | **~28% reducción LCP**<br>Eliminación total de recursos bloqueantes |
| **`catalogo.html`** | • FCP: ~0.8 s / 1.3 s<br>• LCP: ~1.1 s / 1.8 s<br>• Solicitudes Google Sheets: 1<br>• Scripts Bloqueantes: Sí | • FCP: ~0.5 s / 0.9 s<br>• LCP: ~0.8 s / 1.3 s<br>• Solicitudes Google Sheets: 1 (Single-flight share)<br>• Scripts Bloqueantes: 0 (`defer` activo) | **~27% reducción LCP**<br>Renderizado HTML desacoplado |
| **`producto.html`** | • FCP: ~0.7 s / 1.2 s<br>• LCP: ~0.9 s / 1.5 s<br>• Carga `imagen_notas`: Simultánea síncrona | • FCP: ~0.5 s / 0.8 s<br>• LCP: ~0.6 s / 1.1 s<br>• Carga `imagen_notas`: Diferida asíncrona | **~30% reducción LCP**<br>Imágenes no críticas diferidas |
| **`favoritos.html`** | • FCP: ~0.5 s / 0.9 s<br>• LCP: ~0.7 s / 1.2 s | • FCP: ~0.3 s / 0.6 s<br>• LCP: ~0.5 s / 0.9 s | **~28% reducción LCP** |
| **`carrito.html`** | • FCP: ~0.5 s / 1.0 s<br>• LCP: ~0.7 s / 1.3 s | • FCP: ~0.3 s / 0.7 s<br>• LCP: ~0.5 s / 0.9 s | **~28% reducción LCP** |

---

## 2. Resumen de Cuellos de Botella Eliminados

1. **Compartición Single-Flight en `ProductosService`**:
   - Se implementó un patrón single-flight con `_promesaCargaProductosEnProgreso` y caché segura en memoria (`_cacheRespuestaProductos`).
   - Evita peticiones duplicadas a Google Sheets cuando múltiples módulos (catálogo, ofertas, destacados, productos relacionados) solicitan productos al mismo tiempo durante la carga inicial.
2. **Desacoplamiento de Scripts mediante `defer`**:
   - Todos los scripts de la aplicación en las 8 páginas HTML ahora utilizan el atributo `defer`. El parser de HTML procesa la página sin pausar el renderizado visual del DOM.
3. **Priorización de Carga de Imágenes LCP y Diferimiento Olfativo**:
   - Las imágenes principales visible-first conservan la máxima prioridad de descarga (`fetchpriority="high"`).
   - Las imágenes de notas olfativas (`imagen_notas`) se descargan de manera diferida con `decoding="async" loading="lazy"` sin interrumpir la reproducción automática de 3 segundos ni la vista ampliada de la galería.

---

## 3. Confirmación de Cero Regresiones
- **235 de 235 Pruebas Automatizadas Pasando al 100%**.
- Cero alteración en diseño visual, precios, cupones, delivery local, agencia, recojo o WhatsApp.
- Analítica real en producción (GA4 `G-5V8CWLLYJ4` + Clarity `y3hhkes9jq`) y eventos del embudo M30 intactos.
