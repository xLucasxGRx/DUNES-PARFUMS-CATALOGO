/**
 * Dunes Parfums - Tests unitarios para FavoritosService (FASE M14)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Simulación de entorno DOM para Node.js
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

// Carga directa del script FavoritosService
eval(fs.readFileSync('js/favoritos-service.js', 'utf8'));

test('FavoritosService - obtenerFavoritos retorna array vacio por defecto', () => {
    localStorage.clear();
    const favs = window.favoritosService.obtenerFavoritos();
    assert.deepEqual(favs, []);
    assert.equal(window.favoritosService.obtenerCantidadFavoritos(), 0);
});

test('FavoritosService - agregarFavorito normaliza a string y guarda en dunes_favoritos', () => {
    localStorage.clear();
    const resultado = window.favoritosService.agregarFavorito(105);
    assert.equal(resultado, true);
    assert.equal(window.favoritosService.esFavorito('105'), true);
    assert.equal(window.favoritosService.esFavorito(105), true);
    assert.equal(window.favoritosService.obtenerCantidadFavoritos(), 1);

    const raw = JSON.parse(localStorage.getItem('dunes_favoritos'));
    assert.deepEqual(raw, ['105']);
});

test('FavoritosService - alternarFavorito agrega y quita correctamente', () => {
    localStorage.clear();
    assert.equal(window.favoritosService.alternarFavorito('12'), true);
    assert.equal(window.favoritosService.esFavorito('12'), true);

    assert.equal(window.favoritosService.alternarFavorito('12'), false);
    assert.equal(window.favoritosService.esFavorito('12'), false);
    assert.equal(window.favoritosService.obtenerCantidadFavoritos(), 0);
});

test('FavoritosService - tolera JSON corrupto o no valido en localStorage', () => {
    localStorage.setItem('dunes_favoritos', 'JSON_CORRUPTO{{{');
    const favs = window.favoritosService.obtenerFavoritos();
    assert.deepEqual(favs, []);

    // Debe permitir agregar a pesar de corrupcion previa
    window.favoritosService.agregarFavorito('3');
    assert.deepEqual(window.favoritosService.obtenerFavoritos(), ['3']);
});

test('FavoritosService - limpiarFavoritosInexistentes elimina IDs obsoletos', () => {
    localStorage.clear();
    window.favoritosService.agregarFavorito('1');
    window.favoritosService.agregarFavorito('2');
    window.favoritosService.agregarFavorito('99'); // Obsoleto

    window.favoritosService.limpiarFavoritosInexistentes(['1', '2', '3']);
    assert.deepEqual(window.favoritosService.obtenerFavoritos(), ['1', '2']);
});
