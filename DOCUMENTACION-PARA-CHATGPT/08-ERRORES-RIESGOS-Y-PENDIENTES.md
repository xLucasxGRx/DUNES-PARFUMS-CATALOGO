# 08-ERRORES-RIESGOS-Y-PENDIENTES.md
# AUDITORÍA TÉCNICA DE ESTADO, RIESGOS Y DEUDA TÉCNICA

Este documento clasifica objetivamente los hallazgos de la auditoría de código, diferenciando entre hechos confirmados con evidencia de línea y riesgos potenciales o sospechas.

---

## 1. Clasificación del Estado Real del Código

### A. Funcionalidades 100% Completas y Verificadas

| Módulo / Funcionalidad | Evidencia en Código | Estado |
| :--- | :--- | :--- |
| **Carga de Catálogo desde Google Sheets** | `js/productos-service.js` (L248-L445) | **Completo**: Soporta CSV, delimitadores, comillas escapadas, normalización de datos y fallback transparente a `data/productos.json`. 373 pruebas passing. |
| **Cálculo de Decants por Mililitros** | `js/carrito.js` (L93-L128, L289-L316) | **Completo**: Algoritmo que descuenta mililitros ocupados por otras presentaciones del mismo frasco en el carrito. |
| **Semáforo Anti-Concurrencia en Carrito** | `js/carrito.js` (L228-L243, L365) | **Completo**: `_bloqueosActualizacionCantidad = new Set()` previene condiciones de carrera por doble clic rápido en botones `+`/`-`. |
| **Checkout Progresivo por Pasos** | `js/interfaz.js` (L3720-L3800) | **Completo**: `obtenerPrimerPasoIncompleto()` detecta exactamente qué campo falta, inserta la alerta visual y realiza auto-scroll al error. |
| **Generador de Mensajes WhatsApp** | `js/whatsapp.js` (L44-L143) | **Completo**: Construye mensajes estructurados sin emojis, sanitiza caracteres corruptos (`%EF%BF%BD`) y desglosa productos, cupones y entregas. |
| **Módulo Independiente de Preventa** | `js/preventa-cart.js` (L107-L145), `js/preventa-service.js` (L376-L460) | **Completo**: Motor de separación con adelanto congelado de S/ 10.00 por unidad y balance pendiente al recibir. Completamente aislado de `dunes_cart`. |
| **Comparador Olfativo a Doble Columna** | `js/comparador.js` (L35-L109, L280-L316) | **Completo**: Dropdowns excluyentes (`closeComparatorDropdowns`), validación de notas olfativas y exclusión del perfume opuesto. |
| **Lista de Deseos Multi-Pestaña** | `js/favoritos-service.js` (L250-L260) | **Completo**: Emisión de `CustomEvent` y sincronización instantánea entre pestañas vía evento `storage`. |
| **Barra Superior de Anuncios Autocancelable** | `js/anuncios-ui.js` (L47-L66, L71-L97) | **Completo**: Oculta el nodo por completo (`hidden`) y detiene intervalos si no hay anuncios activos en Google Sheets. |
| **Medición GA4 / Clarity Cero PII** | `js/analytics.js` (L16-L37, L125-L214) | **Completo**: Bloquea nombres, teléfonos y direcciones del cliente en todos los eventos de comercio electrónico. |

---

### B. Funcionalidades Parcialmente Desarrolladas o con Limitaciones de Arquitectura

1. **Gestión de Cupones Exclusivamente en el Frontend**:
   - *Evidencia*: `js/cupones-service.js` (L226-L255) y `js/cupones.js` (L128-L227).
   - *Detalle*: La validación de los cupones (monto mínimo, porcentaje, vigencia) se procesa en el navegador del cliente consumiendo un CSV público. Sin una base de datos backend, no es posible restringir cupones de uso único por cliente.
   - *Mitigación existente*: Como el pedido se procesa manualmente por WhatsApp, el asesor valida el código antes de recibir el pago, evitando fraudes comerciales.

2. **Carga Asíncrona de Fuentes Externas (Google Fonts / Lucide)**:
   - *Evidencia*: `<head>` de todos los HTML (`https://fonts.googleapis.com` y `https://unpkg.com/lucide@latest`).
   - *Detalle*: Si el usuario navega con una conexión extremadamente lenta o con bloqueadores de red estrictos, los iconos vectoriales de Lucide pueden tardar en inicializarse hasta que el script de unpkg responda.

