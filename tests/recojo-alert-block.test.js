/**
 * Dunes Parfums - Tests unitarios para el Bloque de Alerta de Recojo en Local
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
        const el = {
            get id() { return _id; },
            set id(v) { _id = v; elementsById[v] = el; },
            className: '',
            style: {},
            classList: {
                add: (c) => { el.className += ' ' + c; },
                remove: (c) => { el.className = (el.className || '').replace(c, '').trim(); },
                contains: (c) => (el.className || '').includes(c)
            },
            setAttribute: (k, v) => { if (k === 'id') el.id = v; },
            getAttribute: () => null,
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: () => null
        };
        return el;
    },
    body: {
        classList: {
            add: (c) => mockElements['body_classes'].add(c),
            remove: (c) => mockElements['body_classes'].delete(c),
            contains: (c) => mockElements['body_classes'].has(c)
        },
        appendChild: () => {}
    }
};

globalThis.carritoModulo = {
    obtenerCarrito: () => [{ id: 'p1', nombre: 'Test', precioUnitario: 100, cantidad: 1 }]
};

eval(fs.readFileSync('js/interfaz.js', 'utf8'));

beforeEach(() => {
    mockElements = {
        'body_classes': new Set()
    };
    elementsById = {};
});

test('RecojoAlertBlock - actualizarInterfazEntrega muestra block-recojo-local solo cuando la modalidad es recojo-local', () => {
    const blockDelivery = { style: {} };
    const blockAgencia = { style: {} };
    const blockRecojo = { style: {} };
    const warningBox = { style: {} };

    elementsById['block-delivery-local'] = blockDelivery;
    elementsById['block-agencia'] = blockAgencia;
    elementsById['block-recojo-local'] = blockRecojo;
    elementsById['checkout-warning'] = warningBox;

    // Caso 1: Delivery local -> recojo oculto
    seleccionarTipoEntrega('delivery-local');
    actualizarInterfazEntrega();
    assert.equal(blockRecojo.style.display, 'none');

    // Caso 2: Recojo local -> recojo visible
    seleccionarTipoEntrega('recojo-local');
    actualizarInterfazEntrega();
    assert.equal(blockRecojo.style.display, 'block');

    // Caso 3: Agencia -> recojo oculto
    seleccionarTipoEntrega('agencia');
    actualizarInterfazEntrega();
    assert.equal(blockRecojo.style.display, 'none');
});
