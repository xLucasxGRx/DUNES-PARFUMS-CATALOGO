/**
 * Dunes Parfums - Tests unitarios para el ocultamiento de la Barra Móvil del Carrito en Escritorio/Laptop
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;
globalThis.addEventListener = () => {};

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

let isMobileBreakpoint = false;
globalThis.matchMedia = (query) => ({
    get matches() { return isMobileBreakpoint; },
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
            setAttribute: (k, v) => {
                if (k === 'id') el.id = v;
            },
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
});

test('MobileCheckoutBarResponsive - se oculta en pantallas de escritorio (>= 768px, 1024px, 1366px, 1440px)', () => {
    isMobileBreakpoint = false; // Desktop >= 768px
    const targetBtn = { getBoundingClientRect: () => ({ top: -100, bottom: -50 }) };

    inicializarBarraMovilCarrito(targetBtn);
    const bar = document.getElementById('mobile-checkout-bar');

    assert.ok(bar);
    assert.equal(bar.hidden, true, 'Debe tener hidden=true por defecto en el elemento');
    assert.equal(bar.classList.contains('is-visible'), false, 'No debe tener la clase is-visible en escritorio');
    assert.equal(mockElements['body_classes'].has('has-mobile-checkout-bar-visible'), false, 'No debe agregar la clase has-mobile-checkout-bar-visible en escritorio');
});

test('MobileCheckoutBarResponsive - se muestra correctamente en breakpoint móvil (<= 767px)', () => {
    isMobileBreakpoint = true; // Mobile <= 767px
    const targetBtn = { getBoundingClientRect: () => ({ top: -100, bottom: -50 }) };

    inicializarBarraMovilCarrito(targetBtn);
    actualizarBarraCheckoutMovil(true);
    const bar = document.getElementById('mobile-checkout-bar');

    assert.ok(bar);
    assert.equal(bar.hidden, false, 'Debe tener hidden=false en móvil cuando el botón está fuera de pantalla');
    assert.equal(bar.classList.contains('is-visible'), true, 'Debe tener la clase is-visible en móvil');
    assert.equal(mockElements['body_classes'].has('has-mobile-checkout-bar-visible'), true, 'Debe agregar la clase has-mobile-checkout-bar-visible en móvil');
});
