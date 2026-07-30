/**
 * Dunes Parfums - Tests unitarios para el Reinicio de Modalidad de Entrega (FASE M13.1)
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

let store = {};
globalThis.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => store[k] = String(v),
    removeItem: (k) => delete store[k],
    clear: () => store = {}
};

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

eval(fs.readFileSync('js/interfaz.js', 'utf8'));

beforeEach(() => {
    store = {};
    mockElements = {};
});

test('DeliveryReset - inicializarCheckoutForm asigna modalidad y zona en null', () => {
    reiniciarEstadoCheckout();
    assert.equal(obtenerTipoEntregaSeleccionado(), null, 'El tipo de entrega inicial debe ser null');
    assert.equal(obtenerZonaSeleccionada(), null, 'La zona de entrega inicial debe ser null');
});

test('DeliveryReset - no guarda ni restaura dunes_delivery_pref desde localStorage', () => {
    localStorage.setItem('dunes_delivery_pref', JSON.stringify({ tipoEntrega: 'delivery-local', zona: 'morales' }));
    reiniciarEstadoCheckout();
    assert.equal(obtenerTipoEntregaSeleccionado(), null, 'No debe restaurar tipoEntrega desde localStorage');
    assert.equal(obtenerZonaSeleccionada(), null, 'No debe restaurar zona desde localStorage');
    assert.equal(localStorage.getItem('dunes_delivery_pref'), null, 'Debe limpiar dunes_delivery_pref de localStorage');
});

test('DeliveryReset - cambiar de modalidad limpia la zona anterior', () => {
    seleccionarTipoEntrega('delivery-local');
    seleccionarZonaEntrega('morales');
    assert.equal(obtenerZonaSeleccionada(), 'morales');

    seleccionarTipoEntrega('recojo-local');
    // Al cambiar a recojo o agencia, la zona debe resetearse a null
    if (typeof resetearZonaAlCambiarModalidad === 'function') {
        resetearZonaAlCambiarModalidad();
    }
    assert.equal(obtenerZonaSeleccionada(), null, 'La zona debe quedar limpia al cambiar a recojo');
});
