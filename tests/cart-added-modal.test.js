/**
 * Dunes Parfums - Tests unitarios para el Modal Premium de Confirmación al Agregar al Carrito
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;

globalThis.location = {
    search: '',
    href: 'http://localhost/catalogo.html',
    pathname: '/catalogo.html'
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
    querySelectorAll: (sel) => mockElements[sel] || [],
    getElementById: (id) => elementsById[id] || null,
    createElement: (tag) => {
        let _id = '';
        const el = {
            get id() { return _id; },
            set id(v) { _id = v; elementsById[v] = el; },
            className: '',
            style: {},
            hidden: true,
            innerHTML: '',
            classList: {
                add: (c) => { el.className += ' ' + c; },
                remove: (c) => { el.className = (el.className || '').replace(c, '').trim(); },
                contains: (c) => (el.className || '').includes(c)
            },
            setAttribute: (k, v) => { if (k === 'id') el.id = v; },
            getAttribute: () => null,
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: (sel) => {
                if (sel === '#cart-modal-close-btn') return { addEventListener: () => {} };
                if (sel === '#cart-modal-continue-btn') return { addEventListener: () => {} };
                return null;
            }
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
        appendChild: (child) => { createdElements.push(child); }
    }
};

eval(fs.readFileSync('js/carrito.js', 'utf8'));

beforeEach(() => {
    mockElements = {};
    elementsById = {};
    createdElements = [];
});

test('CartAddedModal - mostrarModalAgregarCarrito renderiza correctamente el modal con los datos del producto', () => {
    assert.equal(typeof mostrarModalAgregarCarrito, 'function', 'mostrarModalAgregarCarrito debe ser una función exportada');

    mostrarModalAgregarCarrito({
        idProducto: 'p1',
        nombre: 'Khamrah',
        marca: 'Lattafa',
        imagen: 'img/productos/khamrah.webp',
        presentacion: 'Sellado · 100 ml',
        precioUnitario: 180.00,
        cantidadAgregada: 1,
        subtotalAccion: 180.00,
        totalProductosCarrito: 2
    });

    const modal = elementsById['cart-added-modal'];
    assert.ok(modal, 'El nodo cart-added-modal debe haber sido creado en el DOM');
    assert.equal(modal.hidden, false, 'El modal no debe estar oculto');
    assert.ok(modal.innerHTML.includes('¡Agregado a tu carrito!'), 'Debe contener el título de confirmación');
    assert.ok(modal.innerHTML.includes('Khamrah'), 'Debe incluir el nombre del perfume');
    assert.ok(modal.innerHTML.includes('Lattafa'), 'Debe incluir la marca');
    assert.ok(modal.innerHTML.includes('Sellado · 100 ml'), 'Debe incluir la presentación');
    assert.ok(modal.innerHTML.includes('Seguir comprando'), 'Debe incluir el botón Seguir comprando');
    assert.ok(modal.innerHTML.includes('Ir al carrito'), 'Debe incluir la acción Ir al carrito');
});

test('CartAddedModal - ocultarModalAgregarCarrito remueve la visibilidad del modal', () => {
    mostrarModalAgregarCarrito({
        idProducto: 'p1',
        nombre: 'Khamrah',
        marca: 'Lattafa',
        imagen: 'img/productos/khamrah.webp',
        presentacion: 'Sellado · 100 ml',
        precioUnitario: 180.00,
        cantidadAgregada: 1,
        subtotalAccion: 180.00,
        totalProductosCarrito: 1
    });

    const modal = elementsById['cart-added-modal'];
    ocultarModalAgregarCarrito();
    assert.equal(modal.classList.contains('is-visible'), false, 'La clase is-visible debe ser removida');
});
