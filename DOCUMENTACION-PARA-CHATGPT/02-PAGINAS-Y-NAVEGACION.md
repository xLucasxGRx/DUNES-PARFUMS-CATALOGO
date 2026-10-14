# 02-PAGINAS-Y-NAVEGACION.md
# AUDITORÍA DETALLADA DE TODAS LAS PÁGINAS Y VISTAS

Este documento describe exhaustivamente cada una de las 10 páginas del proyecto, sus componentes visuales, interactividad, dependencias y comportamiento verificado en código.

---

## 1. Página: `index.html` (Portada Principal / Home)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `index.html` (o raíz `/`) |
| **Objetivo** | Presentar la propuesta de valor de Dunes Parfums, captar al visitante con la oferta especial de la semana, exhibir perfumes destacados, facilitar el acceso a las categorías principales y generar confianza con la ubicación física y botón flotante de WhatsApp. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Barra Superior de Anuncios (`#announcement-bar`)**: Mensajes rotativos procedentes de Google Sheets con transiciones suaves cada 4 segundos. Se auto-oculta si no hay anuncios activos.
2. **Encabezado (`header.header-main`)**: Logo institucional, navegación principal desktop, selector de favoritos con contador, icono de carrito con contador reactivo y botón hamburguesa para móviles.
3. **Sección Hero (`section.hero`)**: Titular editorial ("El Arte de la Alta Perfumería en tu Piel"), subtítulo evocador, botones de llamada a la acción ("Explorar Catálogo", "Ofertas Exclusivas") y composición visual del frasco principal con efecto parallax sutil.
4. **Sección Categorías (`section.categorias`)**: Cuadrícula de 4 colecciones (Perfumes Árabes, Diseñador, Nicho y Decants) con imágenes y enlaces directos a `catalogo.html` pre-filtrados.
5. **Sección Productos Destacados (`section.destacados`)**: Cuadrícula con las primeras 8 fragancias destacadas en catálogo (`destacado: true`, ordenadas por disponibilidad y orden), cargadas dinámicamente con skeleton loading previo.
6. **Sección Oferta Especial de la Semana (`#ofertas`)**: Card destacada que muestra una fragancia con descuento (`oferta: true`). Rota dinámicamente entre opciones activas para que el usuario no vea siempre la misma al recargar.
7. **Sección Beneficios / Propuesta de Valor (`section.beneficios`)**: 4 pilares: 100% Fragancias Originales, Asesoría Personalizada, Decants Exclusivos y Delivery en Tarapoto / Envíos a todo el Perú.
8. **Sección Ubicación y Horarios (`#ubicacion`)**: Dirección física en Cacatachi, enlace a Google Maps, horario de atención y botón de chat en directo.
9. **Pie de Página (`footer.footer-main`)**: Acordeón móvil unificado para Enlaces, Categorías y Contacto, disclaimer comercial y derechos de autor.
10. **Botón Flotante WhatsApp (`#whatsapp-floating-btn`)**: Acceso directo al chat comercial.

