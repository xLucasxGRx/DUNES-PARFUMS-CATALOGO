/**
 * Dunes Parfums - Tests unitarios para las Cajas de Alerta de Validación Visual
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
        if (sel === '.step-alert-banner' || sel === '.checkout-validation-alert') return mockElements['banners'] || [];
        if (sel === '.is-step-required') return mockElements['required'] || [];
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
        'banners': [],
        'required': []
    };
    elementsById = {};
    createdElements = [];
});

test('ValidationAlertBox - irAlPrimerPasoIncompleto genera nodo con la clase checkout-validation-alert', () => {
    const containerEntrega = {
        id: 'container-seccion-entrega',
        classList: { add: () => {}, remove: () => {} },
        querySelector: () => null,
        insertBefore: () => {},
        appendChild: () => {}
    };

    elementsById['checkout-warning'] = { style: {} };
    elementsById['container-seccion-entrega'] = containerEntrega;

    irAlPrimerPasoIncompleto();

    const bannerCreado = createdElements.find(el => (el.className || '').includes('checkout-validation-alert'));
    assert.ok(bannerCreado, 'Debe crear un banner con la clase checkout-validation-alert');
    assert.ok(bannerCreado.innerHTML.includes('checkout-validation-alert__icon'), 'Debe incluir el icono vectorial');
    assert.ok(bannerCreado.innerHTML.includes('checkout-validation-alert__text'), 'Debe incluir el texto del mensaje');
});

test('ValidationAlertBox - CSS contiene las propiedades de la caja de alerta completa (borde, fondo, barra lateral)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('.checkout-validation-alert'), 'CSS debe definir .checkout-validation-alert');
    assert.ok(cssContent.includes('border-left: 4px solid #C0392B'), 'Debe tener la barra lateral de 4px rojo/terracota');
});
