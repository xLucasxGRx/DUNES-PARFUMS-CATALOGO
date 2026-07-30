/**
 * Dunes Parfums - Tests unitarios para el Checkout Progresivo (FASE M13.2)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;

globalThis.location = {
    search: '',
    href: 'http://localhost/carrito.html',
    pathname: '/carrito.html'
};

globalThis.URLSearchParams = class {
    constructor(searchStr = '') {
        this.params = new Map();
        if (searchStr.startsWith('?')) searchStr = searchStr.substring(1);
        if (searchStr) {
            searchStr.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) this.params.set(decodeURIComponent(k), decodeURIComponent(v || ''));
            });
        }
    }
    get(k) { return this.params.get(k) || null; }
    has(k) { return this.params.has(k); }
};

globalThis.matchMedia = () => ({ matches: false });

let mockElements = {};
globalThis.document = {
    addEventListener: () => {},
    querySelector: (sel) => mockElements[sel] || null,
    querySelectorAll: (sel) => mockElements[sel] || [],
    getElementById: (id) => mockElements[id] || null,
    body: {
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {}
    }
};

globalThis.carritoModulo = {
    obtenerCarrito: () => [{ id: 'p1', nombre: 'Test', precioUnitario: 100, cantidad: 1 }]
};

eval(fs.readFileSync('js/interfaz.js', 'utf8'));

beforeEach(() => {
    mockElements = {};
    if (typeof reiniciarEstadoCheckout === 'function') reiniciarEstadoCheckout();
});

test('ProgressiveCheckout - obtenerPrimerPasoIncompleto detecta modalidad faltante', () => {
    const paso = obtenerPrimerPasoIncompleto();
    assert.ok(paso, 'Debe haber un paso incompleto');
    assert.equal(paso.tipo, 'modalidad');
    assert.equal(paso.mensaje, 'Selecciona primero cómo deseas recibir tu pedido.');
});

test('ProgressiveCheckout - obtenerPrimerPasoIncompleto detecta zona faltante en delivery local', () => {
    seleccionarTipoEntrega('delivery-local');
    const paso = obtenerPrimerPasoIncompleto();
    assert.ok(paso, 'Debe requerir zona');
    assert.equal(paso.tipo, 'zona');
    assert.equal(paso.mensaje, 'Selecciona la zona de delivery para continuar.');
});

test('ProgressiveCheckout - obtenerPrimerPasoIncompleto detecta nombre faltante', () => {
    seleccionarTipoEntrega('delivery-local');
    seleccionarZonaEntrega('morales');

    mockElements['delivery-name'] = { value: '', setAttribute: () => {} };
    mockElements['delivery-address'] = { value: 'Jr. Lima 123', setAttribute: () => {} };

    const paso = obtenerPrimerPasoIncompleto();
    assert.ok(paso);
    assert.equal(paso.tipo, 'nombre');
});

test('ProgressiveCheckout - agencia no requiere zona ni campos para estar completo', () => {
    seleccionarTipoEntrega('agencia');
    const paso = obtenerPrimerPasoIncompleto();
    assert.equal(paso, null, 'Agencia no requiere campos adicionales para estar completo');
});

test('ProgressiveCheckout - bloque total y boton confirmacion permanecen siempre visibles', () => {
    const blockTotal = { style: {} };
    const btnConfirmar = { style: {}, disabled: true };
    const warningBox = { style: {} };
    const blockDelivery = { style: {} };
    const blockAgencia = { style: {} };
    const blockRecojo = { style: {} };

    mockElements['block-total-pagar'] = blockTotal;
    mockElements['btn-confirmar-whatsapp'] = btnConfirmar;
    mockElements['checkout-warning'] = warningBox;
    mockElements['block-delivery-local'] = blockDelivery;
    mockElements['block-agencia'] = blockAgencia;
    mockElements['block-recojo-local'] = blockRecojo;

    actualizarInterfazEntrega();

    assert.equal(blockTotal.style.display, 'block', 'El bloque de total a pagar debe estar en display block');
    assert.equal(btnConfirmar.style.display, 'inline-flex', 'El botón de confirmación por WhatsApp debe estar en display inline-flex');
});