### Elementos Interactivos y Eventos
- **Menú Móvil (`#mobile-menu-toggle`, `#mobile-menu-close`)**: Abre/cierra el drawer lateral con bloqueo de scroll (`body.no-scroll`) y overlay oscuro.
- **Acordeón Catálogo Móvil (`#btn-toggle-catalogo-submenu`)**: Despliega subcategorías dentro del drawer.
- **Tarjetas de Producto**: Botón "Agregar al carrito" (añade 1 unidad y lanza toast + modal de confirmación), botón de favoritos (toggle corazón), enlace al detalle `producto.html?id=...`.
- **Oferta de la Semana**: Botón interactivo que agrega directamente la oferta al carrito o abre selector de decant según el formato.
- **Acordeón Footer**: Botones `.footer-accordion-btn` que expanden/colapsan columnas en móvil.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/animaciones.css`.
- **JS**: `js/analytics.js`, `js/config.js`, `js/productos-service.js`, `js/anuncios-service.js`, `js/anuncios-ui.js`, `js/favoritos-service.js`, `js/whatsapp.js`, `js/productos.js`, `js/carrito.js`, `js/interfaz.js`.

---

## 2. Página: `catalogo.html` (Catálogo General con Filtros)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `catalogo.html` |
| **Objetivo** | Explorar, filtrar, buscar y ordenar la totalidad de los perfumes y decants disponibles en la tienda. Permitir cotizar productos agotados por WhatsApp. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Encabezado y Barra de Anuncios**: Idénticos al Home.
2. **Encabezado del Catálogo (`.page-heading`)**: Título dinámico que cambia según la categoría activa ("Perfumes Árabes", "Decants de 3, 5 y 10 ml", etc.) con subtítulo y descripción personalizada.
3. **Barra de Búsqueda y Filtros Rápidos (`.catalog-filters-bar`)**:
   - Input de búsqueda en vivo (`#catalog-search-input`) con debounce de 150 ms y botón de limpiar.
   - Pestañas de Formato: Todos, Perfumes Sellados, Decants.
   - Selector de Tipo: Todos, Árabes, Diseñador, Nicho.
   - Selector de Género: Todos, Hombre, Mujer, Unisex.
   - Selector de Ocasión: Todas, Versátil, Diario, Citas, Noche, Formal.
   - Selector de Ordenación: Relevancia, Menor precio, Mayor precio.
   - Checkbox "Solo disponibles" (`#filter-available-only`).
   - Botón "Limpiar filtros" para reiniciar la vista rápidamente.
4. **Cuadrícula de Productos (`#catalog-products-grid`)**: Grilla responsiva (1 col en móvil pequeño, 2 cols en móvil/tablet, 4 cols en desktop) que renderiza tarjetas completas o skeletons animados durante la carga.
5. **Bloque de Cotización Especial (`#catalog-cotizacion-block`)**: Se muestra cuando no hay stock o cuando el usuario llega al final de la categoría. Contiene un botón personalizado que abre WhatsApp con mensaje pre-rellenado para cotizar fragancias bajo pedido.
6. **Estado Vacío (`#catalog-empty-state`)**: Mensaje elegante cuando una búsqueda no arroja coincidencias.
7. **Footer y Botón WhatsApp Flotante**: Estándar.

### Comportamiento y Persistencia
- **Lectura de Parámetros URL**: Soporta `?categoria=arabe|disenador|nicho|decants`, `?genero=hombre|mujer|unisex`, `?ocasion=citas|noche|...`.
- **Persistencia en `sessionStorage` (`dunes_catalog_state`)**: Guarda el estado completo de filtros y la posición vertical de scroll (`scrollY`). Al volver del detalle de un producto mediante el botón "Atrás", el catálogo restaura exactamente la búsqueda, filtros y posición donde el usuario se encontraba.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/animaciones.css`.
- **JS**: Scripts base + `js/catalogo.js`.

---

## 3. Página: `producto.html` (Ficha de Producto Individual)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `producto.html?id={id_producto}` |
| **Objetivo** | Mostrar información detallada de una fragancia: galería de fotos con zoom, selector de variantes para decants (3ml, 5ml, 10ml) o frasco sellado, notas olfativas, ficha olfativa ampliable en lightbox, productos relacionados y compra directa. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Galería Multimedia (`.product-detail-media`)**:
   - Imagen principal con soporte de zoom al pasar el cursor o hacer clic.
   - Miniaturas navegables (foto del frasco y ficha olfativa `imagen_notas`).
   - Badge de "Ver Ficha" que abre el Lightbox en pantalla completa.
2. **Información y Selector de Compra (`.product-detail-info`)**:
   - Marca, nombre del perfume, badges de categoría y género.
   - Selector de variantes:
     - Para **Sellados**: Precio regular y precio oferta (si aplica), indicador de stock en unidades físicas, selector de cantidad (1 a stock máximo).
     - Para **Decants**: Pills interactivas para 3 ml, 5 ml y 10 ml con su precio respectivo, indicador de mililitros disponibles totales del frasco madre.
   - Botón de agregar al carrito (`#btn-add-to-cart-detail`) y botón de favoritos.
