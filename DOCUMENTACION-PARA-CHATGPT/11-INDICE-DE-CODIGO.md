# 11 - ÍNDICE DE CÓDIGO, SÍMBOLOS Y REFERENCIAS TÉCNICAS

Este documento proporciona un índice exhaustivo y navegable de los archivos, funciones principales, variables globales, selectores DOM, claves de almacenamiento y referencias cruzadas del proyecto **DUNES PARFUMS**.

---

## 1. ÍNDICE DE ARCHIVOS JAVASCRIPT Y FUNCIONES CLAVE

| Archivo | Objeto / Espacio Global | Funciones Principales | Responsabilidad |
| :--- | :--- | :--- | :--- |
| `js/servicios.js` | `window.serviciosDatos` | `cargarProductos()`, `obtenerProductoPorId(id)`, `parsearCSV(texto)`, `formatearPrecio(monto)`, `limpiarCache()` | Carga de datos de productos desde Google Sheets o `data/productos.json` con caché local. |
| `js/catalogo.js` | `window.renderCatalogo` | `inicializarCatalogo()`, `renderizarProductos(lista)`, `crearTarjetaProductoHTML(prod)`, `actualizarPaginacion(total)` | Orquestación visual del catálogo, renderizado de tarjetas y paginación. |
| `js/carrito.js` | `window.carrito` | `obtenerCarrito()`, `agregarAlCarrito(item)`, `eliminarDelCarrito(id, pres)`, `actualizarCantidad(id, pres, cant)`, `calcularTotales()`, `procesarPedidoWhatsApp()` | Estado del carrito, cálculo de totales, validación de stock decants, cálculo de envíos y WhatsApp. |
| `js/filtros.js` | `window.gestorFiltros` | `inicializarFiltros()`, `aplicarFiltros()`, `filtrarPorGenero(gen)`, `filtrarPorMarca(marca)`, `ordenarProductos(criterio)` | Facetas de búsqueda, ordenamiento y filtrado acumulativo sobre el catálogo. |
| `js/cupones.js` | `window.moduloCupones` | `cargarCupones()`, `validarCupon(codigo, subtotal)`, `aplicarDescuento(cupon, total)`, `parsearCSVCupo(texto)` | Carga y validación de reglas de cupones de descuento desde Google Sheets o `data/cupones.json`. |
| `js/anuncios.js` | `window.anunciosPublicidad` | `cargarAnuncios()`, `renderizarBanner()`, `cerrarBanner()`, `rotarAnuncios()` | Gestión del banner rotativo superior y anuncios flotantes. |
| `js/interfaz.js` | `window` / Global | `abrirModalProducto(id)`, `cerrarModal()`, `abrirDrawerMovil()`, `cerrarDrawerMovil()`, `mostrarNotificacion(msg, tipo)`, `inicializarBuscadorGlobal()` | Monolito de UI (4,603 líneas): modales, navegación móvil, accesibilidad, toasts y eventos DOM. |
| `js/producto.js` | `window` / Local | `obtenerIdDesdeURL()`, `cargarDetalleProducto()`, `cambiarPresentacion(tamano)`, `actualizarGaleria(indice)` | Lógica específica de la página `producto.html` (galería, selector de decants y stock). |
| `js/favoritos.js` | `window.favoritos` | `obtenerFavoritos()`, `toggleFavorito(id)`, `esFavorito(id)`, `renderizarFavoritos()`, `sincronizarBotonesFavoritos()` | Gestión de la lista de deseos guardada en `localStorage`. |
| `js/comparador.js` | `window.comparador` | `obtenerComparador()`, `agregarAComparador(id)`, `eliminarDeComparador(id)`, `renderizarTablaComparativa()` | Comparador cara a cara de hasta 4 perfumes simultáneos. |
| `js/preventa-service.js` | `window.preventaService` | `cargarPreventa()`, `obtenerItemPreventa(id)`, `guardarReserva(reserva)`, `calcularSaldoPendiente(precio, adelanto)` | Datos del catálogo de preventa y gestión del carrito de reservas. |
| `js/preventa.js` | `window` / Local | `inicializarCatalogoPreventa()`, `renderizarGridPreventa()`, `abrirModalPreventa(id)` | Renderizado y filtros del catálogo en `/preventa/index.html`. |
| `js/preventa-reserva.js` | `window` / Local | `renderizarResumenReserva()`, `validarFormularioReserva()`, `generarMensajeWhatsAppReserva()` | Flujo de checkout de reserva en `/preventa/reserva/index.html`. |
| `js/ayuda.js` | `window` / Local | `inicializarFAQ()`, `filtrarPreguntas(query)`, `toggleAcordeon(item)` | Acordeones y buscador en tiempo real en la página `ayuda.html`. |
| `js/header-footer.js` | `window` / Local | `inyectarHeader()`, `inyectarFooter()`, `marcarEnlaceActivo()` | Inyección dinámica de cabeceras y pies de página compartidos (en desuso parcial). |

