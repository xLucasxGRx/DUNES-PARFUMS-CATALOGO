/**
 * Dunes Parfums - Tests de integración del Checkout y Reglas de Delivery (FASE C7)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { CSV_SAMPLE_VALID } = require('./fixtures/cupones-fixtures.js');

globalThis.window = globalThis;

let mockStorage = {};
globalThis.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; }
};

let mockElements = {};
function createMockEl(id) {
    return {
        id,
        style: {},
        classList: { add: () => {}, remove: () => {} },
        value: '',
        textContent: '',
        className: '',
        disabled: false,
        setAttribute: () => {},
        removeAttribute: () => {},
        addEventListener: () => {}
    };
}

['coupon-section', 'coupon-code', 'coupon-apply-btn', 'coupon-remove-btn', 'coupon-feedback', 'coupon-applied-state', 'coupon-applied-code', 'coupon-applied-saving', 'coupon-entry-row', 'coupon-discount-row', 'coupon-discount-label', 'coupon-discount-value', 'cart-total-price', 'cart-subtotal-price', 'total-monto-pagar', 'summary-delivery-type'].forEach(id => {
    mockElements[id] = createMockEl(id);
});

globalThis.document = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => mockElements[id] || null
};

let mockCart = [];
window.carritoModulo = {
    obtenerCarrito: () => mockCart,
    mostrarToastPremium: () => {}
};

eval(fs.readFileSync('js/config.js', 'utf8'));
eval(fs.readFileSync('js/cupones-service.js', 'utf8'));
eval(fs.readFileSync('js/cupones.js', 'utf8'));
globalThis.fetch = async () => ({ ok: true, text: async () => CSV_SAMPLE_VALID });
eval(fs.readFileSync('js/interfaz.js', 'utf8'));
eval(fs.readFileSync('js/cupones-ui.js', 'utf8'));

beforeEach(() => {
    mockStorage = {};
    window.cuponesCheckout.quitarCupon();
    mockCart = [];
});

test('Checkout - Regla oficial de Delivery Gratis evaluada SOBRE EL SUBTOTAL BRUTO', async () => {
    // CASO A: Subtotal bruto S/32, cupón -S/5 -> Subtotal neto S/27
    mockCart = [{ id: 'p1', precioUnitario: 32, cantidad: 1 }];
    window.seleccionarTipoEntrega('delivery-local');
    window.seleccionarZonaEntrega('morales'); // Costo normal S/3.00, gratis desde S/30 bruto

    const resA = await window.cuponesCheckout.aplicarCupon('TIODUNES'); // TIODUNES requiere 160, usemos cupon de prueba de 5
    const totalesA = obtenerTotalesPedido();
    assert.equal(totalesA.subtotalBruto, 32);
    assert.equal(totalesA.costoEntrega, 0); // Conserva delivery gratis porque 32 >= 30

    // CASO B: Subtotal bruto S/29, cupón -S/5 -> Subtotal neto S/24
    mockCart = [{ id: 'p1', precioUnitario: 29, cantidad: 1 }];
    const totalesB = obtenerTotalesPedido();
    assert.equal(totalesB.subtotalBruto, 29);
    assert.equal(totalesB.costoEntrega, 3); // Mantiene costo de delivery porque 29 < 30
});

test('Checkout - Modificación de cantidades y revalidación automática', async () => {
    // Carrito inicial: S/160 -> TIODUNES es válido
    mockCart = [{ id: 'p1', precioUnitario: 160, cantidad: 1 }];
    const r1 = await window.cuponesCheckout.aplicarCupon('TIODUNES');
    assert.equal(r1.valido, true);

    // Cliente disminuye cantidad a subtotal S/100 -> TIODUNES pasa a monto_minimo_no_alcanzado
    mockCart = [{ id: 'p1', precioUnitario: 100, cantidad: 1 }];
    const t1 = obtenerTotalesPedido();
    assert.equal(t1.descuento, 0);
    assert.equal(t1.totalFinal, 100);

    // Cliente vuelve a aumentar cantidad a S/160 -> TIODUNES se reactiva automáticamente
    mockCart = [{ id: 'p1', precioUnitario: 160, cantidad: 1 }];
    const t2 = obtenerTotalesPedido();
    assert.equal(t2.descuento, 10);
    assert.equal(t2.totalFinal, 150);
});

test('Checkout - Mensaje exacto CUPÓN NO VÁLIDO en la UI para código inexistente', async () => {
    mockCart = [{ id: 'p1', precioUnitario: 160, cantidad: 1 }];
    await window.cuponesCheckout.aplicarCupon('CODIGO_INEXISTENTE');
    window.cuponesUI.sincronizarInterfazCupon();

    assert.equal(mockElements['coupon-feedback'].style.display, 'block');
    assert.equal(mockElements['coupon-feedback'].textContent, 'CUPÓN NO VÁLIDO');
});

test('Checkout - Reseteo de fila de descuento al presionar Quitar', async () => {
    mockCart = [{ id: 'p1', precioUnitario: 160, cantidad: 1 }];
    await window.cuponesCheckout.aplicarCupon('TIODUNES');
    actualizarResumenEntrega();

    assert.equal(mockElements['coupon-discount-row'].style.display, 'flex');
    assert.equal(mockElements['coupon-discount-value'].textContent, '- S/ 10.00');

    window.cuponesCheckout.quitarCupon();
    actualizarResumenEntrega();
    window.cuponesUI.sincronizarInterfazCupon();

    assert.equal(mockElements['coupon-discount-row'].style.display, 'none');
    assert.equal(mockElements['coupon-discount-label'].textContent, 'Descuento:');
    assert.equal(mockElements['coupon-discount-value'].textContent, '- S/ 0.00');
    assert.equal(mockElements['coupon-applied-state'].style.display, 'none');
});
