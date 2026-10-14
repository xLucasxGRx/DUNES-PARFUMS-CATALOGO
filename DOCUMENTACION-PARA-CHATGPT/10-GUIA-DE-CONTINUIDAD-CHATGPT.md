# 10 - GUÍA MAESTRA DE CONTINUIDAD PARA CHATGPT / AGENTES IA

> **ATENCIÓN AGENTE IA / CHATGPT:**  
> Estás recibiendo el repositorio de **DUNES PARFUMS**, un e-commerce en producción de alta perfumería (perfumes completos de diseñador/nicho y decants fraccionados de 3ml, 5ml y 10ml) en San Martín, Perú.  
> Esta guía fue redactada por un Arquitecto de Software Senior y Auditor de Código para orientarte paso a paso.  
> **Tu objetivo primordial es preservar el funcionamiento existente, entender las dependencias críticas y no introducir cambios destructivos ni suposiciones no verificadas.**

---

## 1. CONTEXTO ESENCIAL QUE DEBES MEMORIZAR

1. **Sin Backend (JAMstack Puro):**
   - No hay Node.js ni PHP en ejecución en el servidor de producción. Se aloja en **GitHub Pages** (`https://dunesparfums.com/`).
   - Todo corre en el navegador del cliente con **JavaScript ES6+ Vanilla**, **HTML5 Semántico** y **CSS3 Puro**.
   - No sugieras crear endpoints de API backend ni instalar librerías pesadas en tiempo de ejecución a menos que el cliente lo pida expresamente.
2. **Google Sheets como Headless CMS:**
   - Los datos se obtienen de Google Sheets exportados en CSV. Si la red falla o Google bloquea la solicitud, el sistema recurre a archivos locales en `data/` (`productos.json`, `preventa.json`, `referencias.json`).
3. **Flujo de Pago WhatsApp (Sin Pasarela Bancaria):**
   - El checkout recopila datos del cliente, método de entrega (San Martín con zonificación local, agencia nacional o recojo en tienda) y genera un mensaje con formato limpio a `https://wa.me/51986510573`.
   - **Regla de oro:** No uses emojis en el string de WhatsApp generado por código.
4. **Catálogo Dual (Botellas Selladas vs. Decants):**
   - Un perfume sellado descuenta unidades de `STOCK`.
   - Un decant descuenta capacidad de `mililitrosDisponibles` (3ml, 5ml, 10ml). Varias presentaciones del mismo perfume comparten los mismos mililitros.
5. **Preventa Totalmente Independiente:**
   - La preventa vive en `/preventa/` y `/preventa/reserva/`. No toca `dunes_carrito` ni las colecciones regulares. Usa `dunes_preventa_cart` y cobra un adelanto fijo de S/ 10.00 por unidad.

---

## 2. CONVENCIONES DE PROGRAMACIÓN EXISTENTES

Cuando agregues o modifiques código, **imita con exactitud** las convenciones ya presentes en el proyecto:

### A. JavaScript
- **Variables y Funciones:** `camelCase` (ej. `cargarProductosCatalogo()`, `actualizarTotalesCarrito()`).
- **Constantes de Configuración:** `SCREAMING_SNAKE_CASE` (ej. `ZONAS_TARAPOTO`, `COSTO_ENVIO_NACIONAL`).
- **Claves de Almacenamiento:** Prefijadas con `dunes_` (ej. `dunes_carrito`, `dunes_favoritos`, `dunes_comparador`).
- **Nombres en Objetos de Datos:** Manejar indistintamente `snake_case` y `camelCase` mediante operador coalescente nulo (`prod.precio_oferta ?? prod.precioOferta ?? prod.precio`).
- **Módulos / Scopes:** Los módulos se exponen como objetos globales en `window` (ej. `window.serviciosDatos`, `window.gestorFiltros`). No uses sintaxis de módulos ES6 (`import/export`) en archivos que se cargan vía etiquetas `<script>` normales sin `type="module"`.
- **Manejo Asíncrono:** Usar `async/await` con bloques `try/catch` rigurosos que garanticen fallbacks en lugar de romper la ejecución.