3. **Descripción y Notas Olfativas**: Texto descriptivo, acordeón de pirámide olfativa (Salida, Corazón, Fondo).
4. **Carrusel de Productos Relacionados (`#related-products-grid`)**:
   - Algoritmo que puntúa afinidad: +3 puntos por misma categoría, +2 puntos por misma marca, +1 punto por mismo género.
   - Ordena por afinidad, aplica barajado Fisher-Yates entre candidatos con igual puntaje y limita a 4 sugerencias.
5. **Barra Móvil Fija de Compra (`.mobile-purchase-bar`)**: Aparece en pantallas móviles cuando el botón de compra principal sale del viewport al hacer scroll. Permite agregar al carrito sin regresar a la parte superior.

### Comportamiento Especial
- **SEO Dinámico en Cliente**: La función `actualizarSeoProducto(prod)` actualiza el `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:image`, `og:price:amount`) y genera el bloque JSON-LD Schema.org `Product` en tiempo real reflejando el precio de oferta real.
- **Manejo de Producto No Encontrado**: Muestra estado de error con botón para volver al catálogo si el ID no existe en la base de datos.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/animaciones.css`.
- **JS**: Scripts base + funciones internas en `js/interfaz.js` (`cargarDetalleProducto`, `renderizarDetalleSellado`, `renderizarDetalleDecant`, `inicializarGaleriaDetalle`).

---

## 4. Página: `carrito.html` (Carrito y Checkout Progresivo)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `carrito.html` |
| **Objetivo** | Revisión de los productos seleccionados, ajuste de cantidades, eliminación de ítems, vaciado completo, aplicación de cupones de descuento, selección de modalidad de entrega y confirmación del pedido hacia WhatsApp. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Listado de Ítems (`#cart-table-container`)**:
   - Tabla en desktop / tarjetas en móvil.
   - Muestra imagen, marca, nombre, variante/presentación, precio unitario, botones de control de cantidad (`+` / `-` con validación de stock unitario y ml) y botón de eliminar ítem.
   - Botón para "Vaciar carrito" con modal de confirmación (`#modal-confirm-vaciar`).
2. **Caja de Cupones de Descuento (`#coupon-section`)**:
   - Input de código (convierte automáticamente a mayúsculas), botón "Aplicar" con spinner de carga (`VERIFICANDO...`), caja de feedback y estado aplicado que muestra el monto ahorrado y botón para removerlo.
3. **Selector de Modalidades de Entrega (`.delivery-methods-grid`)**:
   - 3 tarjetas interactivas:
     1. **Delivery local** (Tarapoto, Morales, Cacatachi, Banda de Shilcayo).
     2. **Envío por agencia** (Resto del Perú vía Olva Courier, Shalom, etc.).
     3. **Recojo en local** (Tienda física Cacatachi).
4. **Selector de Zonas de Delivery Local (`#zone-selection-container`)**:
   - Tarjetas para: Cacatachi, Morales, Tarapoto Central, Tarapoto Aeropuerto, Banda Entrada, Banda Alta.
   - Informa tarifa y umbral para delivery gratis.
5. **Formulario de Datos del Cliente (`#delivery-form-container`)**:
   - Campos contextuales según la modalidad elegida (Nombre, Dirección, Referencia).
6. **Resumen de Pedido y Totales (`.cart-summary-card`)**:
   - Subtotal productos, descuento por cupón (si aplica), costo de entrega/embalaje y Total final destacado en color dorado.
7. **Botón Confirmar Pedido por WhatsApp (`#btn-confirmar-whatsapp`)**:
   - Ejecuta validaciones completas y genera el mensaje formateado.
8. **Barra Móvil Fija de Checkout (`#mobile-checkout-bar`)**:
   - Muestra el total y botón para continuar o confirmar en pantallas móviles.

