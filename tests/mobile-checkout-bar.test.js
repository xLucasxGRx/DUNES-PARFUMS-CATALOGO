/**
 * Dunes Parfums - Tests unitarios para la Barra Móvil de Checkout en Carrito (FASE M13)
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

let mockElements = {};
globalThis.document = {
    addEventListener: () => {},
    querySelector: (sel) => mockElements[sel] || null,
    querySelectorAll: (sel) => mockElements[sel] || [],
    getElementById: (id) => mockElements[id] || null,
    body: {
        classList: {
            add: () => {},
            remove: () => {}
        },
        appendChild: () => {}
    },
    createElement: (tag) => {
        const attrs = new Map();
        const el = {
            id: '',
            className: '',
            style: {},
            classList: {
                add: (c) => el.className += ' ' + c,
                remove: (c) => el.className = el.className.replace(c, '').trim(),
                contains: (c) => el.className.includes(c)
            },
            setAttribute: (k, v) => attrs.set(k, String(v)),
            getAttribute: (k) => attrs.get(k) || null,
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: (s) => mockElements[s] || null
        };
        return el;
    }
};

eval(fs.readFileSync('js/interfaz.js', 'utf8'));

test('MobileCheckoutBar - existeInicializarBarraMovilCarrito exportada o ejecutable', () => {
    assert.equal(typeof inicializarBarraMovilCarrito, 'function', 'inicializarBarraMovilCarrito debe ser una función en js/interfaz.js');
});

test('MobileCheckoutBar - crearBarraMovilCarrito genera la estructura correcta con ID y ARIA', () => {
    const bar = crearBarraMovilCarrito();
    assert.ok(bar, 'Debe crear la barra móvil del carrito');
    assert.equal(bar.id, 'mobile-checkout-bar', 'El ID debe ser mobile-checkout-bar');
    assert.equal(bar.getAttribute('aria-hidden'), 'true', 'Debe iniciar oculta con aria-hidden true');
});

test('MobileCheckoutBar - actualizarEstadoBarraMovilCarrito conmuta entre INCOMPLETO y COMPLETO', () => {
    const barBtn = {
        className: '',
        textContent: '',
        setAttribute: () => {},
        classList: {
            add: (c) => { barBtn.className += ' ' + c; },
            remove: (c) => { barBtn.className = (barBtn.className || '').replace(c, '').trim(); }
        }
    };
    const barAmount = { textContent: '' };
    const bar = {
        querySelector: (s) => {
            if (s === '#mobile-checkout-bar-btn') return barBtn;
            if (s === '#mobile-checkout-bar-amount') return barAmount;
            return null;
        }
    };

    actualizarEstadoBarraMovilCarrito(bar, false, 159.00);
    assert.ok(barBtn.textContent.includes('CONTINUAR PEDIDO'), 'Estado incompleto debe mostrar CONTINUAR PEDIDO');

    actualizarEstadoBarraMovilCarrito(bar, true, 159.00);
    assert.ok(barBtn.textContent.includes('CONFIRMAR POR WHATSAPP'), 'Estado completo debe mostrar CONFIRMAR POR WHATSAPP');
});
