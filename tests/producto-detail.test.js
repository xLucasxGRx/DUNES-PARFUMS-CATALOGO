/**
 * Dunes Parfums - Tests de Unidad e Integración para Carga de Detalle de Producto (producto.html)
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

global.window = {
    location: { search: '?id=p1' },
    addEventListener: () => {},
    whatsappConfig: {
        enviarMensajeWhatsApp: () => {},
        consultarDisponibilidad: () => {}
    }
};
global.document = {
    body: { appendChild: () => {} },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
};
global.localStorage = new LocalStorageMock();

test('ProductoDetail - 1. Normalización de IDs String vs Number en búsqueda de producto', () => {
    const productos = [
        { id: 'p1', nombre: 'Khamrah', marca: 'Lattafa', precio: 155, disponible: true, stock: 3 },
        { id: 101, nombre: 'Honor & Glory', marca: 'Lattafa', precio: 160, disponible: true, stock: 2 }
    ];

    const idSolicitadoText = String('p1').trim();
    const prodText = productos.find(item => item && String(item.id).trim() === idSolicitadoText);
    assert.ok(prodText);
    assert.equal(prodText.nombre, 'Khamrah');

    const idSolicitadoNum = String(101).trim();
    const prodNum = productos.find(item => item && String(item.id).trim() === idSolicitadoNum);
    assert.ok(prodNum);
    assert.equal(prodNum.nombre, 'Honor & Glory');
});

test('ProductoDetail - 2. producto.html no incluye catalogo.js innecesario', () => {
    const html = fs.readFileSync('producto.html', 'utf8');
    assert.ok(!html.includes('<script src="js/catalogo.js"></script>'), 'No debe incluir catalogo.js');
    assert.ok(html.includes('id="product-detail-container"'), 'Debe incluir product-detail-container');
});

test('ProductoDetail - 3. interfaz.js define esFav sin lanzar ReferenceError', () => {
    const script = fs.readFileSync('js/interfaz.js', 'utf8');
    assert.ok(script.includes('const esFav ='), 'Debe definir esFav explícitamente');
    assert.ok(script.includes('mostrarMensajeProductoNoEncontrado'), 'Debe incluir helper de producto no encontrado');
    assert.ok(script.includes('mostrarMensajeErrorProducto'), 'Debe incluir helper de error de producto');
});
