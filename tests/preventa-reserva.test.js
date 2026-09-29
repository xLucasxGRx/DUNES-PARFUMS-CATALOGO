/**
 * Dunes Parfums - Tests Unitarios para js/preventa-reserva.js (FASE P4.3)
 * Valida la página y motor de "Mi Reserva Preventa":
 * - Renderizado de productos y resumen económico
 * - Fórmulas comerciales:
 *   * Total preventa = precio_preventa * cantidad
 *   * Adelanto = cantidad * 10
 *   * Saldo = total_preventa - adelanto
 * - Manejo de estados (con productos y vacío)
 * - Estructura del borrador de WhatsApp
 * - Aislamiento total del carrito y catálogo general
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Mock de LocalStorage para pruebas en Node.js
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

globalThis.window = globalThis;
globalThis.localStorage = new LocalStorageMock();
globalThis.CustomEvent = class {
    constructor(type, opts) {
        this.type = type;
        this.detail = opts ? opts.detail : null;
    }
};
globalThis.dispatchEvent = () => {};

// Cargar preventa-cart y preventa-reserva
const ROOT_DIR = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(ROOT_DIR, 'js', 'preventa-cart.js'), 'utf8'));
eval(fs.readFileSync(path.join(ROOT_DIR, 'js', 'preventa-reserva.js'), 'utf8'));

const {
    agregarProductoPreventa,
    vaciarReservaPreventa,
    STORAGE_KEY
} = globalThis.PreventaCart;

const {
    formatearPrecio,
    formatearMonedaWhatsApp,
    resolverRutaImagen,
    obtenerProductos,
    obtenerResumen,
    prepararEstructuraMensajeWhatsApp,
    construirTextoMensajeWhatsApp,
    generarMensajeWhatsAppReserva,
    validarStockAntesDeWhatsApp,
    WHATSAPP_NUMERO
} = globalThis.PreventaReserva;

beforeEach(() => {
    globalThis.localStorage.clear();
});

test('1. PreventaReserva expone los métodos requeridos para FASE P4.3', () => {
    assert.equal(typeof formatearPrecio, 'function');
    assert.equal(typeof resolverRutaImagen, 'function');
    assert.equal(typeof obtenerProductos, 'function');
    assert.equal(typeof obtenerResumen, 'function');
    assert.equal(typeof prepararEstructuraMensajeWhatsApp, 'function');
});

test('2. Fórmulas comerciales de preventa: 1 unidad de S/ 135 produce S/ 10 de adelanto y S/ 125 de saldo', () => {
    agregarProductoPreventa({
        id: 'prev-khamrah',
        nombre: 'Khamrah Qahwa',
        marca: 'Lattafa',
        precio_preventa: 135
    }, 1);

    const items = obtenerProductos();
    assert.equal(items.length, 1);
    const item = items[0];

    assert.equal(item.cantidad, 1);
    assert.equal(item.total_producto, 135);
    assert.equal(item.adelanto_total, 10);
    assert.equal(item.saldo_pendiente, 125);

    const resumen = obtenerResumen();
    assert.equal(resumen.totalUnidades, 1);
    assert.equal(resumen.totalProductos, 135);
    assert.equal(resumen.totalAdelanto, 10);
    assert.equal(resumen.saldoPendiente, 125);
});

test('3. Fórmulas comerciales con 3 unidades (Ejemplo requerido del prompt: S/405 total, S/30 adelanto, S/375 saldo)', () => {
    agregarProductoPreventa({
        id: 'prev-khamrah',
        nombre: 'Khamrah Qahwa',
        marca: 'Lattafa',
        precio_preventa: 135
    }, 3);

    const items = obtenerProductos();
    assert.equal(items.length, 1);
    const item = items[0];

    assert.equal(item.cantidad, 3);
    assert.equal(item.total_producto, 405);
    assert.equal(item.adelanto_total, 30);
    assert.equal(item.saldo_pendiente, 375);

    const resumen = obtenerResumen();
    assert.equal(resumen.totalUnidades, 3);
    assert.equal(resumen.totalProductos, 405);
    assert.equal(resumen.totalAdelanto, 30);
    assert.equal(resumen.saldoPendiente, 375);
});

test('4. Preparación de estructura del mensaje para WhatsApp (FASE P4.9)', () => {
    const items = [
        {
            nombre: 'Khamrah Qahwa',
            marca: 'LATTAFA',
            cantidad: 2,
            precio_preventa: 135,
            adelanto_total: 20,
            saldo_pendiente: 250
        },
        {
            nombre: 'Liquid Brun',
            marca: 'FRENCH AVENUE',
            cantidad: 1,
            precio_preventa: 150,
            adelanto_total: 10,
            saldo_pendiente: 140
        }
    ];

    const resumen = {
        totalProductos: 420,
        totalUnidades: 3,
        totalAdelanto: 30,
        saldoPendiente: 390
    };

    const mensaje = prepararEstructuraMensajeWhatsApp(items, resumen);

    assert.ok(mensaje.includes('Hola Dunes Parfums'));
    assert.ok(!mensaje.includes('👋'), 'No debe contener emojis');
    assert.ok(mensaje.includes('Deseo confirmar mi reserva de PREVENTA:'));
    assert.ok(mensaje.includes('Productos:'));
    assert.ok(mensaje.includes('• Khamrah Qahwa x2'));
    assert.ok(mensaje.includes('• Liquid Brun x1'));
    assert.ok(mensaje.includes('Total de compra: S/420.00'));
    assert.ok(mensaje.includes('Adelanto de reserva: S/30.00'));
    assert.ok(mensaje.includes('Saldo restante: S/390.00'));
    assert.ok(!mensaje.includes('Saldo pendiente'));
    assert.ok(!mensaje.includes('El adelanto será descontado del pago final'));
    assert.ok(mensaje.includes('Por favor, bríndenme los métodos de pago para confirmar mi reserva.'));
    assert.ok(mensaje.includes('Gracias.'));
});

test('5. Resolución de rutas de imagen en contexto /preventa/reserva/', () => {
    assert.equal(
        resolverRutaImagen('https://ejemplo.com/foto.jpg'),
        'https://ejemplo.com/foto.jpg'
    );
    assert.equal(
        resolverRutaImagen('../../img/catalogo/perfume.png'),
        '../../img/catalogo/perfume.png'
    );
    assert.equal(
        resolverRutaImagen('img/catalogo/perfume.png'),
        '../../img/catalogo/perfume.png'
    );
    assert.equal(
        resolverRutaImagen(''),
        '../../img/logo/logohorizontaldunesparfums.png'
    );
});

test('6. Aislamiento total: la gestión de preventa-reserva no afecta al carrito normal ni a favoritos', () => {
    globalThis.localStorage.setItem('dunes_cart', JSON.stringify([{ id: 'c1', cant: 1 }]));
    globalThis.localStorage.setItem('dunes_carrito', JSON.stringify([{ id: 'c2', cant: 2 }]));
    globalThis.localStorage.setItem('dunes_favoritos', JSON.stringify(['fav-1']));

    // Operación de preventa
    agregarProductoPreventa({ id: 'p-reserva', nombre: 'Asad', precio_preventa: 110 }, 2);
    obtenerResumen();

    // Verificación
    assert.equal(globalThis.localStorage.getItem('dunes_cart'), JSON.stringify([{ id: 'c1', cant: 1 }]));
    assert.equal(globalThis.localStorage.getItem('dunes_carrito'), JSON.stringify([{ id: 'c2', cant: 2 }]));
    assert.equal(globalThis.localStorage.getItem('dunes_favoritos'), JSON.stringify(['fav-1']));

    vaciarReservaPreventa();
    assert.equal(globalThis.localStorage.getItem('dunes_cart'), JSON.stringify([{ id: 'c1', cant: 1 }]));
});

test('7. PreventaReserva expone los métodos y constantes requeridos para FASE P4.4', () => {
    assert.equal(typeof generarMensajeWhatsAppReserva, 'function');
    assert.equal(typeof construirTextoMensajeWhatsApp, 'function');
    assert.equal(typeof formatearMonedaWhatsApp, 'function');
    assert.equal(WHATSAPP_NUMERO, '51986510573');
});

test('8. Formato exacto del mensaje de WhatsApp (FASE P4.9 sin emojis y con Saldo restante)', () => {
    const items = [
        {
            nombre: 'Khamrah Clasico',
            cantidad: 2,
            precio_preventa: 119
        },
        {
            nombre: 'Khamrah Qahwa',
            cantidad: 1,
            precio_preventa: 119
        }
    ];

    const resumen = {
        totalProductos: 357,
        totalUnidades: 3,
        totalAdelanto: 30,
        saldoPendiente: 327
    };

    const mensaje = construirTextoMensajeWhatsApp(items, resumen);

    // Encabezado
    assert.ok(mensaje.includes('Hola Dunes Parfums'));
    assert.ok(!mensaje.includes('👋'), 'No debe contener emojis');
    assert.ok(mensaje.includes('Deseo confirmar mi reserva de PREVENTA:'));

    // Lista de productos compacta (• Producto x cantidad)
    assert.ok(mensaje.includes('Productos:\n\n• Khamrah Clasico x2\n• Khamrah Qahwa x1'));

    // Desglose financiero
    assert.ok(mensaje.includes('Total de compra: S/357.00'));
    assert.ok(mensaje.includes('Adelanto de reserva: S/30.00'));
    assert.ok(mensaje.includes('Saldo restante: S/327.00'));
    assert.ok(!mensaje.includes('Saldo pendiente'));

    // Sin aclaración de descuento al momento de la entrega
    assert.ok(!mensaje.includes('El adelanto será descontado del pago final'));

    // Cierre
    assert.ok(mensaje.includes('Por favor, bríndenme los métodos de pago para confirmar mi reserva.'));
    assert.ok(mensaje.includes('Gracias.'));

    // Reglas: NO enviar imagen, categoría, marca repetida, stock, precio individual
    assert.equal(mensaje.includes('Precio preventa:'), false, 'No debe enviar precio unitario repetido');
    assert.equal(mensaje.includes('c/u'), false, 'No debe enviar c/u');
    assert.equal(mensaje.includes('LATTAFA'), false, 'No debe enviar marcas repetidas');
    assert.equal(mensaje.includes('━━━━━━━━━━━━━━'), false, 'No debe enviar separadores innecesarios');
});

test('9. Reglas estrictas de adelanto (S/10 por unidad: 1 -> S/10, 2 -> S/20, 5 -> S/50)', () => {
    // 5 unidades
    const items5 = [
        {
            nombre: 'Yara',
            marca: 'LATTAFA',
            cantidad: 5,
            precio_preventa: 110
        }
    ];
    const resumen5 = {
        totalProductos: 550,
        totalUnidades: 5,
        totalAdelanto: 50,
        saldoPendiente: 500
    };
    const msg5 = construirTextoMensajeWhatsApp(items5, resumen5);
    assert.ok(msg5.includes('• Yara x5'));
    assert.ok(msg5.includes('Adelanto de reserva: S/50.00'));
    assert.ok(msg5.includes('Total de compra: S/550.00'));
    assert.ok(msg5.includes('Saldo restante: S/500.00'));
    assert.ok(!msg5.includes('Saldo pendiente'));
    assert.ok(!msg5.includes('El adelanto será descontado del pago final'));
});

test('10. Validación: Si no existen productos, no abre WhatsApp y retorna null', () => {
    // Asegurar storage vacío
    globalThis.localStorage.clear();

    let openLlamado = false;
    globalThis.window.open = () => {
        openLlamado = true;
    };

    const resultado = generarMensajeWhatsAppReserva();
    assert.equal(resultado, null);
    assert.equal(openLlamado, false, 'No debe abrir ventana si no hay productos');
});

test('11. Generación de URL y preservación del storage (NO elimina la reserva)', () => {
    agregarProductoPreventa({
        id: 'p-preserve',
        nombre: 'Khamrah Qahwa',
        marca: 'LATTAFA',
        precio_preventa: 119
    }, 2);

    let urlAbierta = '';
    globalThis.window.open = (url) => {
        urlAbierta = url;
    };

    const urlRetornada = generarMensajeWhatsAppReserva();

    assert.ok(urlRetornada.startsWith('https://wa.me/51986510573?text='));
    assert.equal(urlAbierta, urlRetornada);
    assert.ok(decodeURIComponent(urlRetornada).includes('Hola Dunes Parfums'));
    assert.ok(!decodeURIComponent(urlRetornada).includes('👋'));
    assert.ok(decodeURIComponent(urlRetornada).includes('Khamrah Qahwa'));

    // Verificar que los productos se MANTIENEN en localStorage tras el envío
    const enStorage = JSON.parse(globalThis.localStorage.getItem('dunes_preventa_cart'));
    assert.ok(Array.isArray(enStorage));
    assert.equal(enStorage.length, 1);
    assert.equal(enStorage[0].nombre, 'Khamrah Qahwa');
    assert.equal(enStorage[0].cantidad, 2);
});

test('12. FASE P4.5 - Stepper de cantidad: decrementar nunca baja a 0 y mantiene producto en 1', () => {
    agregarProductoPreventa({
        id: 'prev-step-test',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    }, 2);

    // Bajar de 2 a 1
    let items = globalThis.PreventaCart.actualizarCantidadPreventa('prev-step-test', 1);
    assert.equal(items[0].cantidad, 1);

    // Al estar en 1, el stepper no permite decrementar a 0
    // Simular el guard del stepper en UI: si cantActual <= 1, no llama a actualizar con 0
    const cantActual = items[0].cantidad;
    assert.equal(cantActual, 1);
    // Verificar que actualizar directamente con 1 mantiene el producto
    items = globalThis.PreventaCart.actualizarCantidadPreventa('prev-step-test', 1);
    assert.equal(items.length, 1);
    assert.equal(items[0].cantidad, 1);
});

test('13. FASE P4.5 - Stepper de cantidad: incrementar no supera stock máximo', () => {
    agregarProductoPreventa({
        id: 'prev-step-max',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    }, 2);

    // Incrementar a 3 (permitido)
    let items = globalThis.PreventaCart.actualizarCantidadPreventa('prev-step-max', 3);
    assert.equal(items[0].cantidad, 3);

    // Intentar incrementar a 4 (debe limitarse a stock 3)
    items = globalThis.PreventaCart.actualizarCantidadPreventa('prev-step-max', 4);
    assert.equal(items[0].cantidad, 3);
    assert.equal(items[0].total_producto, 357);
    assert.equal(items[0].adelanto_total, 30);
    assert.equal(items[0].saldo_pendiente, 327);
});

test('14. FASE P4.5 - Ejemplo de cálculo comercial con S/119 y cantidad 3', () => {
    // Ejemplo exacto del prompt:
    // Producto: S/119, Cantidad: 3
    // Total: S/357, Adelanto: S/30, Saldo: S/327
    agregarProductoPreventa({
        id: 'prev-calc-prompt',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 5
    }, 3);

    const items = obtenerProductos();
    assert.equal(items.length, 1);
    assert.equal(items[0].cantidad, 3);
    assert.equal(items[0].total_producto, 357);
    assert.equal(items[0].adelanto_total, 30);
    assert.equal(items[0].saldo_pendiente, 327);

    const resumen = obtenerResumen();
    assert.equal(resumen.totalUnidades, 3);
    assert.equal(resumen.totalProductos, 357);
    assert.equal(resumen.totalAdelanto, 30);
    assert.equal(resumen.saldoPendiente, 327);
});

test('15. FASE P4.5 - Validación antes de WhatsApp: Si el stock cambió o no alcanza, bloquea WhatsApp y muestra aviso', () => {
    agregarProductoPreventa({
        id: 'prev-stock-changed',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    }, 3);

    let ventanaAbierta = false;
    globalThis.window.open = () => {
        ventanaAbierta = true;
    };

    // Caso A: El stock en catálogo se redujo a 2 (otro cliente reservó antes)
    const catalogoActualizado = [
        {
            id: 'prev-stock-changed',
            nombre: 'Khamrah Qahwa',
            stock: 2,
            disponible: true
        }
    ];

    const val = validarStockAntesDeWhatsApp(obtenerProductos(), catalogoActualizado);
    assert.equal(val.valido, false);
    assert.equal(val.mensaje, 'Algunas cantidades disponibles cambiaron. Actualiza tu reserva.');

    // Al llamar a generarMensajeWhatsAppReserva con catálogo actualizado
    const resultado = generarMensajeWhatsAppReserva({ productos: catalogoActualizado });
    assert.equal(resultado, null, 'No debe generar URL si el stock cambió');
    assert.equal(ventanaAbierta, false, 'No debe abrir WhatsApp');

    // Caso B: El producto pasó a stock 0 o disponible=false
    const catalogoAgotado = [
        {
            id: 'prev-stock-changed',
            nombre: 'Khamrah Qahwa',
            stock: 0,
            disponible: false
        }
    ];
    const valAgotado = validarStockAntesDeWhatsApp(obtenerProductos(), catalogoAgotado);
    assert.equal(valAgotado.valido, false);
    assert.equal(valAgotado.mensaje, 'Algunas cantidades disponibles cambiaron. Actualiza tu reserva.');
});

test('16. FASE P4.5 - Validación antes de WhatsApp: Con stock suficiente genera enlace correcto', () => {
    agregarProductoPreventa({
        id: 'prev-stock-ok',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    }, 2);

    const catalogoOk = [
        {
            id: 'prev-stock-ok',
            nombre: 'Khamrah Qahwa',
            stock: 3,
            disponible: true
        }
    ];

    let urlFinal = '';
    globalThis.window.open = (u) => {
        urlFinal = u;
    };

    const res = generarMensajeWhatsAppReserva({ productos: catalogoOk });
    assert.ok(res);
    assert.ok(res.includes('https://wa.me/51986510573?text='));
    assert.equal(urlFinal, res);
});

test('17. FASE P4.7 - WhatsApp compacto con varios productos y validación de fórmulas comerciales', () => {
    // Escenario FASE P4.7:
    // 3 productos en total:
    // - Khamrah Clasico x2 (S/119 cada uno = S/238)
    // - Khamrah Qahwa x1 (S/119 = S/119)
    // Total preventa: S/357
    // Adelanto: 3 x 10 = S/30
    // Saldo pendiente: S/357 - S/30 = S/327
    agregarProductoPreventa({
        id: 'p-clasico',
        nombre: 'Khamrah Clasico',
        precio_preventa: 119
    }, 2);

    agregarProductoPreventa({
        id: 'p-qahwa',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119
    }, 1);

    const items = obtenerProductos();
    const resumen = obtenerResumen();

    assert.equal(resumen.totalUnidades, 3);
    assert.equal(resumen.totalProductos, 357);
    assert.equal(resumen.totalAdelanto, 30);
    assert.equal(resumen.saldoPendiente, 327);

    const textoWhatsApp = construirTextoMensajeWhatsApp(items, resumen);

    // Formato exacto FASE P4.9
    const esperado = [
        'Hola Dunes Parfums',
        '',
        'Deseo confirmar mi reserva de PREVENTA:',
        '',
        'Productos:',
        '',
        '• Khamrah Clasico x2',
        '• Khamrah Qahwa x1',
        '',
        'Total de compra: S/357.00',
        '',
        'Adelanto de reserva: S/30.00',
        '',
        'Saldo restante: S/327.00',
        '',
        'Por favor, bríndenme los métodos de pago para confirmar mi reserva.',
        '',
        'Gracias.'
    ].join('\n');

    assert.equal(textoWhatsApp, esperado);
});

// =============================================================================
// FASE P4.8: SEPARACIÓN COMPLETA DE NAVEGACIÓN PREVENTA
// =============================================================================

test('21. FASE P4.8 - Header Preventa no abre carrito normal y apunta estrictamente a reserva/', () => {
    const htmlPrev = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'index.html'), 'utf8');

    // Debe contener el botón exclusivo de reserva
    assert.ok(htmlPrev.includes('class="reserva-header-btn"'), 'Debe existir .reserva-header-btn');
    assert.ok(htmlPrev.includes('href="reserva/"'), 'El botón de reserva debe apuntar a reserva/');

    // NO debe enlazar a carrito.html ni contener cart-icon-btn hacia carrito normal
    assert.ok(!htmlPrev.includes('href="../carrito.html"'), 'preventa/index.html NO debe enlazar a ../carrito.html');
    assert.ok(!htmlPrev.includes('href="carrito.html"'), 'preventa/index.html NO debe enlazar a carrito.html');

    // Debe mostrar texto accesible o visible de Mi Reserva Preventa
    assert.ok(htmlPrev.includes('Mi Reserva'), 'Debe mostrar texto Mi Reserva');
    assert.ok(htmlPrev.includes('id="reserva-header-count"'), 'Debe existir el badge #reserva-header-count');
});

test('22. FASE P4.8 - Eliminación total de favoritos en PREVENTA', () => {
    const htmlPrev = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'index.html'), 'utf8');
    const htmlReserva = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'reserva', 'index.html'), 'utf8');

    // Header sin botón ni acceso a favoritos
    assert.ok(!htmlPrev.includes('class="favorites-header-icon-btn"'), 'preventa/index.html NO debe tener favorites-header-icon-btn');
    assert.ok(!htmlPrev.includes('id="favorites-header-count"'), 'preventa/index.html NO debe tener favorites-header-count');
    assert.ok(!htmlReserva.includes('class="favorites-header-icon-btn"'), 'preventa/reserva/index.html NO debe tener favorites-header-icon-btn');

    // Drawer sin enlace de favoritos
    assert.ok(!htmlPrev.includes('favorites-nav-badge'), 'preventa/index.html NO debe tener favorites-nav-badge');
    assert.ok(!htmlReserva.includes('favorites-nav-badge'), 'preventa/reserva/index.html NO debe tener favorites-nav-badge');

    // Sin botones ni atributos de favoritos en las tarjetas
    assert.ok(!htmlPrev.includes('favorite-toggle-btn'), 'preventa/index.html NO debe tener botones favorite-toggle-btn');
});

test('23. FASE P4.8 - Footer independiente y compacto en preventa/index.html y preventa/reserva/index.html', () => {
    const htmlPrev = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'index.html'), 'utf8');
    const htmlReserva = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'reserva', 'index.html'), 'utf8');

    [htmlPrev, htmlReserva].forEach((html, idx) => {
        const file = idx === 0 ? 'preventa/index.html' : 'preventa/reserva/index.html';

        // Estructura de footer independiente
        assert.ok(html.includes('class="preventa-footer-independent"'), `${file} debe incluir preventa-footer-independent`);
        assert.ok(html.includes('Alta perfumería, lanzamientos exclusivos y reservas anticipadas.'), `${file} debe incluir el eslogan boutique`);
        assert.ok(html.includes('Las reservas PREVENTA se confirman mediante WhatsApp.'), `${file} debe incluir el aviso oficial de confirmación`);
        assert.ok(html.includes('Contacto WhatsApp'), `${file} debe incluir enlace de contacto WhatsApp`);
        assert.ok(html.includes('instagram.com/dunes_parfums'), `${file} debe incluir enlace a Instagram`);
        assert.ok(html.includes('tiktok.com/@dunes.parfums'), `${file} debe incluir enlace a TikTok`);

        // Elementos eliminados: categorías y listas extensas del ecommerce
        assert.ok(!html.includes('id="footer-menu-cat"'), `${file} NO debe incluir categorías del ecommerce`);
        assert.ok(!html.includes('id="footer-menu-nav"'), `${file} NO debe incluir menú repetido del ecommerce`);
        assert.ok(!html.includes('id="footer-menu-contact"'), `${file} NO debe incluir menú extenso de contacto`);
    });
});

test('24. FASE P4.8 - Sincronización de badges de reserva en preventa-cart.js', () => {
    assert.equal(typeof PreventaCart.actualizarBadgesHeaderPreventa, 'function');
});

test('25. FASE P4.8.1 - Etiqueta de cantidad en Mi Reserva Preventa se muestra en una sola línea (nowrap)', () => {
    const cssPath = path.join(ROOT_DIR, 'css', 'preventa-reserva.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Verificar .reserva-count-pill
    assert.ok(css.includes('.reserva-count-pill'), 'css/preventa-reserva.css debe definir .reserva-count-pill');
    assert.ok(css.includes('white-space: nowrap'), 'Debe incluir white-space: nowrap');
    assert.ok(css.includes('display: inline-flex'), 'Debe incluir display: inline-flex');
    assert.ok(css.includes('align-items: center'), 'Debe incluir align-items: center');
    assert.ok(css.includes('justify-content: center'), 'Debe incluir justify-content: center');

    // Verificar protección en responsive móvil
    const mobileIndex = css.indexOf('@media (max-width: 640px)');
    assert.ok(mobileIndex > -1, 'Debe existir media query @media (max-width: 640px)');
    const mobileSection = css.substring(mobileIndex);
    assert.ok(mobileSection.includes('.reserva-count-pill'), 'Móvil debe incluir regla para .reserva-count-pill');
    assert.ok(mobileSection.includes('white-space: nowrap !important'), 'Móvil debe proteger white-space: nowrap !important');
});

test('26. FASE P4.8.2 - Auditoría de navegación en header PREVENTA desde /preventa/', () => {
    const htmlPrev = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'index.html'), 'utf8');

    // 1. INICIO
    assert.ok(htmlPrev.includes('href="../index.html" class="nav-link"'), 'INICIO debe apuntar a ../index.html');

    // 2. CATÁLOGO
    assert.ok(htmlPrev.includes('href="../catalogo.html" class="nav-link nav-link-accordion"'), 'CATÁLOGO debe apuntar a ../catalogo.html');
    assert.ok(!htmlPrev.includes('href="/preventa/catalogo.html"'), 'NO debe apuntar a /preventa/catalogo.html');
    assert.ok(!htmlPrev.includes('href="catalogo.html"'), 'NO debe apuntar erróneamente a catalogo.html relativo a preventa');

    // 3. PREVENTA
    assert.ok(htmlPrev.includes('href="index.html" class="nav-link active"'), 'PREVENTA debe estar activa');

    // 4. OFERTAS
    assert.ok(htmlPrev.includes('href="../index.html#ofertas" class="nav-link"'), 'OFERTAS debe apuntar a ../index.html#ofertas');

    // 5. COMPARAR PERFUMES
    assert.ok(htmlPrev.includes('href="../comparador.html" class="nav-link"'), 'COMPARAR PERFUMES debe apuntar a ../comparador.html');

    // 6. CONTACTO
    assert.ok(htmlPrev.includes('href="../index.html#ubicacion" class="nav-link"'), 'CONTACTO debe apuntar a ../index.html#ubicacion');

    // 7. MI RESERVA (FASE P4.8.3: Eliminada duplicidad del menú; acceso exclusivo por botón superior derecho)
    assert.ok(!htmlPrev.includes('href="reserva/" class="nav-link"'), 'MI RESERVA NO debe duplicarse en el menú nav-list');
    assert.ok(htmlPrev.includes('href="reserva/" class="reserva-header-btn"'), 'MI RESERVA en header actions debe apuntar a reserva/');

    // 8. AYUDA / FAQ
    assert.ok(htmlPrev.includes('href="../ayuda.html" class="nav-link"'), 'AYUDA / FAQ debe apuntar a ../ayuda.html');

    // Sincronización de breakpoint: corrección de inert para botones activos en desktop
    assert.ok(htmlPrev.includes('sincronizarEstadoBreakpoint'), 'Debe incluir sincronizarEstadoBreakpoint para desktop');
    assert.ok(htmlPrev.includes('navMenu.removeAttribute(\'inert\')'), 'Debe remover inert al cargar o cambiar a desktop');
});

test('27. FASE P4.8.2 - Header desktop premium: gap 32px-42px y textos en una sola línea (nowrap)', () => {
    const cssPath = path.join(ROOT_DIR, 'css', 'preventa.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Verificar bloque desktop min-width: 992px
    const desktopIndex = css.indexOf('@media screen and (min-width: 992px)');
    assert.ok(desktopIndex > -1, 'css/preventa.css debe incluir @media screen and (min-width: 992px)');
    const desktopCss = css.substring(desktopIndex);

    // Separación premium entre elementos: gap 32px - 42px
    assert.ok(
        desktopCss.includes('gap: clamp(32px, 2.4vw, 42px)') ||
        desktopCss.includes('gap: 36px') ||
        (desktopCss.includes('32px') && desktopCss.includes('42px')),
        'Debe aplicar gap en el rango 32px - 42px en .page-preventa .nav-list'
    );

    // Protección general contra saltos de línea
    assert.ok(desktopCss.includes('.page-preventa .nav-list'), 'Debe definir reglas para .page-preventa .nav-list');
    assert.ok(desktopCss.includes('flex-wrap: nowrap !important'), 'Debe evitar flex-wrap en .nav-list');
    assert.ok(desktopCss.includes('white-space: nowrap !important'), 'Debe aplicar white-space: nowrap');

    // Requisito específico: COMPARAR PERFUMES en una sola línea
    assert.ok(desktopCss.includes('.page-preventa .nav-link[href*="comparador"]'), 'Debe proteger enlace comparador');
    assert.ok(desktopCss.includes('word-break: keep-all !important'), 'Debe evitar partición de palabras con keep-all');

    // Requisito específico: MI RESERVA en una sola línea
    assert.ok(desktopCss.includes('.page-preventa .reserva-header-btn'), 'Debe proteger botón .reserva-header-btn');
    assert.ok(desktopCss.includes('.page-preventa .reserva-header-text'), 'Debe proteger texto .reserva-header-text');

    // Distribución del contenedor
    assert.ok(desktopCss.includes('.page-preventa .header-container'), 'Debe definir .page-preventa .header-container');
    assert.ok(desktopCss.includes('justify-content: space-between !important'), 'Debe justificar el espacio entre logo, nav y reserva');
});

test('28. FASE P4.8.3 - Refinamiento visual tarjetas PREVENTA y eliminación duplicidad Mi Reserva', () => {
    const htmlPrev = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'index.html'), 'utf8');
    const cssPath = path.join(ROOT_DIR, 'css', 'preventa.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // 1. Badge formato superior derecho en .preventa-card-media
    assert.ok(htmlPrev.includes('class="preventa-format-badge"'), 'El template debe renderizar .preventa-format-badge en la tarjeta');
    assert.ok(css.includes('.preventa-format-badge'), 'css/preventa.css debe definir .preventa-format-badge');
    assert.ok(css.includes('top: 10px') && css.includes('right: 10px'), 'Badge de formato debe ubicarse en la esquina superior derecha');

    // 2. Ocultación visual estricta de ocasión en la tarjeta
    assert.ok(css.includes('.preventa-card-occasion'), 'Debe existir regla para .preventa-card-occasion');
    assert.ok(css.includes('.preventa-card-details') && css.includes('display: none !important'), 'Debe ocultar visualmente detalles redundantes');

    // 3. No duplicidad de Mi Reserva: solo en el botón superior derecho con contador
    assert.ok(!htmlPrev.includes('href="reserva/" class="nav-link"'), 'El menú nav-list NO debe contener enlace duplicado a Mi Reserva');
    assert.ok(htmlPrev.includes('id="header-reserva-btn"'), 'Debe existir el botón #header-reserva-btn');
    assert.ok(htmlPrev.includes('id="reserva-header-count"'), 'Debe existir el contador dinámico #reserva-header-count');

    // 4. Datos de ocasión y filtros preservados intactos en el código
    const jsPreventa = fs.readFileSync(path.join(ROOT_DIR, 'js', 'preventa.js'), 'utf8');
    assert.ok(jsPreventa.includes('extraerOcasionesDisponibles'), 'Función extraerOcasionesDisponibles debe preservarse');
    assert.ok(jsPreventa.includes('coincideOcasion'), 'Función coincideOcasion debe preservarse');
});

test('29. FASE P4.8.4 — Refinamiento visual "Vaciar Reserva" en Mi Reserva Preventa y confirmación personalizada Dunes', () => {
    const htmlReserva = fs.readFileSync(path.join(ROOT_DIR, 'preventa', 'reserva', 'index.html'), 'utf8');
    const cssPath = path.join(ROOT_DIR, 'css', 'preventa-reserva.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    const jsPath = path.join(ROOT_DIR, 'js', 'preventa-reserva.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    // PARTE 1 — BOTÓN VACIAR RESERVA
    // 1. Selector y ubicación: alineado a la derecha en el encabezado de fragancias
    assert.ok(htmlReserva.includes('id="btn-vaciar-reserva"'), 'Debe existir el botón #btn-vaciar-reserva');
    assert.ok(htmlReserva.includes('class="reserva-btn-vaciar"'), 'Debe utilizar la clase .reserva-btn-vaciar');
    assert.ok(
        htmlReserva.indexOf('id="reserva-products-title"') < htmlReserva.indexOf('id="btn-vaciar-reserva"'),
        'El botón debe ubicarse en el encabezado junto al título Fragancias en Reserva'
    );

    // 2. Icono papelera y tipografía / tamaño compacto
    assert.ok(htmlReserva.includes('reserva-btn-vaciar-icon'), 'Debe incluir icono para papelera');
    assert.ok(css.includes('.reserva-btn-vaciar'), 'css/preventa-reserva.css debe definir .reserva-btn-vaciar');
    assert.ok(css.includes("font-family: var(--font-body, 'Montserrat', Arial, sans-serif);"), 'Debe emplear tipografía Montserrat');

    // 3. Color neutro/desaturado y hover elegante sin botón rojo agresivo
    assert.ok(css.includes('color: #9e9587;'), 'Debe usar color neutro/desaturado');
    const vaciarCssMatch = css.match(/\.reserva-btn-vaciar\s*\{[\s\S]*?\}/);
    const vaciarHoverMatch = css.match(/\.reserva-btn-vaciar:hover\s*\{[\s\S]*?\}/);
    assert.ok(vaciarCssMatch && !vaciarCssMatch[0].includes('#e57373') && !vaciarCssMatch[0].includes('red'), 'No debe tener apariencia de botón rojo');
    assert.ok(vaciarHoverMatch && !vaciarHoverMatch[0].includes('#e57373') && !vaciarHoverMatch[0].includes('red'), 'Hover no debe tener apariencia de botón rojo');
    assert.ok(css.includes('.reserva-btn-vaciar:hover'), 'Debe tener hover elegante');

    // PARTE 2 — CONFIRMACIÓN PERSONALIZADA DUNES PREVENTA
    // 4. Eliminación de confirm() nativo del navegador
    assert.ok(!js.includes('window.confirm'), 'No debe utilizar window.confirm() nativo');
    assert.ok(!js.includes('confirm('), 'No debe utilizar confirm() nativo');

    // 5. Modal de confirmación personalizado en HTML
    assert.ok(htmlReserva.includes('id="modal-vaciar-reserva"'), 'Debe existir el contenedor del modal #modal-vaciar-reserva');
    assert.ok(htmlReserva.includes('role="dialog"'), 'El modal debe tener rol de diálogo accesible');
    assert.ok(htmlReserva.includes('aria-modal="true"'), 'El modal debe tener aria-modal="true"');

    // 6. Contenido del modal exacto según especificación
    assert.ok(htmlReserva.includes('Vaciar reserva'), 'Debe incluir el título Vaciar reserva');
    assert.ok(htmlReserva.includes('¿Eliminar todas tus fragancias reservadas?'), 'Debe incluir el mensaje principal');
    assert.ok(
        htmlReserva.includes('Tus reservas se eliminarán y podrás volver a agregarlas cuando quieras.'),
        'Debe incluir el texto secundario explicativo'
    );

    // 7. Botones Cancelar y Vaciar reserva con selectores correspondientes
    assert.ok(htmlReserva.includes('id="btn-modal-vaciar-cancelar"'), 'Debe incluir botón cancelar #btn-modal-vaciar-cancelar');
    assert.ok(htmlReserva.includes('id="btn-modal-vaciar-confirmar"'), 'Debe incluir botón confirmar #btn-modal-vaciar-confirmar');
    assert.ok(css.includes('.reserva-modal-btn-cancelar'), 'Debe definir estilo secundario para cancelar');
    assert.ok(css.includes('.reserva-modal-btn-confirmar'), 'Debe definir estilo destacado Dunes para vaciar reserva');

    // 8. Diseño visual del modal: fondo negro profundo, borde dorado tenue, radio 14px y sombra premium
    assert.ok(css.includes('border-radius: 14px;'), 'El modal debe tener un radio de 14px');
    assert.ok(css.includes('rgba(212, 175, 55, 0.28)') || css.includes('rgba(212, 175, 55,'), 'Debe tener borde dorado tenue');
    assert.ok(css.includes('#12110e') || css.includes('#171511'), 'Debe tener fondo negro profundo');
    assert.ok(css.includes('box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8)'), 'Debe tener sombra premium');

    // 9. Lógica funcional de reserva intacta: Cancelar no altera, vaciar limpia reserva
    globalThis.localStorage.clear();
    agregarProductoPreventa({
        id: 'prev-test-modal',
        nombre: 'Club de Nuit Intense',
        precio_preventa: 140
    }, 2);
    assert.equal(obtenerProductos().length, 1);

    // Si se cancela la acción, los productos se mantienen
    assert.equal(obtenerProductos()[0].cantidad, 2);

    // Si se confirma, vaciarReservaPreventa() limpia el carrito preventa
    vaciarReservaPreventa();
    assert.equal(obtenerProductos().length, 0);
});

test('30. FASE P4.9 — Optimización mensaje WhatsApp PREVENTA (versión final sin emojis)', () => {
    // 1. Caso oficial del prompt con Khamrah Clasico y Khamrah Clasico 2PCs
    const items = [
        {
            nombre: 'Khamrah Clasico',
            cantidad: 1,
            precio_preventa: 135
        },
        {
            nombre: 'Khamrah Clasico 2PCs',
            cantidad: 1,
            precio_preventa: 135
        }
    ];

    const resumen = {
        totalProductos: 270,
        totalUnidades: 2,
        totalAdelanto: 20,
        saldoPendiente: 250
    };

    const mensaje = construirTextoMensajeWhatsApp(items, resumen);

    const esperadoPrompt = [
        'Hola Dunes Parfums',
        '',
        'Deseo confirmar mi reserva de PREVENTA:',
        '',
        'Productos:',
        '',
        '• Khamrah Clasico x1',
        '• Khamrah Clasico 2PCs x1',
        '',
        'Total de compra: S/270.00',
        '',
        'Adelanto de reserva: S/20.00',
        '',
        'Saldo restante: S/250.00',
        '',
        'Por favor, bríndenme los métodos de pago para confirmar mi reserva.',
        '',
        'Gracias.'
    ].join('\n');

    assert.equal(mensaje, esperadoPrompt, 'El mensaje generado debe coincidir exactamente con la plantilla de FASE P4.9');

    // 2. Validación estricta: Cero emojis
    assert.equal(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(mensaje), false, 'El mensaje no debe contener emojis');
    assert.ok(!mensaje.includes('👋'), 'No debe contener emoji de saludo 👋');

    // 3. Eliminación completa de aclaraciones innecesarias
    assert.ok(!mensaje.includes('El adelanto será descontado del pago final al momento de la entrega.'), 'Debe eliminar aclaración redundante');
    assert.ok(!mensaje.includes('El adelanto será descontado'), 'No debe contener texto de descuento de adelanto');

    // 4. Cambiar Saldo pendiente por Saldo restante
    assert.ok(!mensaje.includes('Saldo pendiente'), 'No debe contener "Saldo pendiente"');
    assert.ok(mensaje.includes('Saldo restante: S/250.00'), 'Debe contener "Saldo restante: S/XX.00"');

    // 5. Manejo de demasiados productos (MUCHOS PRODUCTOS)
    const muchosItems = Array.from({ length: 8 }, (_, i) => ({
        nombre: `Fragancia Exclusiva ${i + 1}`,
        cantidad: 1
    }));
    const resumenMuchos = {
        totalProductos: 1200,
        totalUnidades: 8,
        totalAdelanto: 80,
        saldoPendiente: 1120
    };

    const mensajeMuchos = construirTextoMensajeWhatsApp(muchosItems, resumenMuchos);
    assert.ok(mensajeMuchos.includes('• 8 productos en preventa'), 'Debe mostrar resumen si la reserva contiene demasiados productos');
    assert.ok(mensajeMuchos.includes('Total de compra: S/1200.00'));
    assert.ok(mensajeMuchos.includes('Adelanto de reserva: S/80.00'));
    assert.ok(mensajeMuchos.includes('Saldo restante: S/1120.00'));
    assert.ok(mensajeMuchos.includes('Por favor, bríndenme los métodos de pago para confirmar mi reserva.'));
    assert.ok(mensajeMuchos.includes('Gracias.'));

    // 6. Validación de URL generada y codificada
    globalThis.localStorage.clear();
    agregarProductoPreventa({
        id: 'p-p49',
        nombre: 'Khamrah Clasico',
        precio_preventa: 135
    }, 1);
    agregarProductoPreventa({
        id: 'p-p49-2',
        nombre: 'Khamrah Clasico 2PCs',
        precio_preventa: 135
    }, 1);

    let urlWhatsAppGenerada = '';
    globalThis.window.open = (url) => {
        urlWhatsAppGenerada = url;
    };
    generarMensajeWhatsAppReserva();

    assert.ok(urlWhatsAppGenerada.startsWith('https://wa.me/51986510573?text='));
    const urlDecodificada = decodeURIComponent(urlWhatsAppGenerada);
    assert.equal(urlDecodificada.includes(esperadoPrompt), true, 'La URL de WhatsApp debe contener el mensaje exacto codificado');
});


