# 01-ESTRUCTURA-ARQUITECTURA.md
# ARQUITECTURA DE SOFTWARE Y ESTRUCTURA DE ARCHIVOS

---

## 1. Árbol Integral de Archivos y Carpetas

A continuación se detalla la estructura física verificada del proyecto `DUNES-PARFUMS-CATALOGO`:

```
DUNES-PARFUMS-CATALOGO/
│
├── 404.html                               # Página de error 404 personalizada (noindex)
├── ayuda.html                             # Centro de ayuda, FAQ y galería de referencias/confianza
├── carrito.html                           # Vista del carrito de compras y checkout progresivo
├── catalogo.html                          # Catálogo completo con buscador y filtros multinivel
├── comparador.html                        # Comparador interactivo de perfumes por fichas olfativas
├── favoritos.html                         # Vista de productos guardados (Wishlist)
├── index.html                             # Página principal (Home) de la perfumería
├── producto.html                          # Vista de detalle de fragancia individual y decants
│
├── preventa/                              # Módulo independiente de Preventa de fragancias
│   ├── index.html                         # Catálogo de productos en preventa con reserva
│   └── reserva/
│       └── index.html                     # Checkout y confirmación de reservas de preventa
│
├── css/                                   # Hojas de estilo en cascada (CSS3 nativo)
│   ├── animaciones.css                    # Keyframes, transiciones hover y scroll reveal
│   ├── ayuda.css                          # Estilos específicos para FAQ, carrusel y lightbox de ayuda
│   ├── design-system.css                  # Tokens globales (:root), tipografía, colores, z-index, botones
│   ├── estilos.css                        # Estilos estructurales globales, header, footer, cards, checkout
│   ├── preventa-reserva.css               # Estilos del checkout y resumen financiero de preventa
│   ├── preventa.css                       # Estilos de la landing de preventa, modales y cards de reserva
│   └── responsive.css                     # Media queries móviles, drawer lateral, tablet y desktop
│
├── js/                                    # Lógica de cliente en JavaScript Vanilla (ES6+)
│   ├── analytics.js                       # Capa central defensiva GA4 + Microsoft Clarity (Zero PII)
│   ├── anuncios-service.js                # Servicio de carga de anuncios desde Google Sheets (gid=82988812)
│   ├── anuncios-ui.js                     # Controlador de la barra superior rotativa de anuncios
│   ├── ayuda.js                           # Controlador de FAQ acordeón, buscador y carrusel de referencias
│   ├── carrito.js                         # Lógica de carrito, cálculo de stock/ml, modales y toast
│   ├── catalogo.js                        # Controlador del catálogo: filtros, orden, URL params y sessionStorage
│   ├── comparador.js                      # Controlador del comparador de perfumes y dropdowns excluyentes
│   ├── config.js                          # URLs de Google Sheets (CSVs) y configuración de respaldos
│   ├── cupones-service.js                 # Servicio de consulta y parseo de cupones desde Google Sheets
│   ├── cupones-ui.js                      # Controlador visual de la caja de cupones en el checkout
│   ├── cupones.js                         # Motor puro matemático de validación y cálculo de descuentos
│   ├── favoritos-page.js                  # Renderizado de la cuadrícula de favoritos en favoritos.html
│   ├── favoritos-service.js               # Servicio de persistencia de favoritos ('dunes_favoritos')
│   ├── interfaz.js                        # Controlador general: drawer, header sticky, checkout, detalle producto
│   ├── preventa-cart.js                   # Motor puro de almacenamiento de reservas ('dunes_preventa_cart')
│   ├── preventa-reserva.js                # Controlador del checkout de reserva y generador WhatsApp preventa
│   ├── preventa-service.js                # Servicio de carga de productos y configuración de preventa
│   ├── preventa.js                        # Motor de búsqueda y filtrado de productos de preventa
│   ├── productos-service.js               # Servicio central de carga de catálogo (Sheets con fallback JSON)
│   ├── productos.js                       # Métodos de consulta y rotación de oferta especial en Home
│   └── whatsapp.js                        # Centralización del número oficial y generador de mensajes de pedido
│
├── data/                                  # Almacenamiento local de datos y respaldos
│   ├── migracion-productos-resumen.txt    # Registro histórico de migración de campos del catálogo
│   ├── preventa.json                      # Respaldo JSON para productos de preventa
│   ├── productos-google-sheets.csv        # Copia de seguridad estática del CSV de productos
│   ├── productos.json                     # Respaldo JSON oficial del catálogo de productos
│   └── referencias.json                   # Base de datos local de fotos de entregas, envíos y decants
│
├── assets/                                # Recursos visuales auxiliares
│   ├── favicon/                           # Conjunto oficial de favicons (16x16, 32x32, 48x48, apple-touch, ico)
│   └── referencias/                       # Fotografías reales para la galería de confianza
│       ├── decants/                       # Muestras de decants reales preparados (+ carpeta thumbs/)
│       ├── entregas/                      # Entregas a clientes en Tarapoto (+ carpeta thumbs/)
│       └── envios/                        # Envíos por agencia a provincias (+ carpeta thumbs/)
│
├── img/                                   # Imágenes principales del catálogo
│   ├── banners/                           # Portadas y fondos del Hero
│   ├── categorias/                        # Portadas de categorías (Árabes, Diseñador, Nicho, Decants)
│   ├── logo/                              # Logotipos oficiales horizontales y verticales
│   └── productos/                         # Imágenes optimizadas en formato .webp de fragancias
│
├── tests/                                 # Suite de pruebas automatizadas (373 tests)
│   ├── fixtures/                          # Datos de prueba para cupones y preventa
│   │   ├── cupones-fixtures.js
│   │   └── preventa-fixtures.js
│   └── *.test.js                          # 76 archivos de prueba que cubren todos los módulos
│
├── tools/                                 # Herramientas de optimización y automatización
│   ├── convertir-productos-webp.py        # Script Python para convertir imágenes a WebP
│   ├── generar-seo.js                     # Generador automático de sitemap.xml y validador SEO
│   └── reportes...                        # Reportes de auditoría de rendimiento y SEO previo
│
├── scratch/                               # Scripts de análisis y optimización auxiliares
├── CNAME                                  # Configuración de dominio personalizado (dunesparfums.com)
├── package.json                           # Configuración de scripts de pruebas y herramientas
├── README.md                              # Documentación general original del proyecto
├── robots.txt                             # Directivas para motores de búsqueda
├── sitemap.xml                            # Mapa del sitio generado para motores de búsqueda
└── skills-lock.json                       # Configuración de entorno
```