---

### C. Funcionalidades No Conectadas o Aparentemente Abandonadas

1. **Archivos de Utilidad y Scripts en `scratch/`**:
   - *Evidencia*: Carpeta `scratch/` contiene 14 archivos Python (`analyze_logo_bbox.py`, `optimize_images.py`, `build_favicons_white.py`, etc.).
   - *Detalle*: No son parte del código de producción de la web. Son scripts utilitarios ejecutados en local para recortar imágenes, optimizar favicons y procesar WebP. Deben preservarse como herramientas auxiliares, pero no son llamados por los HTML.

2. **Archivo `data/productos-google-sheets.csv`**:
   - *Evidencia*: `data/productos-google-sheets.csv` (5.9 KB).
   - *Detalle*: Es una instantánea estática del CSV de Google Sheets. El servicio `ProductosService` en producción no la consume directamente (consume la URL en la nube o `data/productos.json`). Sirve como respaldo de emergencia.

---

### D. Errores Confirmados en Código

*No se detectaron errores críticos de sintaxis ni excepciones en tiempo de ejecución (373/373 pruebas passing).* Sin embargo, se identificaron las siguientes observaciones técnicas verificadas:

1. **Riesgo de Inconsistencia en Claves de Productos (`p.precio_oferta` vs `p.precioOferta`)**:
   - *Evidencia*: `js/productos-service.js` (L212-L214), `js/carrito.js` (L152-L154), `js/analytics.js` (L54-L56).
   - *Detalle*: En varias partes del código se verifica `p.precio_oferta ?? p.precioOferta` debido a que en etapas previas del desarrollo se usó camelCase y luego snake_case.
   - *Impacto*: Aunque está cubierto con operadores de coalescencia nula (`??`), cualquier nuevo desarrollo debe mantener esta compatibilidad defensiva.

2. **Diferencias de Rutas Relativas en Módulo Preventa**:
   - *Evidencia*: `preventa/index.html` (usa `../js/`) y `preventa/reserva/index.html` (usa `../../js/`).
   - *Detalle*: Al estar ubicados en subcarpetas de profundidad distinta, un cambio descuidado en rutas de imágenes o scripts puede romper la resolución en `preventa/reserva/`. La función `resolverRutaImagen()` en `js/preventa-reserva.js` (L31-L46) ya mitiga esto, pero debe cuidarse en futuras adiciones.

---

### E. Problemas de Mantenibilidad y Rendimiento

1. **Monolito en `js/interfaz.js` (202.5 KB - 4,603 líneas)**:
   - *Evidencia*: `js/interfaz.js`.
   - *Diagnóstico*: Concentra el control del drawer móvil, header sticky, detalle de producto, galería lightbox, lógica del checkout progresivo, cálculo de tarifas de delivery local, integración de cupones con totales, recomendador de productos relacionados y acordeón del footer.
   - *Riesgo*: Modificar una función de delivery en `interfaz.js` podría inadvertidamente introducir un error de sintaxis que bloquee el renderizado del producto o el menú móvil.
   - *Recomendación*: Proteger `interfaz.js` y correr siempre `npm test` tras cualquier edición.

2. **Volumen de Hojas de Estilo CSS (Total > 450 KB)**:
   - *Evidencia*: `css/responsive.css` (184 KB), `css/estilos.css` (171 KB), `css/preventa.css` (78 KB).
   - *Diagnóstico*: Gran cantidad de reglas responsivas detalladas para breakpoints específicos (`360px`, `390px`, `480px`, `768px`, `991px`, `1024px`, `1366px`, `1440px`, `1920px`).
   - *Riesgo*: Especificidad alta y posible duplicidad de selectores si se agregan nuevas clases sin revisar las existentes en `responsive.css`.

3. **Duplicación de la Lógica de Menú Móvil en Preventa**:
   - *Evidencia*: `preventa/index.html` (L1159-L1265) y `preventa/reserva/index.html` (L396-L480).
   - *Diagnóstico*: En lugar de importar `interfaz.js`, ambos archivos tienen el código del drawer móvil copiado en un `<script>` inline. Si se cambia la estructura del menú principal, debe actualizarse en estos 3 lugares.
