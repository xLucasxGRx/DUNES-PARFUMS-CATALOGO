/**
 * Dunes Parfums - Tests unitarios para el Sistema Único de Alertas de Pasos Incompletos
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
let createdElements = [];

globalThis.document = {
    addEventListener: () => {},
    querySelector: (sel) => mockElements[sel] || null,
    querySelectorAll: (sel) => {
        if (sel === '.step-alert-banner') return mockElements['step-alert-banners'] || [];
        if (sel === '.is-step-required') return mockElements['step-required-elements'] || [];
        return mockElements[sel] || [];
    },
    getElementById: (id) => elementsById[id] || null,
    createElement: (tag) => {
        let _id = '';
        const el = {
            get id() { return _id; },
            set id(v) { _id = v; elementsById[v] = el; },
            className: '',
            style: {},
            innerHTML: '',
            classList: {
                add: (c) => { el.className += ' ' + c; },
                remove: (c) => { el.className = (el.className || '').replace(c, '').trim(); },
                contains: (c) => (el.className || '').includes(c)
            },
            setAttribute: (k, v) => { if (k === 'id') el.id = v; },
            getAttribute: () => null,
            appendChild: () => {},
            insertBefore: () => {},
            remove: () => {},
            querySelector: () => null
        };
        createdElements.push(el);
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

globalThis.carritoModulo = {
    obtenerCarrito: () => [{ id: 'p1', nombre: 'Test', precioUnitario: 100, cantidad: 1 }]
};

eval(fs.readFileSync('js/interfaz.js', 'utf8'));

beforeEach(() => {
    mockElements = {
        'step-alert-banners': [],
        'step-required-elements': []
    };
    elementsById = {};
    createdElements = [];
});

test('SingleStepAlert - irAlPrimerPasoIncompleto genera una sola alerta por validacion', () => {
    const warningBox = { style: { display: 'none' } };
    const containerEntrega = {
        id: 'container-seccion-entrega',
        classList: { add: () => {}, remove: () => {} },
        querySelector: () => null,
        insertBefore: () => {},
        appendChild: () => {}
    };

    elementsById['checkout-warning'] = warningBox;
    elementsById['container-seccion-entrega'] = containerEntrega;

    const res = irAlPrimerPasoIncompleto();
    assert.equal(res, true, 'Debe retornar true al haber un paso incompleto');
    assert.equal(warningBox.style.display, 'none', 'checkout-warning no debe mostrarse duplicado');
});