---

## 2. MATRIZ DE ASOCIACIÓN: PÁGINAS VS SCRIPTS Y HOJAS DE ESTILO

| Página HTML | Hojas de Estilo CSS Vinculadas | Scripts JavaScript Vinculados |
| :--- | :--- | :--- |
| `index.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `interfaz.js`, `anuncios.js`, `catalogo.js`, `carrito.js` |
| `catalogo.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `filtros.js`, `catalogo.js`, `interfaz.js`, `carrito.js`, `favoritos.js`, `comparador.js` |
| `producto.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `interfaz.js`, `producto.js`, `carrito.js`, `favoritos.js` |
| `carrito.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `cupones.js`, `carrito.js`, `interfaz.js` |
| `favoritos.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `favoritos.js`, `carrito.js`, `interfaz.js` |
| `comparador.html` | `design-system.css`, `estilos.css`, `responsive.css`, `animaciones.css` | `servicios.js`, `comparador.js`, `carrito.js`, `interfaz.js` |
| `ayuda.html` | `design-system.css`, `estilos.css`, `responsive.css`, `ayuda.css` | `ayuda.js`, `interfaz.js` |
| `404.html` | `design-system.css`, `estilos.css`, `responsive.css` | `interfaz.js` |
| `preventa/index.html` | `design-system.css`, `estilos.css`, `responsive.css`, `preventa.css` | `preventa-service.js`, `preventa.js` *(+ script inline drawer)* |
| `preventa/reserva/index.html` | `design-system.css`, `estilos.css`, `responsive.css`, `preventa-reserva.css` | `preventa-service.js`, `preventa-reserva.js` *(+ script inline drawer)* |

---

## 3. SELECTORES DOM CRÍTICOS (ID Y CLASES)

Cualquier cambio en el marcado HTML de estos elementos romperá la interactividad de los scripts:

### Catálogo y Búsqueda
- `#lista-productos` / `#grid-productos`: Contenedor principal donde se inyectan las tarjetas de perfume.
- `#buscador-principal` / `#search-input`: Campo de texto de búsqueda en tiempo real.
- `#contador-resultados`: Texto con el total de perfumes filtrados.
- `#filtro-genero`, `#filtro-marca`, `#filtro-tipo`: Contenedores de botones de facetas.
- `#ordenar-por`: Selector `<select>` de criterio de ordenación.
- `#paginacion`: Contenedor de botones de página anterior/siguiente/números.

### Carrito y Checkout
- `#items-carrito`: Contenedor de las filas de productos en `carrito.html`.
- `#subtotal-carrito`: Elemento de texto con el subtotal monetario.
- `#costo-envio`: Elemento de texto con el costo de delivery calculado.
- `#total-carrito`: Elemento de texto con el monto final a pagar.
- `#input-cupon`: Campo de texto donde el cliente ingresa el cupón.
- `#btn-aplicar-cupon`: Botón para validar el código de descuento.
- `#form-checkout`: Formulario de datos personales y dirección.
- `#btn-whatsapp-checkout`: Botón final que dispara la apertura de WhatsApp.
- `.badge-carrito` / `#contador-carrito`: Indicador numérico en el ícono de cabecera.

### Modales y Drawer Móvil
- `#modal-producto`: Ventana modal para vista rápida de un perfume.
- `#modal-comparador`: Modal con tabla comparativa de productos.
- `#drawer-menu-movil`: Menú lateral deslizable en pantallas pequeñas.
- `#btn-abrir-drawer` / `#btn-cerrar-drawer`: Botones hamburguesa y cierre del drawer.
- `#toast-container`: Contenedor flotante de notificaciones emergentes.

---

## 4. ÍNDICE DE CLAVES DE ALMACENAMIENTO (LOCALSTORAGE)

| Clave | Tipo de Dato | Estructura / Ejemplo | Utilizado Por |
| :--- | :--- | :--- | :--- |
| `dunes_carrito` | Array de Objetos | `[ { id: "101", presentacion: "5ml", cantidad: 2, precio: 35.00, nombre: "...", marca: "..." } ]` | `js/carrito.js` |
| `dunes_favoritos` | Array de Strings | `["101", "104", "205"]` | `js/favoritos.js` |
| `dunes_comparador` | Array de Strings | `["101", "102"]` (Máximo 4) | `js/comparador.js` |
| `dunes_preventa_cart` | Array de Objetos | `[ { id: "PRE-01", cantidad: 1, adelantoUnitario: 10.00, precioTotal: 280.00 } ]` | `js/preventa-service.js`, `js/preventa-reserva.js` |
| `dunes_cupon_activo` | Objeto | `{ codigo: "BIENVENIDA", tipo: "porcentaje", valor: 10, aplicado: true }` | `js/carrito.js`, `js/cupones.js` |
| `dunes_banner_dismissed` | String Timestamp | `"1728864000000"` (Oculta banner temporalmente) | `js/anuncios.js` |