### Reglas de Negocio Verificadas en Checkout
- **Validación Progresiva por Pasos**: Si el usuario intenta confirmar sin completar un dato, la función `obtenerPrimerPasoIncompleto()` detecta el campo exacto (modalidad faltante, zona faltante, nombre vacío o dirección vacía), inserta una caja de alerta visible (`.checkout-validation-alert`) y desplaza suavemente la pantalla hacia el error.
- **Sincronización con Cupones**: Si el carrito se vacía o se reducen productos por debajo del monto mínimo del cupón, el cupón se invalida o se recalcula automáticamente.
- **Envío por Agencia**: No requiere que el cliente ingrese dirección en la web; se coordina directamente por WhatsApp tras confirmar el pedido.
- **Formateo Numérico Anti-NaN**: Manejo estricto de números con comas de miles y puntos decimales.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`.
- **JS**: `js/config.js`, `js/productos-service.js`, `js/anuncios-service.js`, `js/anuncios-ui.js`, `js/cupones-service.js`, `js/cupones.js`, `js/cupones-ui.js`, `js/favoritos-service.js`, `js/whatsapp.js`, `js/productos.js`, `js/carrito.js`, `js/interfaz.js`.

---

## 5. Página: `favoritos.html` (Lista de Deseos / Wishlist)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `favoritos.html` |
| **Objetivo** | Permitir al cliente revisar los productos que ha marcado con el icono de corazón en cualquier parte de la tienda, conservando sus selecciones entre sesiones y pestañas. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Encabezado**: Título "Mis Favoritos", subtítulo descriptivo y contador de ítems guardados.
2. **Cuadrícula de Favoritos (`#favorites-products-grid`)**:
   - Muestra tarjetas completas de producto con sus precios actuales (incluyendo ofertas vigentes).
   - Botón directo para "Agregar al carrito" o "Seleccionar presentación" (en decants).
   - Botón activo de corazón para remover el producto de favoritos en tiempo real con animación de salida.
3. **Estado Vacío (`#favorites-empty-state`)**: Se activa automáticamente cuando no hay favoritos guardados o cuando se elimina el último. Contiene botón de llamada a la acción hacia `catalogo.html`.
4. **Estado de Error (`#favorites-error-state`)**: Se muestra con botón de reintento si falla la carga del catálogo.

### Comportamiento Especial
- **Sincronización Multi-Pestaña**: Escucha el evento `storage` en `window` para la clave `dunes_favoritos`. Si el usuario marca un favorito en otra pestaña, esta página se actualiza automáticamente sin requerir F5.
- **Limpieza de Huérfanos**: La función `limpiarFavoritosInexistentes(idsValidos)` depura automáticamente IDs que hayan sido eliminados del inventario de Google Sheets.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`.
- **JS**: Scripts base + `js/favoritos-service.js` + `js/favoritos-page.js`.

---

## 6. Página: `comparador.html` (Comparador Olfativo Cara a Cara)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `comparador.html` |
| **Objetivo** | Herramienta comercial exclusiva que permite a los clientes indecisos comparar dos fragancias lado a lado, examinando sus pirámides olfativas (`imagen_notas`), precios, presentaciones y agregando la elegida directamente al carrito. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Botonera de Modos (`.comparator-mode-selector`)**:
   - Dos modos mutuamente excluyentes: **Perfumes Sellados** y **Decants**.
2. **Contenedor de Comparación a 2 Columnas (`#comparador-main-container`)**:
   - **Columna Izquierda (Perfume 1)**: Mini buscador con autocompletado y dropdown flotante.
   - **Columna Derecha (Perfume 2)**: Mini buscador independiente.
