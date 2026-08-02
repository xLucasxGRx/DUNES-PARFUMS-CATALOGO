/**
 * Dunes Parfums - Unit tests for AGREGAR button in Mis Favoritos (favoritos-page.js)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new LocalStorageMock();
global.CustomEvent = class {
    constructor(type, opts) {
        this.type = type;
        this.detail = opts ? opts.detail : null;
    }
};

test('FavoritosAddToCart - favoritos.html includes script tags for carrito.js and favoritos-page.js', () => {
    const html = fs.readFileSync('favoritos.html', 'utf8');
    assert.ok(html.includes('js/carrito.js'), 'favoritos.html must include js/carrito.js');
    assert.ok(html.includes('js/favoritos-page.js'), 'favoritos.html must include js/favoritos-page.js');
});

test('FavoritosAddToCart - favoritos-page.js delegates click events on .btn-add-cart to window.carritoModulo.agregarAlCarrito', () => {
    const jsContent = fs.readFileSync('js/favoritos-page.js', 'utf8');
    
    assert.ok(
        jsContent.includes('agregarAlCarrito'),
        'favoritos-page.js must invoke window.carritoModulo.agregarAlCarrito when AGREGAR button is clicked'
    );
    assert.ok(
        jsContent.includes('.btn-add-cart'),
        'favoritos-page.js must handle .btn-add-cart click events'
    );
});