---

## 5. ÍNDICE DE HOJAS DE GOOGLE SHEETS Y ARCHIVOS LOCALES

| Entidad de Negocio | URL Google Sheets (CSV) | Fallback Local (JSON) | Clave GID |
| :--- | :--- | :--- | :---: |
| Catálogo General de Productos | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=0` | `data/productos.json` | `0` |
| Cupones de Descuento | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=716279816` | `data/cupones.json` | `716279816` |
| Anuncios y Notificaciones | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=82988812` | `data/anuncios.json` | `82988812` |
| Catálogo de Preventas | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=1833078058` | `data/preventa.json` | `1833078058` |
| Configuración de Preventa | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=297886514` | *(Integrado en preventa)* | `297886514` |
| Referencias Cruzadas / Marcas | *(No aplica)* | `data/referencias.json` | *(Local)* |

---

## 6. MAPA DE ARCHIVOS DE TESTS UNITARIOS (`tests/`)

El proyecto cuenta con una batería de **373 tests unitarios** que corren nativamente mediante `node --test`:

- `tests/cart-core.test.js`: Operaciones atómicas de añadir, remover, vaciar y persistir carrito.
- `tests/decant-stock.test.js`: Lógica de deducción y validación de mililitros para decants de 3ml, 5ml y 10ml.
- `tests/decants-filter.test.js`: Filtrado del catálogo exclusivo para fragancias disponibles en decant.
- `tests/free-shipping-threshold.test.js`: Verificación de cálculo de envío gratis para Tarapoto y provincias de San Martín.
- `tests/delivery-method-card-click.test.js`: Interacción de selección de tarjetas de envío en el checkout.
- `tests/erba-pura-nicho.test.js`: Clasificación y categorización de perfumes de diseñador vs. nicho.
- `tests/mobile-purchase-bar.test.js`: Visibilidad e interacción de la barra flotante de compra en móviles.
- `tests/preventa-service.test.js`: Carga, cálculo de adelanto (S/ 10.00) y saldo de pedidos en preventa.
- `tests/preventa-reserva.test.js`: Validación de formulario y generación de mensaje de reserva para WhatsApp.
- `tests/whatsapp-encoding.test.js`: Verificación de ausencia de emojis corruptos y formateo de saltos de línea en WhatsApp.

---

## 7. MAPA COMPLETO DE LA SUITE DE DOCUMENTACIÓN

La carpeta `DOCUMENTACION-PARA-CHATGPT/` se organiza de forma modular para consultas específicas:

1. [00-RESUMEN-MAESTRO.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/00-RESUMEN-MAESTRO.md) - Visión ejecutiva, stack y reglas de negocio.
2. [01-ESTRUCTURA-ARQUITECTURA.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/01-ESTRUCTURA-ARQUITECTURA.md) - Estructura de directorios y mapa de dependencias.
3. [02-PAGINAS-Y-NAVEGACION.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/02-PAGINAS-Y-NAVEGACION.md) - Análisis técnico de las 10 páginas HTML.
4. [03-MODULOS-Y-FUNCIONALIDADES.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/03-MODULOS-Y-FUNCIONALIDADES.md) - Funcionamiento interno de cada subsistema.
5. [04-JAVASCRIPT-Y-EVENTOS.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/04-JAVASCRIPT-Y-EVENTOS.md) - Detalle de funciones, ciclos de vida y listeners.
6. [05-CSS-Y-DISENO.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/05-CSS-Y-DISENO.md) - Tokens CSS, responsive design y componentes gráficos.
7. [06-DATOS-Y-ALMACENAMIENTO.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/06-DATOS-Y-ALMACENAMIENTO.md) - Esquemas de datos, almacenamiento local y Google Sheets.
8. [07-FLUJOS-DE-USUARIO.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/07-FLUJOS-DE-USUARIO.md) - Recorridos de compra, preventa, cupones y comparador.
9. [08-ERRORES-RIESGOS-Y-PENDIENTES.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/08-ERRORES-RIESGOS-Y-PENDIENTES.md) - Auditoría de código con evidencias de línea.
10. [09-HOJA-DE-RUTA.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/09-HOJA-DE-RUTA.md) - Hoja de ruta priorizada y precauciones técnicas.
11. [10-GUIA-DE-CONTINUIDAD-CHATGPT.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/10-GUIA-DE-CONTINUIDAD-CHATGPT.md) - Guía directa de continuidad para ChatGPT / agentes IA.
12. [11-INDICE-DE-CODIGO.md](file:///c:/xampp/htdocs/DUNES-PARFUMS-CATALOGO/DOCUMENTACION-PARA-CHATGPT/11-INDICE-DE-CODIGO.md) - Índice de símbolos, selectores, almacenamiento y scripts.