### B. CSS y Diseño
- **Variables CSS:** Siempre utilizar los tokens definidos en `css/design-system.css` (`var(--dunes-gold)`, `var(--dunes-bg-primary)`, `var(--dunes-font-primary)`, etc.).
- **Nomenclatura BEM Simplificada:** Clases tipo `.producto-card`, `.producto-card__imagen`, `.producto-card--destacado`.
- **Diseño Mobile-First:** Breakpoints en `768px` (tablets/laptops) y `1024px` (desktop grande).
- **Evitar `!important`:** Existen ya suficientes reglas de alta especificidad en `css/responsive.css`; no agregues más a menos que sea estrictamente necesario para sobreescribir estilos en línea de librerías de terceros.

---

## 3. ARCHIVOS CRÍTICOS Y MAPA DE PRECAUCIÓN

Antes de tocar cualquier archivo, consulta esta tabla para saber qué impacto tendrás:

| Archivo que vas a editar | Qué debes revisar ANTES de guardar | Archivos que podrían romperse |
| :--- | :--- | :--- |
| `js/interfaz.js` | Identificar si estás tocando selectores globales (`.modal`, `.drawer-menu`, etc.) | Todas las páginas HTML (afecta navegación global, modales y drawer móvil). |
| `js/carrito.js` | Verificar la matriz de zonas de San Martín y la lógica de validación de cupones | `carrito.html` y los botones "Agregar al Carrito" de todas las páginas. |
| `js/servicios.js` | Comprobar que no se altere la estructura normalizada devuelta por `cargarProductos()` | `catalogo.html`, `producto.html`, `comparador.html`, `favoritos.html`. |
| `data/productos.json` | Verificar la validez de sintaxis JSON y nombres de campos (IDs únicos requeridos) | Toda la tienda si la red falla o en desarrollo local. |
| `css/design-system.css` | Verificar si alteras variables globales de color o espaciado | Toda la interfaz visual en todas las resoluciones. |

---

## 4. CHECKLIST OBLIGATORIO ANTES DE PROPONER O ESCRIBIR CÓDIGO

Antes de responder al usuario con código nuevo o modificaciones, repasa mentalmente este checklist:

- [ ] **1. ¿He comprobado si la función ya existe?**  
  (Revisa `DOCUMENTACION-PARA-CHATGPT/11-INDICE-DE-CODIGO.md` para evitar duplicar formateadores de precio, normalizadores de texto o selectores).
- [ ] **2. ¿He verificado el selector DOM?**  
  (Asegúrate de que los IDs o clases HTML existan en la página destino y no asumas que todas las páginas tienen el mismo markup).
- [ ] **3. ¿Mantiene la compatibilidad con el fallback offline?**  
  (Cualquier llamada a un servicio debe tener su bloque `catch` que retorne datos locales o muestre un mensaje amigable al usuario).
- [ ] **4. ¿Funciona en dispositivos móviles?**  
  (Dunes Parfums tiene más del 70% de tráfico desde teléfonos inteligentes; cualquier modal o tabla debe adaptarse a pantallas de 360px de ancho).
- [ ] **5. ¿Rompe los tests existentes?**  
  (Ejecuta `node --test tests/*.test.js` en tu entorno si tienes terminal, o asegúrate de que tus cambios no alteren las firmas de las funciones testeadas).

---

## 5. CÓMO AGREGAR NUEVAS FUNCIONALIDADES (RECETAS PASO A PASO)

### Caso A: Agregar un nuevo filtro en el catálogo
1. Agregar el elemento HTML con su respectivo `data-filter` o `id` en `catalogo.html`.
2. Registrar el listener de cambio en `js/filtros.js` dentro de `inicializarFiltros()`.
3. Incorporar el predicado de filtrado en `aplicarFiltros()` asegurando que sea acumulativo (AND) con los filtros existentes.
4. Si el filtro requiere nuevos campos en los datos, actualizar el mapeo en `js/servicios.js` y verificar que tenga un valor por defecto si el CSV no lo incluye.
5. Ejecutar `node --test tests/decants-filter.test.js`.

### Caso B: Modificar un costo de envío o zona
1. Abrir `js/carrito.js`.
2. Ubicar la constante `ZONAS_TARAPOTO` o `COSTO_ENVIO_NACIONAL`.
3. Ajustar el monto numérico respetando la estructura `{ id: 'nombre', nombre: 'Etiqueta', costo: 15.00 }`.
4. Ejecutar `node --test tests/cart-core.test.js` y `node --test tests/free-shipping-threshold.test.js`.