3. **Ficha Olfativa Renderizada (`.comparator-card`)**:
   - Al seleccionar un producto en cualquier columna, el buscador es reemplazado por la tarjeta de ficha:
     - Marca y nombre del perfume.
     - Imagen de notas olfativas con badge interactivo "VER FICHA" que abre la imagen en Lightbox para lectura clara de ingredientes (Salida, Corazón, Fondo).
     - Botón "CAMBIAR" para volver a habilitar el buscador de esa columna.
     - Zona de compra: Selector de cantidad, precio actual/oferta y botón "AGREGAR" al carrito.
     - En modo Decants: Pills selectoras de 3 ml, 5 ml y 10 ml que recalculan el precio instantáneamente.

### Reglas de Negocio del Comparador
- **Exclusión Cruzada**: Si el usuario selecciona una fragancia en la columna izquierda, esa misma fragancia queda automáticamente excluida de los resultados de búsqueda de la columna derecha para evitar comparar un perfume contra sí mismo.
- **Filtro Estricto de Ficha**: Solo se pueden comparar productos que posean una imagen válida de notas olfativas en la columna `imagen_notas`.
- **Restricción de Dropdowns Abiertos (`verificarSingleDropdownState`)**: El sistema garantiza que nunca existan dos listas desplegables de búsqueda abiertas a la vez en la pantalla. Abrir una cierra físicamente la opuesta.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`.
- **JS**: Scripts base + `js/comparador.js`.

---

## 7. Página: `ayuda.html` (Centro de Ayuda, FAQ y Galería de Confianza)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `ayuda.html` |
| **Objetivo** | Despejar dudas de compra, responder preguntas frecuentes con buscador en vivo, y brindar pruebas sociales contundentes mediante una galería fotográfica real de entregas, envíos y decants preparados. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Buscador de Preguntas Frecuentes (`#faq-search-input`)**: Filtra dinámicamente las categorías y preguntas conforme el usuario escribe.
2. **Acordeón FAQ (`.faq-category-block`)**:
   - Categorías: Métodos de Pago, Envíos y Entregas, Decants y Autenticidad, Proceso de Compra.
   - Cada ítem se expande con animación y actualiza atributos de accesibilidad (`aria-expanded`, `aria-hidden`).
3. **Carrusel de Referencias Destacadas (`#carousel-track-container`)**:
   - Desplazamiento horizontal táctil y por flechas con contador dinámico ("1 de 8").
   - Muestra fotos de entregas reales con miniaturas optimizadas (`/thumbs/`).
4. **Modal de Galería Completa (`#all-references-modal`)**:
   - Botón "Ver todas las referencias" abre un modal con filtros por categoría (Todas, Entregas, Envíos, Decants) y cuadrícula scrollable.
5. **Visor Lightbox (`#lightbox-modal`)**:
   - Visualización en pantalla completa con soporte de teclado (Escape para cerrar, flechas izquierda/derecha para navegar entre fotos) y contador de posición.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/ayuda.css`.
- **JS**: Scripts base + `js/ayuda.js`.

---

## 8. Página: `preventa/index.html` (Landing de Preventa)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `preventa/index.html` (o `/preventa/`) |
| **Objetivo** | Presentar el catálogo exclusivo de fragancias en preventa próximas a llegar. Permitir a los clientes congelar el precio preferencial mediante un adelanto de S/ 10.00 por unidad. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Hero de Preventa**: Mensaje de exclusividad, fecha de llegada aproximada (cargada dinámicamente desde Google Sheets como texto libre, ej. "Fines de Octubre"), y explicación del modelo de separación.
2. **Modal Explicativo Inicial (`#preventa-modal`)**: Se despliega automáticamente al entrar explicando que la preventa requiere S/ 10.00 de adelanto para reservar la unidad.
3. **Barra de Filtros de Preventa**:
   - Buscador por nombre y marca.
   - Filtro por Tipo de fragancia (Árabe, Diseñador, Nicho).
   - Filtro por Género (Hombre, Mujer, Unisex).
   - Filtro por Ocasión (extraído dinámicamente de los productos cargados, soportando tags múltiples como "Citas,Noche").
   - Checkbox "Solo disponibles" y Selector de Ordenación.
