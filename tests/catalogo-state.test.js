/**
 * Dunes Parfums - Tests unitarios para la conservación del estado del catálogo (FASE M10)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;

let mockSessionStorage = {};
globalThis.sessionStorage = {
    getItem: (key) => mockSessionStorage[key] || null,
    setItem: (key, val) => { mockSessionStorage[key] = String(val); },
    removeItem: (key) => { delete mockSessionStorage[key]; }
};

globalThis.location = {
    search: '',
    href: 'http://localhost/catalogo.html',
    pathname: '/catalogo.html'
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

globalThis.URL = class {
    constructor(href) {
        this.href = href;
        this.searchParams = new globalThis.URLSearchParams();
        this.pathname = '/catalogo.html';
        this.search = '';
    }
};

globalThis.history = {
    pushState: () => {}
};

globalThis.document = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    documentElement: { scrollHeight: 2000 }
};

globalThis.window.scrollY = 450;
globalThis.window.innerHeight = 800;

eval(fs.readFileSync('js/catalogo.js', 'utf8'));

beforeEach(() => {
    mockSessionStorage = {};
    globalThis.location.search = '';
    globalThis.window.scrollY = 450;
});

test('CatalogoStorage - Clave oficial dunes_catalog_state en sessionStorage', () => {
    const estado = {
        categoria: 'arabe',
        genero: 'hombre',
        busqueda: 'khamrah',
        orden: 'price-asc',
        soloDisponibles: true
    };

    guardarEstadoCatalogo(estado);

    const raw = mockSessionStorage['dunes_catalog_state'];
    assert.notEqual(raw, undefined, 'Debe guardar con la clave dunes_catalog_state');

    const parsed = JSON.parse(raw);
    assert.equal(parsed.categoria, 'arabe');
    assert.equal(parsed.genero, 'hombre');
    assert.equal(parsed.busqueda, 'khamrah');
    assert.equal(parsed.orden, 'price-asc');
    assert.equal(parsed.soloDisponibles, true);
    assert.equal(parsed.scrollY, 450);
    assert.notEqual(parsed.timestamp, undefined);
    assert.equal(parsed.productos, undefined, 'PROHIBIDO guardar array de productos completos');
});

test('CatalogoStorage - Expiración automática si tiene más de 2 horas', () => {
    const haceTresHoras = Date.now() - (3 * 60 * 60 * 1000);
    mockSessionStorage['dunes_catalog_state'] = JSON.stringify({
        categoria: 'nicho',
        genero: 'unisex',
        busqueda: '',
        orden: 'relevancia',
        soloDisponibles: false,
        scrollY: 200,
        timestamp: haceTresHoras
    });

    const guardado = obtenerEstadoCatalogoGuardado();
    assert.equal(guardado, null, 'Debe ignorar estados con más de 2 horas');
    assert.equal(mockSessionStorage['dunes_catalog_state'], undefined, 'Debe eliminar el estado vencido de sessionStorage');
});

test('CatalogoStorage - Manejo seguro de JSON corrupto', () => {
    mockSessionStorage['dunes_catalog_state'] = '{corrupt_json:';

    const guardado = obtenerEstadoCatalogoGuardado();
    assert.equal(guardado, null, 'Debe retornar null ante JSON corrupto');
    assert.equal(mockSessionStorage['dunes_catalog_state'], undefined, 'Debe eliminar la clave corrupta');
});

test('CatalogoStorage - Prioridad de parámetros de URL sobre el estado guardado', () => {
    mockSessionStorage['dunes_catalog_state'] = JSON.stringify({
        categoria: 'arabe',
        genero: 'hombre',
        busqueda: 'club de nuit',
        orden: 'price-desc',
        soloDisponibles: true,
        scrollY: 600,
        timestamp: Date.now()
    });

    globalThis.location.search = '?categoria=decants&genero=mujer';

    const res = resolverEstadoInicial();
    assert.equal(res.filtroEstado.categoria, 'decants', 'URL categoría decants invalida arabe guardado');
    assert.equal(res.filtroEstado.genero, 'mujer', 'URL género mujer invalida hombre guardado');
    assert.equal(res.filtroEstado.busqueda, 'club de nuit', 'Conserva la búsqueda guardada si no está en URL');
    assert.equal(res.filtroEstado.orden, 'price-desc', 'Conserva el ordenamiento guardado');
    assert.equal(res.savedScrollY, 600, 'Conserva el scrollY guardado');
});

test('CatalogoStorage - Limpiar filtros borra dunes_catalog_state de sessionStorage', () => {
    mockSessionStorage['dunes_catalog_state'] = JSON.stringify({
        categoria: 'nicho',
        genero: 'unisex',
        busqueda: 'baccarat',
        orden: 'price-asc',
        soloDisponibles: true,
        scrollY: 300,
        timestamp: Date.now()
    });

    limpiarEstadoCatalogoGuardado();

    assert.equal(mockSessionStorage['dunes_catalog_state'], undefined, 'sessionStorage debe quedar limpio');
});
