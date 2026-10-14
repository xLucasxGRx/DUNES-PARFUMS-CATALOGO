# 06-DATOS-Y-ALMACENAMIENTO.md
# MODELOS DE DATOS, PERSISTENCIA Y ESTRUCTURAS DE INFORMACIÓN

---

## 1. Esquema de Fuentes de Información y Flujo de Datos

Dunes Parfums opera bajo un modelo **híbrido en capas**:
- **Capa 1 (CMS Principal en la Nube)**: Google Sheets público en formato CSV. Los administradores editan precios, stock, ofertas y nuevos lanzamientos directamente en la hoja de cálculo.
- **Capa 2 (Caché en Memoria)**: Una vez cargados los datos, los servicios (`ProductosService`, `PreventaService`, `CuponesService`, `AnunciosService`) conservan la información en memoria durante la sesión para evitar llamadas redundantes de red.
- **Capa 3 (Respaldo Estático Offline)**: Archivos `.json` en la carpeta `data/` (`productos.json`, `preventa.json`, `referencias.json`) que actúan como fallback automático e instantáneo si Google Sheets falla o en entornos locales/CI.
- **Capa 4 (Almacenamiento Local del Navegador)**: `localStorage` y `sessionStorage` para guardar estados de compra, favoritos y preferencias del usuario.

---

## 2. Modelos de Datos en el Código

### A. Producto del Catálogo General (Sellado)

Estructura normalizada en memoria tras el procesamiento de `ProductosService`:

```json
{
  "id": "p1",
  "nombre": "Khamrah Clasico",
  "marca": "Lattafa",
  "tipo": "ARABE",
  "categoria": "arabe",
  "formato": "sellado",
  "genero": "unisex",
  "presentacion": "100 ml",
  "precio": 180.00,
  "stock": 3,
  "disponible": true,
  "visible": true,
  "imagen": "img/productos/LattafaKhamrah.webp",
  "imagen_notas": "img/productos/LattafaKhamrah.webp",
  "descripcion": "Fragancia de lujo con notas de dátiles, praliné, canela y vainilla.",
  "destacado": true,
  "oferta": true,
  "precio_oferta": 155.00,
  "precioOferta": 155.00,
  "ocasion": "Citas,Noche",
  "orden": 1
}
```

### B. Producto del Catálogo General (Decant / Fraccionado)

```json
{
  "id": "d1",
  "nombre": "Mandarin Sky (Decant)",
  "marca": "Armaf",
  "tipo": "ARABE",
  "categoria": "arabe",
  "formato": "decant",
  "genero": "hombre",
  "presentacion": "Decants de 3, 5 y 10 ml",
  "precio": 15.00,
  "mililitrosDisponibles": 120,
  "precio_3ml": 15.00,
  "precio_5ml": 20.00,
  "precio_10ml": 30.00,
  "disponible": true,
  "visible": true,
  "imagen": "img/productos/ArmafMandarinSkyDECANTS.webp",
  "imagen_notas": "img/productos/LattafaKhamrah.webp",
  "descripcion": "Disponible en presentaciones de 3 ml, 5 ml y 10 ml. Decant extraído del perfume original.",
  "destacado": false,
  "oferta": false,
  "ocasion": "Versátil,Diario",
  "orden": 10,
  "presentaciones": [
    { "ml": 3, "nombre": "Decant 3 ml", "precio": 15.00, "disponible": true },
    { "ml": 5, "nombre": "Decant 5 ml", "precio": 20.00, "disponible": true },
    { "ml": 10, "nombre": "Decant 10 ml", "precio": 30.00, "disponible": true }
  ]
}
```

### C. Producto de Preventa (`data/preventa.json` y Google Sheets gid=1833078058)

```json
{
  "id": "prev-1",
  "nombre": "Khamrah Clasico",
  "marca": "Lattafa",
  "categoria": "arabe",
  "genero": "unisex",
  "formato_presentacion": "100 ml",
  "precio_regular": 139.00,
  "precio_preventa": 129.00,
  "stock": 5,
  "disponible": true,
  "visible": true,
  "imagen": "https://...",
  "ocasion": "Citas,Noche"
}
```

### D. Cupón de Descuento (Google Sheets gid=716279816)

