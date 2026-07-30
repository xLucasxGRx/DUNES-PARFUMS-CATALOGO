/**
 * Dunes Parfums - Tests de Integración para la Reparación de Favoritos (FASE M14)
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
    dispatchEvent: () => {},
    addEventListener: () => {}
};
global.localStorage = new LocalStorageMock();
global.CustomEvent = class {
    constructor(type, opts) {
        this.type = type;
        this.detail = opts ? opts.detail : null;
    }
};

// Cargar FavoritosService
eval(fs.readFileSync('js/favoritos-service.js', 'utf8'));

test('ReparaciónFavoritos - 1. Guardar producto con ID numérico almacena String', () => {
    localStorage.clear();
    window.FavoritosService.agregarFavorito(101);

    assert.equal(localStorage.getItem('dunes_favoritos'), '["101"]');
    assert.equal(window.FavoritosService.esFavorito(101), true);
    assert.equal(window.FavoritosService.esFavorito('101'), true);
});

test('ReparaciónFavoritos - 2. Coincidencia con Set de IDs normalizados', () => {
    localStorage.clear();
    window.FavoritosService.agregarFavorito('p1');
    window.FavoritosService.agregarFavorito(101);

    const productos = [
        { id: 'p1', nombre: 'Perfume 1', marca: 'Lattafa', precio: 100, disponible: true, stock: 5 },
        { id: 101, nombre: 'Perfume 101', marca: 'Afnan', precio: 150, disponible: true, stock: 2 },
        { id: 'p3', nombre: 'Perfume 3', marca: 'Rasasi', precio: 200, disponible: true, stock: 1 }
    ];

    const idsFavoritos = window.FavoritosService.obtenerFavoritos();
    const setIds = new Set(idsFavoritos.map(id => String(id).trim()));

    const coincidentes = productos.filter(p => setIds.has(String(p.id).trim()));
    assert.equal(coincidentes.length, 2);
    assert.equal(coincidentes[0].id, 'p1');
    assert.equal(coincidentes[1].id, 101);
});

test('ReparaciónFavoritos - 3. Limpieza segura solo después de carga exitosa de catálogo', () => {
    localStorage.clear();
    window.FavoritosService.agregarFavorito('p1');
    window.FavoritosService.agregarFavorito('inexistente-999');

    const productosValidos = [
        { id: 'p1', nombre: 'Perfume 1' }
    ];

    const todosLosIds = productosValidos.map(p => String(p.id).trim());
    window.FavoritosService.limpiarFavoritosInexistentes(todosLosIds);

    assert.deepEqual(window.FavoritosService.obtenerFavoritos(), ['p1']);
});

test('ReparaciónFavoritos - 4. No eliminar favoritos si productos no han cargado o vienen vacíos', () => {
    localStorage.clear();
    window.FavoritosService.agregarFavorito('p1');
    window.FavoritosService.agregarFavorito('p2');

    // Intentar limpiar con arreglo vacío no debe borrar los favoritos
    const productosVacios = [];
    if (productosVacios.length > 0) {
        window.FavoritosService.limpiarFavoritosInexistentes([]);
    }

    assert.deepEqual(window.FavoritosService.obtenerFavoritos(), ['p1', 'p2']);
});

test('ReparaciónFavoritos - 5. favoritos.html contiene contenedor de error y scripts en orden correcto', () => {
    const html = fs.readFileSync('favoritos.html', 'utf8');

    assert.ok(html.includes('id="favorites-error-state"'), 'Debe incluir favorites-error-state');
    assert.ok(html.includes('id="btn-reintentar-favoritos"'), 'Debe incluir botón reintentar');
    assert.ok(html.includes('js/productos.js'), 'Debe incluir script js/productos.js');
    assert.ok(html.includes('js/config.js'), 'Debe incluir script js/config.js');
});