### Caso C: Crear una nueva página HTML interna
1. Copiar la estructura del `<header>` y `<footer>` de `catalogo.html` o `ayuda.html` para mantener consistencia de navegación y drawer móvil.
2. Incluir en el `<head>`: `css/design-system.css`, `css/estilos.css`, `css/responsive.css` y `css/animaciones.css`.
3. Cargar los scripts necesarios al final del `<body>` en el orden correcto:
   1. `js/servicios.js` (si usa datos)
   2. `js/interfaz.js` (para UI global y drawer)
   3. Script específico de la nueva página (ej. `js/nueva-pagina.js`).
4. Probar que el drawer móvil y el contador del carrito se actualicen al cargar.

---

## 6. PROBLEMAS CONOCIDOS QUE DEBES RESOLVER O EVITAR

1. **Monolito `interfaz.js`:** Es muy grande (4,603 líneas). Si vas a agregar una funcionalidad pequeña, es preferible crear un script auxiliar dedicado en lugar de inflar más este archivo, o refactorizarlo con sumo cuidado.
2. **Duplicación de Parsers CSV:** Existen 4 funciones que parsean CSV. Si el cliente pide mejorar el parser, sugiérele unificarlo en un archivo `js/utils-parser.js`.
3. **Filtros en `favoritos.html` Incompletos:** La UI tiene botones de género que no filtran los favoritos guardados. Si el usuario te pide arreglar favoritos, esa es la tarea pendiente.
4. **Recomendaciones de IA en `producto.html`:** El contenedor `#recomendados-ia` está estático o vacío en la vista de detalle. Conectarlo con productos de la misma marca o familia olfativa es un trabajo de alto valor.

---

## 7. PREGUNTAS CLAVE PARA EL PROPIETARIO ANTES DE CAMBIOS MAYORES

Si el usuario te solicita cambios estructurales, hazle estas preguntas estratégicas antes de codificar:

1. *"¿Planeas migrar a un backend propio o prefieres seguir utilizando Google Sheets como gestor de contenido gratuito?"*
2. *"¿Deseas implementar una pasarela de pago bancaria automática (ej. MercadoPago / Niubiz / Culqi) o se mantendrá el cierre de ventas exclusivo por WhatsApp?"*
3. *"¿Deseas que los decants de un mismo perfume compartan stock con el frasco completo o que sigan teniendo bolsas de inventario separadas como hasta ahora?"*
4. *"¿Podemos proceder a modularizar `js/interfaz.js` en archivos más pequeños para facilitar el mantenimiento a futuro?"*

---

## 8. REFERENCIA CRUZADA A LA DOCUMENTACIÓN COMPLETA

Para profundizar en cualquier aspecto específico, lee los archivos complementarios ubicados en `DOCUMENTACION-PARA-CHATGPT/`:

- `00-RESUMEN-MAESTRO.md`: Visión ejecutiva y arquitectónica integral.
- `01-ESTRUCTURA-ARQUITECTURA.md`: Árbol exhaustivo de archivos y dependencias.
- `02-PAGINAS-Y-NAVEGACION.md`: Radiografía detallada de las 10 páginas HTML.
- `03-MODULOS-Y-FUNCIONALIDADES.md`: Funcionamiento interno de cada subsistema.
- `04-JAVASCRIPT-Y-EVENTOS.md`: Análisis técnico de funciones, scopes y listeners.
- `05-CSS-Y-DISENO.md`: Sistema de diseño, tokens, breakpoints y animaciones.
- `06-DATOS-Y-ALMACENAMIENTO.md`: Esquemas JSON, CSV y claves de localStorage.
- `07-FLUJOS-DE-USUARIO.md`: Recorridos funcionales paso a paso.
- `08-ERRORES-RIESGOS-Y-PENDIENTES.md`: Hallazgos de auditoría con evidencia en código.
- `09-HOJA-DE-RUTA.md`: Plan técnico y prioridades de desarrollo futuro.
- `11-INDICE-DE-CODIGO.md`: Diccionario de funciones, variables y selectores DOM.
