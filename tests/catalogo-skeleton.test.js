/**
 * Dunes Parfums - Tests unitarios para el Skeleton de Carga y Optimización de Imágenes (FASE M11)
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

globalThis.history = { pushState: () => {} };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let mockElements = {};
globalThis.document = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => mockElements[id] || null,
    documentElement: { scrollHeight: 2000 }
};

eval(fs.readFileSync('js/catalogo.js', 'utf8'));

beforeEach(() => {
    mockElements = {
        'results-count': { textContent: '' },
        'estado-catalogo': { style: { display: 'none' } }
    };
});

test('CatalogoSkeleton - obtenerCantidadSkeletons devuelve la cantidad correcta según el breakpoint', () => {
    globalThis.window.innerWidth = 360;
    assert.equal(obtenerCantidadSkeletons(), 3, 'Móvil pequeño debe retornar 3 skeletons');

    globalThis.window.innerWidth = 600;
    assert.equal(obtenerCantidadSkeletons(), 6, 'Tablet debe retornar 6 skeletons');

    globalThis.window.innerWidth = 1280;
    assert.equal(obtenerCantidadSkeletons(), 8, 'Escritorio debe retornar 8 skeletons');
});

test('CatalogoSkeleton - mostrarSkeletonsCatalogo renderiza los nodos skeleton e inactiva el mensaje 0 productos', () => {
    const grid = {
        style: {},
        classList: { add: () => {}, remove: () => {} },
        innerHTML: ''
    };

    globalThis.window.innerWidth = 375;
    mostrarSkeletonsCatalogo(grid);

    assert.ok(grid.innerHTML.includes('product-card-skeleton'), 'Debe incluir tarjetas de skeleton');
    assert.ok(grid.innerHTML.includes('skeleton-pulse'), 'Debe incluir elementos con animación shimmer pulse');
    assert.equal(mockElements['results-count'].textContent, 'Cargando productos...', 'El contador no debe mostrar 0 productos');
});

test('CatalogoSkeleton - mostrarErrorCargaCatalogo renderiza el estado de error y botón Reintentar', () => {
    const grid = {
        style: {},
        classList: { add: () => {}, remove: () => {} },
        innerHTML: ''
    };

    let reintentado = false;
    mostrarErrorCargaCatalogo(grid, () => {
        reintentado = true;
    });

    assert.ok(grid.innerHTML.includes('No fue posible cargar el catálogo en este momento'), 'Debe incluir el mensaje oficial de error');
    assert.ok(grid.innerHTML.includes('btn-reintentar-catalogo'), 'Debe incluir el botón Reintentar');
});
