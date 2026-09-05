/**
 * Dunes Parfums - Tests unitarios para la corrección del botón + en Carrito (FASE M31.3)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;

let mockStorage = {};
globalThis.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; }
};

let toastsEmitidos = [];
let mockDOM = {};
let containerToast = null;

globalThis.document = {
    addEventListener: () => {},
    getElementById: (id) => {
        if (id === 'toast-container') return containerToast;
        return mockDOM[id] || null;
    },
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    createElement: (tag) => {
        const children = [];
        const el = {
            id: '',
            className: '',
            style: {},
            innerHTML: '',
            classList: {
                add: (c) => { el.className = (el.className + ' ' + c).trim(); },
                remove: (c) => { el.className = (el.className || '').replace(c, '').trim(); }
            },
            appendChild: (ch) => { children.push(ch); },
            querySelectorAll: (sel) => {
                if (sel.includes('.toast-text')) {
                    return children.map(c => ({
                        textContent: c.innerHTML.includes('toast-text') ? c.innerHTML.replace(/<[^>]+>/g, '').trim() : ''
                    }));
                }
                return [];
            },
            remove: () => {}
        };
        return el;
    },
    body: {
        appendChild: (ch) => {
            if (ch.id === 'toast-container') containerToast = ch;
        }
    }
};

// Cargar script del carrito
eval(fs.readFileSync('js/carrito.js', 'utf8'));

beforeEach(() => {
    mockStorage = {};
    toastsEmitidos = [];
    containerToast = null;
    mockDOM = {};

    // Interceptar toasts para validación precisa
    window.mostrarToastPremium = (msg, esWarn = false) => {
        toastsEmitidos.push({ msg, esWarn });
    };
    if (window.carritoModulo) {
        window.carritoModulo.mostrarToastPremium = window.mostrarToastPremium;
    }
});

test('1. Stock = 5, cantidad = 1: + -> 2, 3, 4, 5; 6to + se mantiene en 5 y emite aviso de límite', async () => {
    const mockCatalogo = [
        { id: '2', nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 5, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: '2', nombre: 'Khamrah Clasico 2PCs', cantidad: 1, precioUnitario: 180, subtotal: 180, tamanoMl: 100 }
    ]);

    // + -> 2
    await window.carritoModulo.actualizarCantidadItem('2', 2);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1);
    assert.equal(cart[0].cantidad, 2);
    assert.equal(cart[0].subtotal, 360);
    assert.equal(toastsEmitidos.length, 0);

    // + -> 3
    await window.carritoModulo.actualizarCantidadItem('2', 3);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 3);
    assert.equal(cart[0].subtotal, 540);

    // + -> 4
    await window.carritoModulo.actualizarCantidadItem('2', 4);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 4);

    // + -> 5 (límite exacto de stock)
    await window.carritoModulo.actualizarCantidadItem('2', 5);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 5);
    assert.equal(toastsEmitidos.length, 0, 'No debe mostrar aviso cuando la cantidad alcanza el stock legítimamente');

    // 6to + -> intentar subir a 6 cuando ya está en 5
    await window.carritoModulo.actualizarCantidadItem('2', 6);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1, 'El producto jamás debe eliminarse');
    assert.equal(cart[0].cantidad, 5, 'La cantidad debe mantenerse en 5');
    assert.equal(toastsEmitidos.length, 1, 'Debe emitir aviso');
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});

test('2. Stock = 1, cantidad = 1: + -> se mantiene en 1 y emite aviso de límite', async () => {
    const mockCatalogo = [
        { id: '10', nombre: 'Perfume Exclusivo', formato: 'sellado', categoria: 'sellados', precio: 200, stock: 1, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '10', idProducto: '10', nombre: 'Perfume Exclusivo', cantidad: 1, precioUnitario: 200, subtotal: 200, tamanoMl: 100 }
    ]);

    await window.carritoModulo.actualizarCantidadItem('10', 2);
    const cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1, 'No debe eliminarse el producto');
    assert.equal(cart[0].cantidad, 1, 'Cantidad debe mantenerse en 1');
    assert.equal(toastsEmitidos.length, 1);
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});

test('3. Stock = 3, cantidad = 1: + -> 2, + -> 3, + -> se mantiene en 3 y emite aviso', async () => {
    const mockCatalogo = [
        { id: '15', nombre: 'Perfume Tres', formato: 'sellado', categoria: 'sellados', precio: 150, stock: 3, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '15', idProducto: '15', nombre: 'Perfume Tres', cantidad: 1, precioUnitario: 150, subtotal: 150, tamanoMl: 100 }
    ]);

    await window.carritoModulo.actualizarCantidadItem('15', 2);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 2);

    await window.carritoModulo.actualizarCantidadItem('15', 3);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 3);
    assert.equal(toastsEmitidos.length, 0);

    await window.carritoModulo.actualizarCantidadItem('15', 4);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1);
    assert.equal(cart[0].cantidad, 3);
    assert.equal(toastsEmitidos.length, 1);
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});

test('4. Stock actualizado: carrito tiene stock antiguo = 1, catálogo actual tiene stock = 5 -> + permite subir hasta 5', async () => {
    // Catálogo con stock = 5
    const mockCatalogo = [
        { id: '2', nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 5, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    // Carrito guardado con copia antigua que tenía stock: 1
    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: '2', nombre: 'Khamrah Clasico 2PCs', cantidad: 1, stock: 1, precioUnitario: 180, subtotal: 180, tamanoMl: 100 }
    ]);

    // + debe permitir subir a 2 porque el stock real actual es 5 (no 1)
    await window.carritoModulo.actualizarCantidadItem('2', 2);
    const cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1);
    assert.equal(cart[0].cantidad, 2, 'Debe subir a 2 usando el stock actual del catálogo');
    assert.equal(toastsEmitidos.length, 0);
});

test('5. Clics consecutivos rápidos: respeta el límite sin desincronizar ni lanzar excepciones', async () => {
    const mockCatalogo = [
        { id: '2', nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 5, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: '2', nombre: 'Khamrah Clasico 2PCs', cantidad: 1, precioUnitario: 180, subtotal: 180, tamanoMl: 100 }
    ]);

    // Simular llamadas concurrentes o rápidas
    await Promise.all([
        window.carritoModulo.actualizarCantidadItem('2', 2),
        window.carritoModulo.actualizarCantidadItem('2', 2),
        window.carritoModulo.actualizarCantidadItem('2', 2)
    ]);

    const cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1);
    assert.ok(cart[0].cantidad <= 5, 'La cantidad nunca debe superar el stock de 5');
    assert.ok(cart[0].cantidad >= 1, 'La cantidad nunca debe ser menor a 1');
});

test('6. Nunca eliminar en +: ante stock alcanzado, producto no encontrado o stock inválido, el item jamás se elimina', async () => {
    // Caso 6.1: Catálogo no encuentra el producto
    window.productosModulo = {
        obtenerProductoPorId: async () => null,
        obtenerProductos: async () => []
    };

    window.carritoModulo.guardarCarrito([
        { id: '999', idProducto: '999', nombre: 'Perfume Desconocido', cantidad: 2, precioUnitario: 100, subtotal: 200, tamanoMl: 100 }
    ]);

    await window.carritoModulo.actualizarCantidadItem('999', 3);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1, 'El producto NO debe eliminarse si el catálogo no responde');
    assert.equal(cart[0].cantidad, 2, 'La cantidad debe conservarse intacta');

    // Caso 6.2: Stock con valor NaN o nulo
    window.productosModulo = {
        obtenerProductoPorId: async () => ({ id: '999', nombre: 'Perfume Desconocido', stock: null, formato: 'sellado', precio: 100 }),
        obtenerProductos: async () => []
    };
    await window.carritoModulo.actualizarCantidadItem('999', 3);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1, 'El producto NO debe eliminarse con stock nulo');
    assert.equal(cart[0].cantidad, 2);
});

test('7. Normalización de ID: String vs Number', async () => {
    const mockCatalogo = [
        { id: 2, nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 5, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    // Carrito con id numérico o string
    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: 2, nombre: 'Khamrah Clasico 2PCs', cantidad: 1, precioUnitario: 180, subtotal: 180, tamanoMl: 100 }
    ]);

    // Actualizar pasando id número
    await window.carritoModulo.actualizarCantidadItem(2, 2);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1);
    assert.equal(cart[0].cantidad, 2);

    // Actualizar pasando id string
    await window.carritoModulo.actualizarCantidadItem('2', 3);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 3);
});

test('8. No duplicar avisos en una misma acción', async () => {
    const mockCatalogo = [
        { id: '2', nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 1, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: '2', nombre: 'Khamrah Clasico 2PCs', cantidad: 1, precioUnitario: 180, subtotal: 180, tamanoMl: 100 }
    ]);

    // 1 clic en + cuando ya está en el límite
    await window.carritoModulo.actualizarCantidadItem('2', 2);
    assert.equal(toastsEmitidos.length, 1, 'Debe emitir exactamente 1 aviso por clic');
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});

test('9. Decants: preserva la lógica de decants por mililitros sin afectarla', async () => {
    const mockCatalogo = [
        {
            id: 'd1',
            nombre: 'Asad Zanzibar',
            formato: 'decant',
            categoria: 'decants',
            mililitrosDisponibles: 10,
            disponible: true,
            presentaciones: [
                { ml: 5, nombre: 'Decant 5 ml', precio: 25 }
            ]
        }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    // 1 decant de 5ml en carrito (10ml disponibles / 5ml = máx 2 unidades)
    window.carritoModulo.guardarCarrito([
        { id: 'd1-5', idProducto: 'd1', nombre: 'Asad Zanzibar', cantidad: 1, tamanoMl: 5, precioUnitario: 25, subtotal: 25 }
    ]);

    // + -> 2 (ocupa 10ml)
    await window.carritoModulo.actualizarCantidadItem('d1-5', 2);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 2);
    assert.equal(toastsEmitidos.length, 0);

    // + -> intentar 3 (requeriría 15ml, supera 10ml)
    await window.carritoModulo.actualizarCantidadItem('d1-5', 3);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart.length, 1, 'El decant no debe eliminarse');
    assert.equal(cart[0].cantidad, 2, 'Se mantiene en 2 unidades (10ml)');
    assert.equal(toastsEmitidos.length, 1);
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});

test('10. DOM Integration: vincularEventosCarritoDOM maneja clic en .btn-cart-plus sin duplicidad ni condiciones de carrera', async () => {
    // Evaluar interfaz.js en el entorno
    eval(fs.readFileSync('js/interfaz.js', 'utf8'));

    const mockCatalogo = [
        { id: '2', nombre: 'Khamrah Clasico 2PCs', formato: 'sellado', categoria: 'sellados', precio: 180, stock: 2, disponible: true }
    ];
    window.productosModulo = {
        obtenerProductoPorId: async (id) => mockCatalogo.find(p => String(p.id) === String(id)) || null,
        obtenerProductos: async () => mockCatalogo
    };

    window.carritoModulo.guardarCarrito([
        { id: '2', idProducto: '2', nombre: 'Khamrah Clasico 2PCs', cantidad: 1, precioUnitario: 180, subtotal: 180, tamanoMl: null }
    ]);

    // Simular elemento de botón DOM
    let clickHandler = null;
    const btnPlus = {
        dataset: { id: '2', qty: '1' },
        disabled: false,
        addEventListener: (event, fn) => {
            if (event === 'click') clickHandler = fn;
        }
    };

    const containerMock = {
        querySelectorAll: (sel) => {
            if (sel === '.btn-cart-plus') return [btnPlus];
            return [];
        }
    };

    // Vincular eventos dos veces para probar protección contra doble binding
    vincularEventosCarritoDOM(containerMock);
    vincularEventosCarritoDOM(containerMock);

    assert.ok(clickHandler, 'El listener de click debe estar registrado');

    // Simular un evento de clic con preventDefault y stopPropagation
    let prevented = false;
    let stopped = false;
    const fakeEvent = {
        currentTarget: btnPlus,
        preventDefault: () => { prevented = true; },
        stopPropagation: () => { stopped = true; }
    };

    // 1er Clic: debe subir cantidad a 2
    await clickHandler(fakeEvent);
    let cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 2, 'Cantidad en carrito debe subir a 2 tras el clic');
    assert.equal(toastsEmitidos.length, 0, 'No debe emitir aviso porque stock = 2');
    assert.equal(prevented, true, 'preventDefault debe invocarse');
    assert.equal(stopped, true, 'stopPropagation debe invocarse');

    // 2do Clic: estando ya en 2 (límite alcanzado), no debe subir y debe emitir 1 solo aviso
    btnPlus.dataset.qty = '2';
    await clickHandler(fakeEvent);
    cart = window.carritoModulo.obtenerCarrito();
    assert.equal(cart[0].cantidad, 2, 'Cantidad debe mantenerse en 2');
    assert.equal(toastsEmitidos.length, 1, 'Debe emitir exactamente 1 aviso');
    assert.equal(toastsEmitidos[0].msg, 'No hay más unidades disponibles de este producto.');
});
