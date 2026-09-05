/**
 * Dunes Parfums - Tests unitarios e integración para pedidos mayores a S/1000 (FASE M31.4)
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

globalThis.location = {
    search: '',
    href: 'http://localhost/carrito.html',
    pathname: '/carrito.html'
};

globalThis.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {}
});

let mockElements = {};
let elementsById = {};

globalThis.document = {
    addEventListener: () => {},
    querySelector: (sel) => mockElements[sel] || null,
    querySelectorAll: (sel) => mockElements[sel] || [],
    getElementById: (id) => elementsById[id] || null,
    createElement: (tag) => {
        let _id = '';
        let _textContent = '';
        let _value = '';
        const el = {
            get id() { return _id; },
            set id(v) { _id = v; elementsById[v] = el; },
            get textContent() { return _textContent; },
            set textContent(v) { _textContent = v; },
            get value() { return _value; },
            set value(v) { _value = v; },
            className: '',
            style: {},
            dataset: {},
            classList: {
                add: (c) => { el.className += ' ' + c; },
                remove: (c) => { el.className = (el.className || '').replace(c, '').trim(); },
                contains: (c) => (el.className || '').includes(c)
            },
            setAttribute: (k, v) => {
                if (k === 'id') el.id = v;
                el[k] = v;
            },
            getAttribute: (k) => el[k] || null,
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: () => null,
            querySelectorAll: () => []
        };
        return el;
    },
    body: {
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        appendChild: () => {}
    }
};

let toastsMostrados = [];
let pedidosEnviadosWhatsApp = [];
let carritoActual = [];

globalThis.carritoModulo = {
    obtenerCarrito: () => carritoActual,
    mostrarToastPremium: (msg, esError) => {
        toastsMostrados.push({ msg, esError });
    }
};

// Cargar whatsapp.js e interfaz.js
eval(fs.readFileSync('js/whatsapp.js', 'utf8'));
eval(fs.readFileSync('js/interfaz.js', 'utf8'));

let urlsEnviadasWhatsApp = [];
globalThis.open = (url) => {
    urlsEnviadasWhatsApp.push(url);
    return { focus: () => {} };
};

const originalEnviarPedido = window.whatsappConfig.enviarPedidoWhatsApp;
window.whatsappConfig.enviarPedidoWhatsApp = (pedido, total, cliente) => {
    pedidosEnviadosWhatsApp.push(pedido);
    return originalEnviarPedido(pedido, total, cliente);
};

function configurarDOMCarrito(totalEsperado) {
    toastsMostrados = [];
    pedidosEnviadosWhatsApp = [];
    urlsEnviadasWhatsApp = [];
    elementsById = {};

    const cartTotalPrice = document.createElement('span');
    cartTotalPrice.id = 'cart-total-price';
    cartTotalPrice.textContent = formatearMoneda(totalEsperado);
    elementsById['cart-total-price'] = cartTotalPrice;

    const cartSubtotalPrice = document.createElement('span');
    cartSubtotalPrice.id = 'cart-subtotal-price';
    cartSubtotalPrice.textContent = formatearMoneda(totalEsperado);
    elementsById['cart-subtotal-price'] = cartSubtotalPrice;

    const totalMontoPagar = document.createElement('span');
    totalMontoPagar.id = 'total-monto-pagar';
    totalMontoPagar.textContent = formatearMoneda(totalEsperado);
    elementsById['total-monto-pagar'] = totalMontoPagar;

    const summaryType = document.createElement('div');
    summaryType.id = 'summary-delivery-type';
    elementsById['summary-delivery-type'] = summaryType;

    const summaryCost = document.createElement('div');
    summaryCost.id = 'summary-delivery-cost';
    elementsById['summary-delivery-cost'] = summaryCost;

    const summaryLabel = document.createElement('div');
    summaryLabel.id = 'summary-delivery-label';
    elementsById['summary-delivery-label'] = summaryLabel;

    const recojoName = document.createElement('input');
    recojoName.id = 'recojo-name';
    recojoName.value = 'Cliente Test';
    elementsById['recojo-name'] = recojoName;

    // Configurar entrega completa (recojo local para simplificar datos)
    seleccionarTipoEntrega('recojo-local');
}

beforeEach(() => {
    mockStorage = {};
    window.cuponesCheckout.quitarCupon();
});

test('1. Casos Obligatorios: S/999, S/1000, S/1001, S/1200, S/1500, S/2000, S/5000', () => {
    const casos = [999, 1000, 1001, 1200, 1500, 2000, 5000];

    casos.forEach(monto => {
        carritoActual = [{ id: 'p1', nombre: 'Perfume Test', precioUnitario: monto, cantidad: 1 }];
        configurarDOMCarrito(monto);

        confirmarPedidoWhatsApp({ preventDefault: () => {} });

        const errorToast = toastsMostrados.find(t => t.msg.includes('No pudimos actualizar el total del pedido'));
        assert.equal(
            errorToast,
            undefined,
            `No debe disparar toast de error para monto S/${monto}. Encontrado: ${JSON.stringify(errorToast)}`
        );

        assert.equal(pedidosEnviadosWhatsApp.length, 1, `Debe enviar el pedido a WhatsApp para S/${monto}`);
        const pedido = pedidosEnviadosWhatsApp[0];
        assert.equal(typeof pedido.totalFinal, 'number', 'totalFinal debe ser de tipo number');
        assert.equal(pedido.totalFinal, monto, `totalFinal debe ser ${monto}`);
        assert.equal(Number.isNaN(pedido.totalFinal), false, 'totalFinal no puede ser NaN');
        assert.equal(Number.isFinite(pedido.totalFinal), true, 'totalFinal debe ser finito');
    });
});

test('2. Casos con Descuento: 1200 - 100 = 1100, 1500 - 200 = 1300, 2000 - 300 = 1700', async () => {
    const casos = [
        { subtotal: 1200, descuento: 100, esperado: 1100 },
        { subtotal: 1500, descuento: 200, esperado: 1300 },
        { subtotal: 2000, descuento: 300, esperado: 1700 }
    ];

    for (const { subtotal, descuento, esperado } of casos) {
        carritoActual = [{ id: 'p1', nombre: 'Perfume Test', precioUnitario: subtotal, cantidad: 1 }];
        configurarDOMCarrito(subtotal);

        // Mock completo de cuponesModulo con validarCuponPorCodigo y validarCupon
        window.cuponesModulo = {
            validarCuponPorCodigo: async (codigo, ctx) => ({
                valido: true,
                codigo,
                estado: 'cupon_valido',
                mensaje: 'Cupón de descuento aplicado.',
                cupon: { codigo, tipo: 'monto_fijo', valor: descuento, activo: true },
                subtotalBruto: ctx.subtotalBruto,
                subtotalElegible: ctx.subtotalBruto,
                descuento,
                subtotalNeto: ctx.subtotalBruto - descuento,
                montoFaltante: 0
            }),
            validarCupon: (cupon, ctx) => ({
                valido: true,
                codigo: cupon.codigo,
                estado: 'cupon_valido',
                mensaje: 'Cupón de descuento aplicado.',
                cupon,
                subtotalBruto: ctx.subtotalBruto,
                subtotalElegible: ctx.subtotalBruto,
                descuento,
                subtotalNeto: ctx.subtotalBruto - descuento,
                montoFaltante: 0
            })
        };

        await window.cuponesCheckout.aplicarCupon('TESTDESC');

        confirmarPedidoWhatsApp({ preventDefault: () => {} });

        const errorToast = toastsMostrados.find(t => t.msg.includes('No pudimos actualizar el total del pedido'));
        assert.equal(errorToast, undefined, `No debe haber error para subtotal ${subtotal} con descuento ${descuento}`);

        assert.equal(pedidosEnviadosWhatsApp.length, 1);
        const pedido = pedidosEnviadosWhatsApp[0];
        assert.equal(pedido.subtotalBruto, subtotal, 'Subtotal bruto correcto');
        assert.equal(pedido.descuento, descuento, 'Descuento correcto');
        assert.equal(pedido.totalFinal, esperado, 'Total final correcto');

        window.cuponesCheckout.quitarCupon();
    }
});

test('3. Casos con Delivery: 1000 + 0 = 1000, 1000 + 5 = 1005, 1200 + 5 = 1205, 1500 + 6 = 1506, 2000 + 0 = 2000', () => {
    // Casos con delivery gratis (regla comercial estándar: subtotal >= 30 es gratis)
    const casosGratis = [
        { subtotal: 1000, zona: 'banda_entrada', esperado: 1000, costo: 0 },
        { subtotal: 2000, zona: 'banda_entrada', esperado: 2000, costo: 0 }
    ];

    casosGratis.forEach(({ subtotal, zona, esperado, costo }) => {
        carritoActual = [{ id: 'p1', nombre: 'Perfume Test', precioUnitario: subtotal, cantidad: 1 }];
        configurarDOMCarrito(esperado);

        seleccionarTipoEntrega('delivery-local');
        seleccionarZonaEntrega(zona);

        const nameInput = document.createElement('input');
        nameInput.id = 'delivery-name';
        nameInput.value = 'Juan Pérez';
        elementsById['delivery-name'] = nameInput;

        const addressInput = document.createElement('input');
        addressInput.id = 'delivery-address';
        addressInput.value = 'Av. Perú 123';
        elementsById['delivery-address'] = addressInput;

        actualizarResumenEntrega();

        confirmarPedidoWhatsApp({ preventDefault: () => {} });

        const errorToast = toastsMostrados.find(t => t.msg.includes('No pudimos actualizar el total del pedido'));
        assert.equal(errorToast, undefined, `No debe haber error para subtotal ${subtotal} + delivery ${costo}`);

        assert.equal(pedidosEnviadosWhatsApp.length, 1);
        const pedido = pedidosEnviadosWhatsApp[0];
        assert.equal(pedido.subtotalBruto, subtotal, 'Subtotal bruto correcto');
        assert.equal(pedido.costoEntrega, costo, 'Costo entrega correcto');
        assert.equal(pedido.totalFinal, esperado, 'Total final con delivery correcto');
    });

    // Casos con delivery con costo (tarifa oficial de zona: banda_entrada S/5, banda_alta S/6)
    const origMinimoGratis = CONFIG_DELIVERY_LOCAL.montoMinimoGratis;
    CONFIG_DELIVERY_LOCAL.montoMinimoGratis = 999999; // Para verificar el cálculo con tarifa positiva sin alterar tablas

    const casosConCosto = [
        { subtotal: 1000, zona: 'banda_entrada', esperado: 1005, costo: 5 },
        { subtotal: 1200, zona: 'banda_entrada', esperado: 1205, costo: 5 },
        { subtotal: 1500, zona: 'banda_alta', esperado: 1506, costo: 6 }
    ];

    casosConCosto.forEach(({ subtotal, zona, esperado, costo }) => {
        carritoActual = [{ id: 'p1', nombre: 'Perfume Test', precioUnitario: subtotal, cantidad: 1 }];
        configurarDOMCarrito(esperado);

        seleccionarTipoEntrega('delivery-local');
        seleccionarZonaEntrega(zona);

        const nameInput = document.createElement('input');
        nameInput.id = 'delivery-name';
        nameInput.value = 'Juan Pérez';
        elementsById['delivery-name'] = nameInput;

        const addressInput = document.createElement('input');
        addressInput.id = 'delivery-address';
        addressInput.value = 'Av. Perú 123';
        elementsById['delivery-address'] = addressInput;

        actualizarResumenEntrega();

        confirmarPedidoWhatsApp({ preventDefault: () => {} });

        const errorToast = toastsMostrados.find(t => t.msg.includes('No pudimos actualizar el total del pedido'));
        assert.equal(errorToast, undefined, `No debe haber error para subtotal ${subtotal} + delivery ${costo}`);

        assert.equal(pedidosEnviadosWhatsApp.length, 1);
        const pedido = pedidosEnviadosWhatsApp[0];
        assert.equal(pedido.subtotalBruto, subtotal, 'Subtotal bruto correcto');
        assert.equal(pedido.costoEntrega, costo, 'Costo entrega correcto');
        assert.equal(pedido.totalFinal, esperado, 'Total final con delivery correcto');
    });

    CONFIG_DELIVERY_LOCAL.montoMinimoGratis = origMinimoGratis;
});

test('4. Casos de Formato Numérico y Normalización: parsearMonto', () => {
    assert.equal(typeof window.parsearMonto, 'function', 'parsearMonto debe estar definida y exportada en window');

    assert.equal(window.parsearMonto(1000), 1000);
    assert.equal(window.parsearMonto("1000"), 1000);
    assert.equal(window.parsearMonto(" 1000 "), 1000);
    assert.equal(window.parsearMonto(1000.00), 1000);
    assert.equal(window.parsearMonto("1000.00"), 1000);
    assert.equal(window.parsearMonto("1,000"), 1000, '"1,000" NO debe interpretarse como 1');
    assert.equal(window.parsearMonto("1,000.00"), 1000);
    assert.equal(window.parsearMonto("1.000,00"), 1000);
    assert.equal(window.parsearMonto("S/ 1,000.00"), 1000);
    assert.equal(window.parsearMonto("S/ 1,001.00"), 1001);
    assert.equal(window.parsearMonto("S/ 1,200.00"), 1200);
    assert.equal(window.parsearMonto("S/ 1,500.00"), 1500);
    assert.equal(window.parsearMonto("S/ 2,000.00"), 2000);
    assert.equal(window.parsearMonto("S/ 5,000.00"), 5000);
});

test('5. Casos WhatsApp: Generación de mensaje y URL para totales 1000, 1001, 1200, 1500, 2000, 5000', () => {
    const totales = [1000, 1001, 1200, 1500, 2000, 5000];

    totales.forEach(total => {
        const pedido = {
            productos: [{
                nombre: 'Club de Nuit Intense',
                cantidad: 1,
                precioUnitario: total,
                presentacion: 'Sellado / 105 ml'
            }],
            subtotalBruto: total,
            subtotalProductos: total,
            costoEntrega: 0,
            totalFinal: total,
            cuponAplicado: null,
            datosEntrega: {
                tipoEntrega: 'recojo-local',
                nombre: 'Carlos Tester'
            }
        };

        const msg = window.whatsappConfig.generarMensajeWhatsApp(pedido);
        assert.ok(msg, `El mensaje debe generarse para total ${total}`);
        assert.equal(msg.includes(`*TOTAL DEL PEDIDO: S/${total.toFixed(2)}*`), true, `Debe contener total S/${total.toFixed(2)}`);
        assert.equal(msg.includes('NaN'), false, 'No debe contener NaN');
        assert.equal(msg.includes('undefined'), false, 'No debe contener undefined');

        const url = window.whatsappConfig.obtenerEnlaceWhatsApp(msg);
        assert.ok(url.startsWith('https://wa.me/51986510573?text='), 'URL base de WhatsApp correcta');
        assert.equal(url.includes('%EF%BF%BD'), false, 'No debe tener caracteres corruptos UTF-8');
        assert.equal(url.includes('\uFFFD'), false, 'No debe tener U+FFFD');
    });
});
