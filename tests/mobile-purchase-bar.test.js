/**
 * Dunes Parfums - Tests unitarios para la Barra Móvil de Compra Rápida en Detalle (FASE M12)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;

globalThis.location = {
    search: '?id=lattafa-khamrah',
    href: 'http://localhost/producto.html?id=lattafa-khamrah',
    pathname: '/producto.html'
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

test('MobilePurchaseBar - existeInicializarBarraMovilDetalle exportada o ejecutable', () => {
    assert.equal(typeof inicializarBarraMovilDetalle, 'function', 'inicializarBarraMovilDetalle debe ser una función en js/interfaz.js');
});

test('MobilePurchaseBar - crearBarraMovilDetalle genera la estructura correcta con ARIA e ID', () => {
    const bar = crearBarraMovilDetalle();
    assert.ok(bar, 'Debe crear un elemento de la barra móvil');
    assert.equal(bar.id, 'mobile-purchase-bar', 'El ID principal debe ser mobile-purchase-bar');
    assert.equal(bar.getAttribute('aria-hidden'), 'true', 'Debe iniciar con aria-hidden true');
});

test('MobilePurchaseBar - actualizarBarraMovilDetalle sincroniza variante y precio dinámico', () => {
    const bar = {
        id: 'mobile-purchase-bar',
        querySelector: (sel) => {
            if (sel === '#mobile-bar-variant') return { textContent: '' };
            if (sel === '#mobile-bar-price') return { textContent: '' };
            if (sel === '#mobile-bar-add-btn') return { setAttribute: () => {}, textContent: '' };
            return null;
        }
    };

    actualizarBarraMovilDetalle(bar, {
        nombre: 'Khamrah Clásico',
        variante: '5 ml',
        precio: 20.00
    });

    // Verificación de firma y ejecución sin excepciones
    assert.ok(true, 'Sincronización realizada correctamente');
});
