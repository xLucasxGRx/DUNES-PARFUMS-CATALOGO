# 05-CSS-Y-DISENO.md
# SISTEMA DE DISEÑO VISUAL, CSS Y ARQUITECTURA RESPONSIVE

---

## 1. Identidad Visual y Filosofía de Diseño

Dunes Parfums proyecta una estética de **lujo contemporáneo, sobriedad y exclusividad olfativa**. El diseño se aleja de interfaces genéricas de e-commerce sobrecargadas, adoptando una composición editorial inspirada en boutiques de alta perfumería parisina y del Medio Oriente.

Los pilares visuales son:
1. **Contraste de Alto Impacto**: Fondos oscuros profundos (`#121212`, `#1A1A1A`) en el Hero, Banner y Footer, combinados con fondos crema y blanco marfil (`#FAF8F4`, `#FFFEFC`) en el catálogo y fichas de producto para máxima legibilidad comercial.
2. **Acentos Dorados Metálicos**: Uso curado de tonos dorados (`#D4AF37`, `#B18225`, degradado `#DFBA6B` a `#9E7D3B`) en botones principales, bordes, estados activos y badges de oferta.
3. **Tipografía Dual de Autor**:
   - Títulos, nombres de perfumes y encabezados editoriales: **Cormorant Garamond** (Serif clásica de lujo con gran personalidad).
   - Textos de interfaz, botones, precios y formularios: **Montserrat** (Sans-Serif geométrica de alta legibilidad en pantallas táctiles).

---

## 2. Tokens del Sistema de Diseño (`css/design-system.css`)

El archivo `css/design-system.css` centraliza todos los tokens en el pseudo-elemento `:root`:

### A. Paleta de Colores Oficial

```css
:root {
    /* Negros y Fondos Oscuros */
    --color-black: #121212;
    --color-black-soft: #1A1A1A;
    --color-bg-dark: #121212;
    --color-bg-card-dark: #1E1E1E;

    /* Dorados Oficiales */
    --color-gold: #B68A32;
    --color-gold-dark: #9A7B1C;
    --color-gold-light: #F3E5AB;
    --color-primary: #D4AF37;
    --color-gold-gradient: linear-gradient(135deg, #DFBA6B 0%, #C5A059 50%, #9E7D3B 100%);

    /* Superficies Claras del Catálogo (Boutique) */
    --catalog-background: #FAF8F4;
    --catalog-card-background: #FFFEFC;
    --catalog-text: #171717;
    --catalog-text-secondary: #6F6F6F;
    --catalog-gold: #B18225;
    --catalog-gold-border: #E7D3A5;
    --catalog-green: #159447; /* Indicador de stock disponible */

    /* Textos y Bordes */
    --color-text-primary: #1A1A1A;
    --color-text-secondary: #7A7A7A;
    --color-text-light: #FFFFFF;
    --color-border: #E5E5E5;
    --color-border-gold: rgba(212, 175, 55, 0.3);
}
```

### B. Escala Tipográfica Modular

```css
:root {
    --font-heading: 'Cormorant Garamond', Georgia, serif;
    --font-body: 'Montserrat', Arial, sans-serif;

    --text-xs: 0.75rem;     /* 12px - Badges, referencias secundarias */
    --text-sm: 0.875rem;    /* 14px - Botones compactos, descripciones */
    --text-base: 1rem;      /* 16px - Cuerpo principal */
    --text-md: 1.125rem;    /* 18px - Subtítulos */
    --text-lg: 1.25rem;     /* 20px - Precios destacados */
    --text-xl: 1.5rem;      /* 24px - Títulos de sección */
    --text-2xl: clamp(1.75rem, 3vw, 2.25rem); /* Títulos de página responsivos */
    --text-3xl: clamp(2.25rem, 5vw, 3.5rem);  /* Titular del Hero */
}
```

### C. Z-Index Jerárquico Centralizado

Para evitar conflictos donde un modal quede detrás de un menú o un toast se superponga incorrectamente, se definió la siguiente jerarquía:

| Variable | Valor | Uso en el Proyecto |
| :--- | :--- | :--- |
| `--z-dropdown` | `200` | Desplegables de búsqueda en el comparador, submenús. |
| `--z-sticky` | `900` | Encabezado principal (`header.header-main`), barra móvil fija. |
| `--z-drawer` | `1000` | Menú lateral deslizable en móviles (`nav.nav-menu.active`). |
| `--z-modal` | `1100` | Modales (`#all-references-modal`, `#cart-added-modal`, `#preventa-confirm-modal`, `#lightbox-modal`). |
| `--z-toast` | `1200` | Notificaciones toast emergentes (`#toast-container`, `.toast-premium`, `.preventa-stock-toast`). |

---

## 3. Componentes Reutilizables

### A. Botones (`.btn`)
- `.btn-primary`: Fondo dorado degradado, texto oscuro/blanco con alto contraste, sombra dorada suave en hover.
- `.btn-secondary`: Fondo oscuro elegante o crema con borde dorado fino.
- `.btn-outline`: Fondo transparente con borde metálico fino de 1px.
- `.btn-details-compact`: Botón estilizado para ver detalles sin saturar la tarjeta.
- `.decant-pill`: Pastilla interactiva para seleccionar 3 ml, 5 ml o 10 ml; estado `.is-selected` con fondo dorado y texto blanco.

