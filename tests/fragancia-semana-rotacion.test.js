const test = require('node:test');
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
global.window = {};

const codeProductos = fs.readFileSync('js/productos.js', 'utf8');

function setupMock(mockProductos) {
    global.ProductosService = {
        cargarProductos: async () => ({ productos: mockProductos })
    };
    eval(codeProductos);
}

test('RotaciónFraganciaSemana - 1. Si hay 0 ofertas válidas retorna null', async () => {
    localStorage.clear();

    const mockProductos = [
        { id: 'p1', nombre: 'Perfume 1', oferta: false, visible: true, precio: 100, precio_oferta: 90, imagen: 'img/p1.webp' },
        { id: 'p2', nombre: 'Perfume 2', oferta: true, visible: false, precio: 120, precio_oferta: 100, imagen: 'img/p2.webp' }
    ];

    setupMock(mockProductos);

    const res = await window.productosModulo.obtenerProductoOferta();
    assert.equal(res, null);
});

test('RotaciónFraganciaSemana - 2. Si hay 1 sola oferta la selecciona y guarda ID en localStorage', async () => {
    localStorage.clear();

    const mockProductos = [
        { id: 'p10', nombre: 'Khamrah', oferta: true, visible: true, precio: 180, precio_oferta: 155, imagen: 'img/khamrah.webp' }
    ];

    setupMock(mockProductos);

    const res = await window.productosModulo.obtenerProductoOferta();
    assert.ok(res);
    assert.equal(res.id, 'p10');
    assert.equal(localStorage.getItem('dunes_ultima_oferta_inicio'), 'p10');
});

test('RotaciónFraganciaSemana - 3. Si hay 3 ofertas, no repite inmediatamente la última mostrada', async () => {
    localStorage.clear();

    const mockProductos = [
        { id: 'p1', nombre: 'Oferta A', oferta: true, visible: true, precio: 100, precio_oferta: 80, imagen: 'img/a.webp' },
        { id: 'p2', nombre: 'Oferta B', oferta: true, visible: true, precio: 150, precio_oferta: 120, imagen: 'img/b.webp' },
        { id: 'p3', nombre: 'Oferta C', oferta: true, visible: true, precio: 200, precio_oferta: 170, imagen: 'img/c.webp' }
    ];

    setupMock(mockProductos);

    localStorage.setItem('dunes_ultima_oferta_inicio', 'p1');

    const res1 = await window.productosModulo.obtenerProductoOferta();
    assert.ok(res1);
    assert.notEqual(res1.id, 'p1', 'No debe repetir p1 inmediatamente');
    assert.ok(['p2', 'p3'].includes(res1.id));
    assert.equal(localStorage.getItem('dunes_ultima_oferta_inicio'), res1.id);

    setupMock(mockProductos);
    const res2 = await window.productosModulo.obtenerProductoOferta();
    assert.ok(res2);
    assert.notEqual(res2.id, res1.id, 'No debe repetir res1.id inmediatamente');
});

test('RotaciónFraganciaSemana - 4. Excluye productos sin precio_oferta o sin imagen', async () => {
    localStorage.clear();

    const mockProductos = [
        { id: 'p1', nombre: 'Incompleto', oferta: true, visible: true, precio: 100, precio_oferta: null, imagen: 'img/a.webp' },
        { id: 'p2', nombre: 'Valido', oferta: true, visible: true, precio: 150, precio_oferta: 120, imagen: 'img/b.webp' }
    ];

    setupMock(mockProductos);

    const res = await window.productosModulo.obtenerProductoOferta();
    assert.ok(res);
    assert.equal(res.id, 'p2');
});
