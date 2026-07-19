# Dunes Parfums - Catálogo Web Oficial

Este proyecto constituye la primera etapa del catálogo digital oficial de **Dunes Parfums**, una tienda exclusiva especializada en alta perfumería árabe, de diseñador, exclusividades de nicho y decants. 

El sitio ha sido desarrollado con estándares modernos de diseño visual premium, optimización de velocidad de carga, accesibilidad y compatibilidad 100% responsiva (Mobile First).

---

## 🛠️ Tecnologías Utilizadas

El catálogo se ha construido íntegramente como una **aplicación web estática** sin dependencias externas pesadas, asegurando un rendimiento veloz ideal para su publicación gratuita en **GitHub Pages**:

*   **HTML5 Semántico:** Estructura limpia y accesible para SEO.
*   **CSS3 Avanzado:** Diseño modular (`estilos.css`, `responsive.css` y `animaciones.css`) basado en variables y transiciones de alto impacto estético.
*   **JavaScript Puro (Vanilla JS):** Lógica nativa modularizada para cargar datos y controlar interacciones de la interfaz de manera fluida y sin bloqueos.
*   **Base de Datos en JSON:** Colección de prueba cargada asincrónicamente mediante peticiones `fetch`.

---

## 📁 Estructura del Proyecto

El código está organizado en base a la siguiente estructura modularizada:

```
DUNES-PARFUMS-CATALOGO/
│
├── index.html          # Página principal base (las 8 secciones del Home)
├── catalogo.html       # Esqueleto para la vista de listado de productos (Etapa 2)
├── producto.html       # Esqueleto para el detalle individual de fragancias (Etapa 2)
├── carrito.html        # Esqueleto para la revisión de pedido y checkout (Etapa 2)
│
├── css/
│   ├── estilos.css     # Variables, reseteo, tipografía y estilos globales
│   ├── responsive.css  # Reglas responsivas (mobile drawer, escalado móvil)
│   └── animaciones.css # Efectos hover, scroll reveal y flotación del Hero
│
├── js/
│   ├── productos.js    # Carga de datos del JSON de productos
│   ├── catalogo.js     # Declaraciones de filtrado de productos
│   ├── carrito.js      # Actualizaciones de contadores y notificaciones
│   ├── whatsapp.js     # Lógica de mensajes integrados y número de contacto
│   └── interfaz.js     # Control de menús móviles, scroll header y rendering dinámico
│
├── data/
│   └── productos.json  # Base de datos local en formato JSON
│
├── img/                # Recursos multimedia organizados
│   ├── logo/
│   ├── banners/        # Fondo y portadas del Hero
│   ├── productos/      # Imágenes individuales de fragancias en oferta
│   └── categorias/     # Portadas de las colecciones de la tienda
│
└── README.md           # Guía e información técnica del proyecto
```

---

## 🚀 Cómo Visualizar el Proyecto Localmente

1.  **Requisito de Servidor Local:** Debido a que el proyecto carga los productos dinámicamente desde `data/productos.json` usando peticiones `fetch()`, algunos navegadores bloquean estas solicitudes si abres el archivo `index.html` directamente haciendo doble clic (debido a la política de seguridad CORS para el protocolo `file://`).
2.  **Solución recomendada:**
    *   Ejecuta el proyecto utilizando un servidor web local como **Apache (XAMPP)**, colocándolo dentro de `htdocs/`.
    *   O bien, utiliza extensiones de tu editor de código como **Live Server** (en VS Code).
    *   Abre tu navegador y navega a `http://localhost/DUNES-PARFUMS-CATALOGO/` o al puerto asignado por Live Server.

---

## ✨ Características de Diseño y Funciones (Etapa 1)

*   **Identidad Visual:** Combinación de negro, blanco y acentos dorados que evocan lujo y exclusividad sin perder legibilidad comercial.
*   **Sticky Header:** Encabezado con efecto de desenfoque de fondo y borde dorado que acompaña el recorrido del usuario de forma orgánica.
*   **Menú Responsive:** Drawer lateral que se activa de forma táctil en teléfonos y tablets sin provocar desplazamiento horizontal en la página.
*   **Scroll Reveal:** Aparición progresiva de las tarjetas de productos, beneficios y categorías conforme se navega por el Home.
*   **WhatsApp Integrado:** Un módulo centralizado (`whatsapp.js`) que contiene el número de atención comercial y da soporte a los botones de consulta en tarjetas de productos y al botón flotante.
*   **Reactividad de Carrito:** Notificación toast premium animada cada vez que un usuario hace clic en "Agregar al carrito" en los productos destacados, actualizando el indicador flotante en la cabecera.
