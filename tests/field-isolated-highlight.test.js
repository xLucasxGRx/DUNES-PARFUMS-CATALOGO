/**
 * Dunes Parfums - Tests unitarios para el Resaltado Aislado por Campo (Nombre Completo y Dirección)
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
                contains: (c) => (el.className || '').includes(c),
                toggle: (c, val) => {
                    if (val) el.className += ' ' + c;
                    else el.className = (el.className || '').replace(c, '').trim();
                }
            },
            setAttribute: (k, v) => { if (k === 'id') el.id = v; },
            getAttribute: () => null,
            appendChild: () => {},
            insertBefore: () => {},
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

test('FieldIsolatedHighlight - paso de nombre recojo apunta a elementoId recojo-name', () => {
    seleccionarTipoEntrega('recojo-local');
    const paso = obtenerPrimerPasoIncompleto();
    assert.ok(paso);
    assert.equal(paso.tipo, 'nombre_recojo');
    assert.equal(paso.elementoId, 'recojo-name', 'Debe apuntar directamente al input del nombre');
});

test('FieldIsolatedHighlight - paso de direccion delivery apunta a elementoId delivery-address', () => {
    seleccionarTipoEntrega('delivery-local');
    seleccionarZonaEntrega('morales');
    elementsById['delivery-name'] = { value: 'Juan Pérez' };
    elementsById['delivery-address'] = { value: '' };

    const paso = obtenerPrimerPasoIncompleto();
    assert.ok(paso);
    assert.equal(paso.tipo, 'direccion');
    assert.equal(paso.elementoId, 'delivery-address', 'Debe apuntar directamente al input de la dirección');
});