---

## 2. Puntos de Entrada de la Aplicación

El proyecto tiene **3 puntos de entrada principales** según el recorrido del usuario:

1. **Portal Principal (`index.html`)**:
   - Punto de entrada comercial de la marca.
   - Carga el diseño institucional, hero, oferta de la semana con rotación aleatoria no repetitiva, productos destacados y acceso rápido a colecciones.
2. **Catálogo Digital (`catalogo.html`)**:
   - Punto de entrada para búsqueda, exploración profunda y filtrado de productos.
   - Recupera el estado de filtros previos de la sesión o inicializa desde parámetros URL.
3. **Portal de Preventa (`preventa/index.html`)**:
   - Punto de entrada independiente para lanzamientos anticipados.

---

## 3. Matriz de Dependencias e Inyección de Scripts por Página

Para que otra IA o desarrollador entienda exactamente qué scripts interactúan en cada vista, la siguiente tabla muestra la secuencia exacta de inyección:

| Archivo HTML | Scripts JS Inyectados (en orden de ejecución con `defer`) |
| :--- | :--- |
| `index.html` | `analytics.js` (en head), `lucide`, `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js` |
| `catalogo.html` | `analytics.js` (en head), `lucide`, `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js`, **`catalogo.js`** |
| `producto.html` | `analytics.js` (en head), `lucide`, `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js` |
| `carrito.html` | `analytics.js` (en head), `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, **`cupones-service.js`**, **`cupones.js`**, **`cupones-ui.js`**, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js`, `lucide` |
| `favoritos.html` | `analytics.js` (en head), `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js`, **`favoritos-page.js`** |
| `comparador.html` | `analytics.js` (en head), `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `whatsapp.js`, `productos.js`, `carrito.js`, `interfaz.js`, **`comparador.js`** |
| `ayuda.html` | `analytics.js` (en head), `config.js`, `productos-service.js`, `anuncios-service.js`, `anuncios-ui.js`, `favoritos-service.js`, `cupones-service.js`, `cupones.js`, `cupones-ui.js`, `productos.js`, `whatsapp.js`, `carrito.js`, `interfaz.js`, **`ayuda.js`** |
| `preventa/index.html` | `analytics.js` (en head), `config.js`, **`preventa-service.js`**, **`preventa.js`**, **`preventa-cart.js`**, script inline de renderizado preventa |
| `preventa/reserva/index.html` | `config.js`, **`preventa-service.js`**, **`preventa-cart.js`**, **`preventa-reserva.js`**, script inline de drawer móvil |
| `404.html` | `analytics.js` (en head). No requiere scripts de catálogo. |

---

## 4. Dependencias Externas y Servicios Terceros

El proyecto fue intencionalmente construido para tener **dependencias externas mínimas**, garantizando máxima velocidad, sin riesgo de librerías obsoletas ni incompatibilidades de frameworks:

1. **Google Sheets (Google Docs Export API)**:
   - Endpoint: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?...`
   - Formato consumido: CSV plano mediante peticiones HTTP `fetch()` con parámetro `v=timestamp` para evitar caché HTTP del navegador.
2. **Google Analytics 4 (GA4)**:
   - ID de medición: `G-5V8CWLLYJ4`
   - Función `gtag()` llamada a través de `js/analytics.js`.
3. **Microsoft Clarity**:
   - ID de proyecto: `y3hhkes9jq`
   - Registro de mapas de calor, grabaciones de sesión y eventos personalizados de e-commerce (`add_to_cart`, `begin_checkout`, `whatsapp_lead`).
4. **Google Fonts (CDN)**:
   - Fuentes: `Cormorant Garamond` (pesos 400, 600, 700) y `Montserrat` (pesos 300, 400, 500, 600, 700).
5. **Lucide Icons (CDN unpkg)**:
   - `https://unpkg.com/lucide@latest`
   - Función global `lucide.createIcons()` invocada en `DOMContentLoaded` para renderizar SVGs vectoriales.
6. **WhatsApp API (Deep Linking)**:
   - Protocolo URI: `https://wa.me/51986510573?text={URL_ENCODED_STRING}`