### B. Tarjeta de Producto (`.product-card`)
- Fondo marfil (`#FFFEFC`), borde sutil (`#EBE6DC`), radio de 16px (`--radius-card`), sombra ligera al elevarse en hover.
- Contenedor de imagen con aspect ratio 1:1, fondo neutro claro y botón de favorito flotante en la esquina superior derecha (`.favorite-toggle-btn`).
- Badges de oferta (`.product-tag.promo-tag`) en la esquina superior izquierda.
- Indicador visual de stock (`.product-stock-status` con `.stock-dot` verde para disponible o rojo para agotado).

### C. Modales y Overlays
- `.modal-overlay`: Fondo oscuro semitransparente con `backdrop-filter: blur(4px)`.
- Bloqueo de desplazamiento del documento cuando un modal está activo mediante la clase `body.no-scroll`.

---

## 4. Breakpoints y Arquitectura Responsive (`css/responsive.css`)

El archivo `css/responsive.css` (184 KB) gestiona minuciosamente la experiencia desde pantallas ultra-pequeñas hasta monitores ultrapanorámicos:

```
  320px         480px         768px         992px        1024px        1440px
────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼───►
  Móvil        Móvil         Tablet        Desktop       Laptop        Monitor
 Ultra-Small  Estándar      Vertical       Drawer OFF    Estándar      Grande
```

### Reglas Clave por Dispositivo:

1. **Smartphones Pequeños (`max-width: 480px`)**:
   - Cabecera compactada: logo ajustado a altura máxima de 32px.
   - Grilla del catálogo: 2 columnas compactas con padding interno reducido para maximizar la cantidad de perfumes visibles por pantalla.
   - Activación obligatoria de la barra de compra fija inferior en detalle de producto (`.mobile-purchase-bar`) y en carrito (`#mobile-checkout-bar`).

2. **Smartphones y Tablets (`max-width: 991px`)**:
   - La navegación de escritorio desaparece.
   - Se activa el **Slide-Over Drawer Lateral** (`nav.nav-menu`): panel que emerge desde la derecha con animación fluida, cubriendo el 85% del ancho de pantalla.
   - Se activa el acordeón de subcategorías dentro del menú móvil.
   - Las 3 columnas del footer se convierten en acordeones colapsables (`.footer-accordion-btn`).

3. **Escritorio y Laptops (`min-width: 992px` y `min-width: 1024px`)**:
   - Menú horizontal visible con submenú desplegable en hover.
   - Grilla del catálogo en 4 columnas simétricas.
   - Carrito en formato de tabla completa de doble columna (ítems a la izquierda, resumen de totales a la derecha).

4. **Accesibilidad y Movimiento Reducido (`prefers-reduced-motion: reduce`)**:
   - Desactiva animaciones de rotación continua, transiciones de scroll reveal y efectos parallax para usuarios con sensibilidad vestibular.

---

## 5. Hojas de Estilo Especializadas por Módulo

Para no sobrecargar `estilos.css`, los módulos complejos cuentan con archivos CSS exclusivos:

1. **`css/ayuda.css` (21.2 KB)**:
   - Controla el diseño del acordeón de FAQ, la caja de búsqueda, el carrusel táctil de referencias (`#carousel-track-container`), la cuadrícula modal y el visor Lightbox.
2. **`css/preventa.css` (78.5 KB)**:
   - Diseño exclusivo para la landing de preventa: banners dorados oscuros, modal explicativo con backdrop, badges de estado de preventa (`.status-cerrada`, `.status-abierta`, `.status-ultimas`), cards de preventa y modal de confirmación de reserva con desglose de adelanto.
3. **`css/preventa-reserva.css` (27.6 KB)**:
   - Vista de revisión de reserva: tabla de separación, tarjeta de resumen con separación de adelanto (S/ 10.00) y saldo pendiente destacado en dorado.
4. **`css/animaciones.css` (5.6 KB)**:
   - Keyframes: `@keyframes badgePop`, `@keyframes cartIconPulse`, `@keyframes skeletonPulse`, `@keyframes fadeIn`, `@keyframes slideInRight`.

---

## 6. Reglas Críticas para Mantener la Identidad Visual

Para cualquier desarrollo posterior con ChatGPT u otra IA, deben seguirse estrictamente estas reglas:

1. **No usar colores puros saturados**: Nunca aplicar `red`, `blue`, `#000000` puro o `#FFFF00`. Usar siempre los tokens del Design System (`--color-black`, `--color-gold`, `--color-text-primary`).
2. **No romper la dualidad tipográfica**: Todos los títulos deben usar `var(--font-heading)` (`Cormorant Garamond`). Todos los controles interactivos y textos de lectura deben usar `var(--font-body)` (`Montserrat`).
3. **No alterar los Z-Index de forma arbitraria**: Si se crea un nuevo modal o dropdown, debe respetar las variables `--z-dropdown`, `--z-modal` o `--z-toast` para evitar que quede oculto detrás de la barra sticky o el drawer.
4. **Respetar los Breakpoints Oficiales**:
   - Corte de menú móvil: `991px` / `992px`.
   - Corte de grilla móvil a tablet: `480px` y `768px`.
