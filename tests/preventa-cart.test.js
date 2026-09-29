/**
 * Dunes Parfums - Tests Unitarios para js/preventa-cart.js (FASE P4.1)
 * Valida el motor independiente de reservas de preventa:
 * - Almacenamiento en 'dunes_preventa_cart'
 * - Cálculo de adelanto de S/ 10 por unidad
 * - Cálculo de saldo pendiente y totales
 * - Aislamiento total respecto al carrito normal y favoritos
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

// Carga del motor preventa-cart
const ROOT_DIR = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(ROOT_DIR, 'js', 'preventa-cart.js'), 'utf8'));

const {
    agregarProductoPreventa,
    obtenerReservaPreventa,
    actualizarCantidadPreventa,
    eliminarProductoPreventa,
    vaciarReservaPreventa,
    calcularResumenPreventa,
    obtenerCantidadReservaPreventa,
    mostrarConfirmacionPreventa,
    ocultarConfirmacionPreventa,
    validarStockProducto,
    obtenerMensajeStockSuperado,
    STORAGE_KEY,
    ADELANTO_UNITARIO
} = globalThis.PreventaCart;

beforeEach(() => {
    globalThis.localStorage.clear();
});

test('1. Configuración y clave de almacenamiento independiente', () => {
    assert.equal(STORAGE_KEY, 'dunes_preventa_cart');
    assert.equal(ADELANTO_UNITARIO, 10);
    assert.deepEqual(obtenerReservaPreventa(), []);
});

test('2. Agregar producto genera la estructura completa y guarda en dunes_preventa_cart', () => {
    const productoTest = {
        id: 'prev-1',
        nombre: 'Khamrah Qahwa',
        marca: 'Lattafa',
        imagen: 'https://ejemplo.com/khamrah.jpg',
        categoria: 'arabe',
        genero: 'unisex',
        ocasion: 'Citas,Noche',
        formato_presentacion: '100 ml',
        precio_regular: 159,
        precio_preventa: 135
    };

    const reserva = agregarProductoPreventa(productoTest, 1);

    assert.equal(reserva.length, 1);
    const item = reserva[0];

    assert.equal(item.id, 'prev-1');
    assert.equal(item.nombre, 'Khamrah Qahwa');
    assert.equal(item.marca, 'Lattafa');
    assert.equal(item.imagen, 'https://ejemplo.com/khamrah.jpg');
    assert.equal(item.categoria, 'arabe');
    assert.equal(item.genero, 'unisex');
    assert.equal(item.ocasion, 'Citas,Noche');
    assert.equal(item.formato_presentacion, '100 ml');
    assert.equal(item.precio_regular, 159);
    assert.equal(item.precio_preventa, 135);
    assert.equal(item.cantidad, 1);
    assert.equal(item.adelanto_unitario, 10);
    assert.equal(item.adelanto_total, 10);
    assert.equal(item.total_producto, 135);
    assert.equal(item.saldo_pendiente, 125); // 135 - 10 = 125

    // Verificar persistencia en localStorage bajo 'dunes_preventa_cart'
    const enStorage = JSON.parse(globalThis.localStorage.getItem('dunes_preventa_cart'));
    assert.equal(Array.isArray(enStorage), true);
    assert.equal(enStorage.length, 1);
    assert.equal(enStorage[0].nombre, 'Khamrah Qahwa');
});

test('3. Incrementar cantidad al agregar el mismo producto existente', () => {
    const producto = {
        id: 'prev-1',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 135
    };

    agregarProductoPreventa(producto, 1);
    const reservaActualizada = agregarProductoPreventa(producto, 1);

    assert.equal(reservaActualizada.length, 1);
    const item = reservaActualizada[0];

    assert.equal(item.cantidad, 2);
    assert.equal(item.adelanto_total, 20); // 2 * S/ 10
    assert.equal(item.total_producto, 270); // 2 * S/ 135
    assert.equal(item.saldo_pendiente, 250); // 270 - 20 = 250
});

test('4. Cálculo comercial de adelanto y saldo con 3 unidades (Ejemplo requerido)', () => {
    // Ejemplo exacto del prompt:
    // Producto: S/135
    // Cantidad: 3
    // Resultado: Total: S/405, Adelanto: S/30, Saldo: S/375
    const producto = {
        id: 'prev-khamrah-qahwa',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 135
    };

    const reserva = agregarProductoPreventa(producto, 3);
    const item = reserva[0];

    assert.equal(item.cantidad, 3);
    assert.equal(item.total_producto, 405);
    assert.equal(item.adelanto_total, 30); // 3 * S/ 10
    assert.equal(item.saldo_pendiente, 375); // 405 - 30 = 375
});

test('5. Actualizar cantidad directamente y recalcular montos', () => {
    const producto = {
        id: 'prev-asad',
        nombre: 'Asad Bourbon',
        precio_preventa: 120
    };

    agregarProductoPreventa(producto, 1);
    const reservaModificada = actualizarCantidadPreventa('prev-asad', 4);

    assert.equal(reservaModificada.length, 1);
    const item = reservaModificada[0];
    assert.equal(item.cantidad, 4);
    assert.equal(item.adelanto_total, 40); // 4 * 10
    assert.equal(item.total_producto, 480); // 4 * 120
    assert.equal(item.saldo_pendiente, 440); // 480 - 40

    // Si la cantidad se actualiza a 0 o menor, se elimina
    const reservaVacia = actualizarCantidadPreventa('prev-asad', 0);
    assert.equal(reservaVacia.length, 0);
});

test('6. Eliminar producto de la reserva preventa', () => {
    agregarProductoPreventa({ id: 'p1', nombre: 'Perfume 1', precio_preventa: 100 });
    agregarProductoPreventa({ id: 'p2', nombre: 'Perfume 2', precio_preventa: 150 });

    assert.equal(obtenerReservaPreventa().length, 2);

    const trasEliminar = eliminarProductoPreventa('p1');
    assert.equal(trasEliminar.length, 1);
    assert.equal(trasEliminar[0].id, 'p2');
    assert.equal(obtenerReservaPreventa().length, 1);
});

test('7. Vaciar reserva elimina todo el contenido de preventa', () => {
    agregarProductoPreventa({ id: 'p1', nombre: 'Perfume 1', precio_preventa: 100 });
    agregarProductoPreventa({ id: 'p2', nombre: 'Perfume 2', precio_preventa: 150 });

    const vaciado = vaciarReservaPreventa();
    assert.deepEqual(vaciado, []);
    assert.deepEqual(obtenerReservaPreventa(), []);
});

test('8. Calcular resumen de preventa para múltiples productos', () => {
    // Producto A: 2 unidades a S/ 135 = S/ 270 (Adelanto: S/ 20, Saldo: S/ 250)
    // Producto B: 1 unidad a S/ 150 = S/ 150 (Adelanto: S/ 10, Saldo: S/ 140)
    // Totales: 3 unidades, Total: S/ 420, Adelanto: S/ 30, Saldo: S/ 390
    agregarProductoPreventa({ id: 'pA', nombre: 'Khamrah', precio_preventa: 135 }, 2);
    agregarProductoPreventa({ id: 'pB', nombre: 'Liquid Brun', precio_preventa: 150 }, 1);

    const resumen = calcularResumenPreventa();
    assert.equal(resumen.totalUnidades, 3);
    assert.equal(resumen.totalProductos, 420);
    assert.equal(resumen.totalAdelanto, 30);
    assert.equal(resumen.saldoPendiente, 390);

    const unidades = obtenerCantidadReservaPreventa();
    assert.equal(unidades, 3);
});

test('9. Aislamiento total: no modifica ni accede al carrito normal ni a favoritos', () => {
    // Configurar estado previo del carrito y favoritos normales
    globalThis.localStorage.setItem('dunes_cart', JSON.stringify([{ id: 'cart-1', cantidad: 2 }]));
    globalThis.localStorage.setItem('dunes_carrito', JSON.stringify([{ id: 'cart-2', cantidad: 1 }]));
    globalThis.localStorage.setItem('dunes_favoritos', JSON.stringify(['fav-101']));

    // Operaciones en Preventa Cart
    agregarProductoPreventa({ id: 'prev-99', nombre: 'Angham', precio_preventa: 140 }, 2);
    actualizarCantidadPreventa('prev-99', 3);
    calcularResumenPreventa();

    // Comprobar que dunes_cart y dunes_favoritos permanecen exactamente iguales
    assert.equal(
        globalThis.localStorage.getItem('dunes_cart'),
        JSON.stringify([{ id: 'cart-1', cantidad: 2 }]),
        'dunes_cart NO debe ser alterado'
    );
    assert.equal(
        globalThis.localStorage.getItem('dunes_carrito'),
        JSON.stringify([{ id: 'cart-2', cantidad: 1 }]),
        'dunes_carrito NO debe ser alterado'
    );
    assert.equal(
        globalThis.localStorage.getItem('dunes_favoritos'),
        JSON.stringify(['fav-101']),
        'dunes_favoritos NO debe ser alterado'
    );

    // Vaciar reserva tampoco debe afectar al carrito normal
    vaciarReservaPreventa();
    assert.equal(
        globalThis.localStorage.getItem('dunes_cart'),
        JSON.stringify([{ id: 'cart-1', cantidad: 2 }])
    );
});

test('10. PreventaCart expone métodos y alias de confirmación visual (FASE P4.2)', () => {
    assert.equal(typeof mostrarConfirmacionPreventa, 'function');
    assert.equal(typeof ocultarConfirmacionPreventa, 'function');
    assert.equal(typeof globalThis.PreventaCart.mostrarConfirmacion, 'function');
    assert.equal(typeof globalThis.PreventaCart.ocultarConfirmacion, 'function');
    assert.equal(typeof globalThis.mostrarConfirmacionPreventa, 'function');
    assert.equal(typeof globalThis.ocultarConfirmacionPreventa, 'function');
});

test('11. Adelanto y saldo se recalculan dinámicamente en adición repetida (S/10 -> S/20 -> S/30)', () => {
    const perfume = {
        id: 'prev-khamrah-qahwa',
        nombre: 'Khamrah Qahwa',
        marca: 'Lattafa',
        precio_preventa: 135
    };

    // Primera vez: Cantidad 1, Adelanto S/ 10, Saldo S/ 125
    let reserva = agregarProductoPreventa(perfume, 1);
    assert.equal(reserva.length, 1);
    assert.equal(reserva[0].cantidad, 1);
    assert.equal(reserva[0].adelanto_total, 10);
    assert.equal(reserva[0].total_producto, 135);
    assert.equal(reserva[0].saldo_pendiente, 125);

    // Segunda vez: Cantidad 2, Adelanto S/ 20, Saldo S/ 250
    reserva = agregarProductoPreventa(perfume, 1);
    assert.equal(reserva.length, 1);
    assert.equal(reserva[0].cantidad, 2);
    assert.equal(reserva[0].adelanto_total, 20);
    assert.equal(reserva[0].total_producto, 270);
    assert.equal(reserva[0].saldo_pendiente, 250);

    // Tercera vez: Cantidad 3, Adelanto S/ 30, Saldo S/ 375
    reserva = agregarProductoPreventa(perfume, 1);
    assert.equal(reserva.length, 1);
    assert.equal(reserva[0].cantidad, 3);
    assert.equal(reserva[0].adelanto_total, 30);
    assert.equal(reserva[0].total_producto, 405);
    assert.equal(reserva[0].saldo_pendiente, 375);
});

test('12. Componente visual de confirmación renderiza campos requeridos de FASE P4.2', () => {
    // Configurar entorno DOM simulado
    const createdElements = {};
    const listeners = {};

    function crearElementoMock(tag) {
        const el = {
            tagName: tag.toUpperCase(),
            id: '',
            className: '',
            style: {},
            attributes: {},
            dataset: {},
            textContent: '',
            children: [],
            classList: {
                classes: new Set(),
                add: (c) => el.classList.classes.add(c),
                remove: (c) => el.classList.classes.delete(c),
                contains: (c) => el.classList.classes.has(c)
            },
            setAttribute: (k, v) => { el.attributes[k] = String(v); if (k === 'id') el.id = v; },
            getAttribute: (k) => el.attributes[k] || null,
            removeAttribute: (k) => { delete el.attributes[k]; },
            appendChild: (child) => { el.children.push(child); return child; },
            addEventListener: (evt, fn) => {
                if (!listeners[evt]) listeners[evt] = [];
                listeners[evt].push(fn);
            },
            querySelector: (sel) => {
                if (sel.startsWith('#')) {
                    const id = sel.substring(1);
                    return createdElements[id] || null;
                }
                return null;
            },
            querySelectorAll: () => []
        };
        return el;
    }

    const mockDoc = {
        createElement: (tag) => {
            const el = crearElementoMock(tag);
            return el;
        },
        getElementById: (id) => createdElements[id] || null,
        addEventListener: (evt, fn) => {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
        },
        body: {
            classList: {
                classes: new Set(),
                add: (c) => mockDoc.body.classList.classes.add(c),
                remove: (c) => mockDoc.body.classList.classes.delete(c),
                contains: (c) => mockDoc.body.classList.classes.has(c)
            },
            appendChild: (node) => {
                if (node && node.id) {
                    createdElements[node.id] = node;
                }
                return node;
            }
        }
    };

    // Precrear elementos internos referenciados por ID
    const elementIds = [
        'preventa-confirm-modal',
        'preventa-confirm-backdrop',
        'preventa-confirm-dialog',
        'preventa-confirm-close',
        'preventa-confirm-title',
        'preventa-confirm-subtitle',
        'preventa-confirm-product-card',
        'preventa-confirm-img',
        'preventa-confirm-brand',
        'preventa-confirm-name',
        'preventa-confirm-price',
        'preventa-confirm-qty',
        'preventa-confirm-deposit',
        'preventa-confirm-balance',
        'preventa-confirm-btn-view',
        'preventa-confirm-btn-continue'
    ];

    elementIds.forEach(id => {
        const el = crearElementoMock('div');
        el.id = id;
        createdElements[id] = el;
    });

    const prevDoc = globalThis.document;
    globalThis.document = mockDoc;

    try {
        const itemTest = {
            id: 'prev-khamrah',
            nombre: 'Khamrah Qahwa',
            marca: 'LATTAFA',
            imagen: 'img/catalogo/khamrah.jpg',
            precio_preventa: 135,
            cantidad: 2,
            adelanto_unitario: 10,
            adelanto_total: 20,
            total_producto: 270,
            saldo_pendiente: 250
        };

        mostrarConfirmacionPreventa(itemTest);

        const modal = createdElements['preventa-confirm-modal'];
        assert.ok(modal, 'El modal de confirmación debe existir');
        assert.equal(modal.classList.contains('is-open'), true, 'El modal debe tener la clase is-open');
        assert.equal(modal.style.display, 'flex');

        // Validar textos requeridos
        const brand = createdElements['preventa-confirm-brand'].textContent;
        const name = createdElements['preventa-confirm-name'].textContent;
        const price = createdElements['preventa-confirm-price'].textContent;
        const qty = createdElements['preventa-confirm-qty'].textContent;
        const deposit = createdElements['preventa-confirm-deposit'].textContent;
        const balance = createdElements['preventa-confirm-balance'].textContent;

        assert.equal(brand, 'LATTAFA');
        assert.equal(name, 'Khamrah Qahwa');
        assert.equal(price, 'S/ 135.00');
        assert.equal(qty, 'Cantidad: 2');
        assert.equal(deposit, 'S/ 20.00');
        assert.equal(balance, 'S/ 250.00');

        // Validar que el body recibe la clase preventa-confirm-open
        assert.equal(mockDoc.body.classList.contains('preventa-confirm-open'), true);
    } finally {
        globalThis.document = prevDoc;
    }
});

test('13. Ocultar confirmación remueve is-open y añade is-closing', () => {
    const modalMock = {
        id: 'preventa-confirm-modal',
        className: 'preventa-confirm-modal is-open',
        style: { display: 'flex' },
        attributes: {},
        classList: {
            classes: new Set(['is-open']),
            add: function(c) { this.classes.add(c); },
            remove: function(c) { this.classes.delete(c); },
            contains: function(c) { return this.classes.has(c); }
        },
        setAttribute: function(k, v) { this.attributes[k] = v; }
    };

    const prevDoc = globalThis.document;
    globalThis.document = {
        getElementById: (id) => (id === 'preventa-confirm-modal' ? modalMock : null),
        body: {
            classList: {
                remove: () => {}
            }
        }
    };

    try {
        ocultarConfirmacionPreventa();
        assert.equal(modalMock.classList.contains('is-closing'), true, 'Debe agregar is-closing para fade out');
        assert.equal(modalMock.classList.contains('is-open'), false, 'Debe remover is-open');
    } finally {
        globalThis.document = prevDoc;
    }
});

test('14. FASE P4.5 - Producto con stock 3 permite agregar máximo 3 unidades', () => {
    const prodStock3 = {
        id: 'prev-khamrah-qahwa',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    };

    // Unidad 1: permitido
    let reserva = agregarProductoPreventa(prodStock3, 1, { silencioso: true });
    assert.equal(reserva.length, 1);
    assert.equal(reserva[0].cantidad, 1);

    // Unidad 2: permitido
    reserva = agregarProductoPreventa(prodStock3, 1, { silencioso: true });
    assert.equal(reserva[0].cantidad, 2);

    // Unidad 3: permitido
    reserva = agregarProductoPreventa(prodStock3, 1, { silencioso: true });
    assert.equal(reserva[0].cantidad, 3);

    // Unidad 4: bloqueado
    const validacion = validarStockProducto(prodStock3, 1);
    assert.equal(validacion.valido, false);
    assert.equal(validacion.motivo, 'stock_superado');
    assert.equal(validacion.mensaje, 'Lo sentimos, solo tenemos 3 unidades disponibles para preventa.');

    reserva = agregarProductoPreventa(prodStock3, 1, { silencioso: true });
    assert.equal(reserva[0].cantidad, 3, 'No debe superar stock 3 al intentar agregar una 4ta unidad');
});

test('15. FASE P4.5 - Producto con stock 1 permite máximo 1 unidad', () => {
    const prodStock1 = {
        id: 'prev-yara-candy',
        nombre: 'Yara Candy',
        precio_preventa: 125,
        stock: 1
    };

    // Cantidad 1: permitido
    let reserva = agregarProductoPreventa(prodStock1, 1, { silencioso: true });
    assert.equal(reserva.length, 1);
    assert.equal(reserva[0].cantidad, 1);

    // Cantidad 2 (agregar 1 más): bloqueado
    const validacion = validarStockProducto(prodStock1, 1);
    assert.equal(validacion.valido, false);
    assert.equal(validacion.motivo, 'stock_superado');
    assert.ok(validacion.mensaje.includes('1 unidad disponible'));

    reserva = agregarProductoPreventa(prodStock1, 1, { silencioso: true });
    assert.equal(reserva[0].cantidad, 1, 'Debe permanecer en 1 unidad');
});

test('16. FASE P4.5 - Producto con stock 0 o disponible=false bloquea reserva', () => {
    const prodAgotado = {
        id: 'prev-asad',
        nombre: 'Asad Zanzibar',
        precio_preventa: 110,
        stock: 0,
        disponible: true
    };

    const valStock0 = validarStockProducto(prodAgotado, 1);
    assert.equal(valStock0.valido, false);
    assert.equal(valStock0.mensaje, 'PREVENTA CERRADA');

    const reservaTrasIntento = agregarProductoPreventa(prodAgotado, 1, { silencioso: true });
    assert.equal(reservaTrasIntento.length, 0, 'No debe agregar productos con stock 0');

    const prodNoDisponible = {
        id: 'prev-honor',
        nombre: 'Honor & Glory',
        precio_preventa: 130,
        stock: 5,
        disponible: false
    };

    const valNoDisp = validarStockProducto(prodNoDisponible, 1);
    assert.equal(valNoDisp.valido, false);
    assert.equal(valNoDisp.mensaje, 'PREVENTA CERRADA');
});

test('17. FASE P4.5 - Formato enriquecido en localStorage (cantidad, id interno, stock_validado, producto, precio)', () => {
    const prod = {
        id: 'prev-khamrah-qahwa',
        nombre: 'Khamrah Qahwa',
        precio_preventa: 119,
        stock: 3
    };

    agregarProductoPreventa(prod, 2, { silencioso: true });
    const stored = JSON.parse(globalThis.localStorage.getItem('dunes_preventa_cart'));
    assert.equal(stored.length, 1);
    const item = stored[0];

    assert.equal(item.producto, 'Khamrah Qahwa');
    assert.equal(item.cantidad, 2);
    assert.equal(item.precio, 119);
    assert.equal(item.stock, 3);
    assert.equal(item.stock_validado, 3);
    assert.equal(item.id, 'prev-khamrah-qahwa');
});

test('18. FASE P4.5 - actualizarCantidadPreventa no supera el stock máximo', () => {
    const prod = {
        id: 'prev-asad',
        nombre: 'Asad',
        precio_preventa: 110,
        stock: 3
    };

    agregarProductoPreventa(prod, 1, { silencioso: true });

    // Intentar subir a 5 cuando el stock es 3
    const modificada = actualizarCantidadPreventa('prev-asad', 5);
    assert.equal(modificada[0].cantidad, 3, 'Debe topar en el stock máximo de 3');
    assert.equal(modificada[0].total_producto, 330);
    assert.equal(modificada[0].adelanto_total, 30);
    assert.equal(modificada[0].saldo_pendiente, 300);
});