```json
{
  "codigo": "TIODUNES",
  "tipo": "monto_fijo",
  "valor": 10.00,
  "montoMinimo": 0.00,
  "descuentoMaximo": null,
  "fechaInicio": "2026-01-01",
  "fechaVencimiento": "2026-12-31",
  "activo": true,
  "alcance": "todos",
  "categoriasPermitidas": [],
  "productosPermitidos": [],
  "descripcion": "Cupón de bienvenida por apertura",
  "orden": 1
}
```

### E. Referencia de Confianza (`data/referencias.json`)

```json
{
  "id": "entrega-001",
  "imagen": "assets/referencias/entregas/referenciaentrega1.jpeg",
  "alt": "Entrega realizada a un cliente de Dunes Parfums",
  "tipo": "entrega",
  "descripcion": "Pedido entregado correctamente en Tarapoto",
  "visible": true,
  "destacada": true,
  "orden": 1
}
```

---

## 3. Matriz de Almacenamiento en el Navegador (Storage Keys)

La aplicación utiliza **7 claves de almacenamiento** claramente delimitadas:

| Almacén | Clave | Tipo de Datos | Módulos que la Leen / Escriben | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| `localStorage` | `dunes_cart` | Array de Objetos JSON | `js/carrito.js`, `js/interfaz.js` | Guarda los productos agregados al carrito de compra general (sellados y decants). |
| `localStorage` | `dunes_preventa_cart` | Array de Objetos JSON | `js/preventa-cart.js`, `js/preventa-reserva.js` | Guarda las reservas de fragancias en preventa. Completamente aislado de `dunes_cart`. |
| `localStorage` | `dunes_favoritos` | Array de Strings (IDs) | `js/favoritos-service.js`, `js/favoritos-page.js` | Lista de deseos (Wishlist). Sincronizado reactivamente entre pestañas. |
| `localStorage` | `dunes_ultima_oferta_inicio` | String (ID) | `js/productos.js` | Almacena el ID de la última oferta especial mostrada en Home para forzar la rotación en la siguiente visita. |
| `localStorage` | `dunes_entrega_pref` | String | `js/interfaz.js` | Recuerda si el cliente prefiere "delivery-local", "agencia" o "recojo-local". |
| `sessionStorage` | `dunes_cupon_aplicado` | String (Código) | `js/interfaz.js`, `js/cupones-ui.js` | Guarda el código de cupón activo durante la sesión del checkout. |
| `sessionStorage` | `dunes_catalog_state` | Objeto JSON | `js/catalogo.js` | Guarda filtros de catálogo y posición vertical (`scrollY`) por hasta 2 horas. |

---

## 4. Normalización y Limpieza de Datos

El parser en `js/productos-service.js` implementa reglas de normalización para prevenir errores comunes de tipeo en Google Sheets:

1. **Booleans (`normalizarBooleano`)**:
   - `true`: `"true"`, `"1"`, `"si"`, `"sí"`, `"yes"`, `"verdadero"`, `true`.
   - `false`: `"false"`, `"0"`, `"no"`, `"falso"`, `false`, `null`, `undefined`.
2. **Números y Precios (`normalizarNumero`)**:
   - Remueve símbolos no numéricos al inicio y final (`S/`, `$`, `PEN`).
   - Identifica separadores de miles y decimales: transforma `"1,050.00"` en `1050` y `"1.050,00"` en `1050`.
3. **Géneros (`normalizarGenero`)**:
   - Remueve tildes y mapea sinónimos: `"hombre"`, `"masculino"`, `"varon"`, `"men"` $\rightarrow$ `'hombre'`.
   - `"mujer"`, `"femenino"`, `"dama"`, `"women"` $\rightarrow$ `'mujer'`.
   - `"unisex"`, `"ambos"`, `"universal"` $\rightarrow$ `'unisex'`.
4. **URLs de Imágenes (`resolverImagen`)**:
   - Soporta rutas locales (`img/productos/...`) y URLs remotas (`https://...`).
   - Bloquea esquemas peligrosos (`javascript:`, `data:`).
   - Si la ruta está vacía o es inválida, inyecta el logo institucional de respaldo: `img/logo/logohorizontaldunesparfums.png`.