4. **Cuadrícula de Preventa (`#preventa-products-grid`)**:
   - Tarjetas con imagen, marca, nombre, precio regular tachado, precio de preventa destacado, badge "Reserva con S/ 10.00", badge de estado:
     - `PREVENTA ABIERTA` (stock > 3).
     - `ÚLTIMAS RESERVAS` (stock <= 3 y stock > 0).
     - `PREVENTA CERRADA` (agotado o no disponible).
   - Botón "RESERVAR AHORA": Valida stock en `dunes_preventa_cart` y añade la unidad.
5. **Modal de Confirmación Visual (`#preventa-confirm-modal`)**: Notificación emergente elegante con desglose financiero inmediato (Adelanto requerido S/ 10 vs Saldo restante a liquidar al recibir) y botones para ir a "VER MI RESERVA" o "SEGUIR EXPLORANDO".
6. **Badge Indicador en Header y Drawer**: Muestra la cantidad total de reservas activas (`#reserva-header-count`).

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/preventa.css`.
- **JS**: `js/config.js`, `js/preventa-service.js`, `js/preventa.js`, `js/preventa-cart.js` + script inline de controlador.

---

## 9. Página: `preventa/reserva/index.html` (Checkout de Preventa)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `preventa/reserva/index.html` (o `/preventa/reserva/`) |
| **Objetivo** | Revisar las fragancias seleccionadas en preventa, ajustar cantidades según stock disponible, visualizar el resumen de adelanto obligatorio y saldo pendiente, y confirmar la reserva vía WhatsApp. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
1. **Encabezado y Drawer Móvil Aislado**: Adaptado con rutas relativas hacia la raíz (`../../`).
2. **Listado de Ítems Reservados (`#reserva-items-container`)**:
   - Tarjetas de cada perfume reservado con imagen, marca, nombre, precio preventa unitario, selector de cantidad (bloqueado al stock real en Google Sheets), cálculo de adelanto de la línea (`cantidad * 10`) y saldo restante de la línea.
   - Botón de eliminar reserva.
3. **Tarjeta de Resumen Financiero (`.reserva-summary-card`)**:
   - Total valor de compra de los productos.
   - **Adelanto para reservar** (destacado en dorado): `Total unidades * S/ 10.00`.
   - **Saldo restante al recibir**: `Total compra - Adelanto total`.
   - Explicación de método de pago: Pago de adelanto vía Yape / Plin / Transferencia para asegurar la unidad; el saldo se abona al llegar la fragancia.
4. **Botón Confirmar Reserva por WhatsApp (`#btn-confirmar-reserva-whatsapp`)**:
   - Valida que la reserva no esté vacía y que las cantidades sigan dentro del stock actual.
   - Genera mensaje profesional de WhatsApp específico de preventa (sin emojis).
5. **Estado Vacío (`#reserva-empty-state`)**: Se activa si no hay reservas guardadas en `dunes_preventa_cart`.

### Archivos Asociados
- **CSS**: `css/design-system.css`, `css/estilos.css`, `css/responsive.css`, `css/preventa.css`, `css/preventa-reserva.css`.
- **JS**: `js/config.js`, `js/preventa-service.js`, `js/preventa-cart.js`, `js/preventa-reserva.js`.

---

## 10. Página: `404.html` (Página de Error No Encontrado)

| Parámetro | Detalle |
| :--- | :--- |
| **Ruta Exacta** | `404.html` |
| **Objetivo** | Capturar rutas inválidas, informar cordialmente al usuario con la identidad de la tienda y ofrecer botones claros para volver a `index.html` o a `catalogo.html`. |
| **Estado Verificado** | **100% Funcional** |

### Secciones Visuales
- Cabecera simple con acceso a favoritos y carrito.
- Tarjeta centralizada con icono, título "PÁGINA NO ENCONTRADA", explicación y botones de acción rápida.
- Footer institucional completo.
- Directiva de indexación: `<meta name="robots" content="noindex, follow">`.
