/**
 * Dunes Parfums - Tests unitarios para la recomendación de Productos Relacionados (FASE M21)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;
globalThis.document = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null
};

// Cargar motor de interfaz/relacionados
eval(fs.readFileSync('js/interfaz.js', 'utf8'));

test('ProductosRelacionados - 1. normalizarTexto limpia acentos, espacios y mayúsculas', () => {
    assert.equal(window.normalizarTexto('  Árabe '), 'arabe');
    assert.equal(window.normalizarTexto('Lattafa'), 'lattafa');
    assert.equal(window.normalizarTexto('  Diseñador  '), 'disenador');
    assert.equal(window.normalizarTexto(null), '');
});

test('ProductosRelacionados - 2. calcularPuntuacionRelacion otorga +100 por categoría y +25 por marca', () => {
    const prodActual = { id: 'p1', marca: 'Lattafa', categoria: 'arabe' };
    const candMismaCatMarca = { id: 'p2', marca: 'Lattafa', categoria: 'arabe' };
    const candMismaCatDiffMarca = { id: 'p3', marca: 'Afnan', categoria: 'arabe' };
    const candDiffCatMismaMarca = { id: 'p4', marca: 'Lattafa', categoria: 'disenador' };
    const candDiffTodo = { id: 'p5', marca: 'Dior', categoria: 'disenador' };

    assert.equal(window.calcularPuntuacionRelacion(prodActual, candMismaCatMarca), 125);
    assert.equal(window.calcularPuntuacionRelacion(prodActual, candMismaCatDiffMarca), 100);
    assert.equal(window.calcularPuntuacionRelacion(prodActual, candDiffCatMismaMarca), 25);
    assert.equal(window.calcularPuntuacionRelacion(prodActual, candDiffTodo), 0);
});

test('ProductosRelacionados - 3. Excluye el producto actual (soporta ID String vs Number)', () => {
    const prodActual = { id: 10, marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true };
    const productos = [
        { id: '10', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 11, marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 12, marca: 'Afnan', categoria: 'arabe', disponible: true, stock: 5, visible: true }
    ];

    const rel = window.obtenerProductosRelacionados(prodActual, productos, 4);
    assert.equal(rel.length, 2);
    assert.ok(!rel.some(p => String(p.id).trim() === '10'), 'No debe incluir el producto actual');
});

test('ProductosRelacionados - 4. Excluye productos agotados (stock 0 / disponible false) u ocultos (visible false)', () => {
    const prodActual = { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true };
    const productos = [
        { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p2', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 0, visible: true }, // Agotado
        { id: 'p3', marca: 'Lattafa', categoria: 'arabe', disponible: false, stock: 5, visible: true }, // No disponible
        { id: 'p4', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: false }, // Oculto
        { id: 'p5', marca: 'Afnan', categoria: 'arabe', disponible: true, stock: 5, visible: true } // Válido
    ];

    const rel = window.obtenerProductosRelacionados(prodActual, productos, 4);
    assert.equal(rel.length, 1);
    assert.equal(rel[0].id, 'p5');
});

test('ProductosRelacionados - 5. Máximo 4 productos relacionados únicos', () => {
    const prodActual = { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true };
    const productos = [
        { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p2', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p3', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p4', marca: 'Afnan', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p5', marca: 'Rasasi', categoria: 'arabe', disponible: true, stock: 5, visible: true },
        { id: 'p6', marca: 'Armaf', categoria: 'arabe', disponible: true, stock: 5, visible: true }
    ];

    const rel = window.obtenerProductosRelacionados(prodActual, productos, 4);
    assert.equal(rel.length, 4);

    const idsUnicos = new Set(rel.map(p => String(p.id).trim()));
    assert.equal(idsUnicos.size, 4, 'Todos los IDs deben ser únicos');
});

test('ProductosRelacionados - 6. Fallback automático cuando la misma categoría tiene pocos candidatos', () => {
    const prodActual = { id: 'n1', marca: 'Xerjoff', categoria: 'nicho', disponible: true, stock: 5, visible: true };
    const productos = [
        { id: 'n1', marca: 'Xerjoff', categoria: 'nicho', disponible: true, stock: 5, visible: true },
        { id: 'n2', marca: 'Creed', categoria: 'nicho', disponible: true, stock: 5, visible: true }, // Misma cat (100)
        { id: 'd1', marca: 'Xerjoff', categoria: 'disenador', disponible: true, stock: 5, visible: true }, // Misma marca (25)
        { id: 'a1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true }, // Fallback (0)
        { id: 'a2', marca: 'Afnan', categoria: 'arabe', disponible: true, stock: 5, visible: true } // Fallback (0)
    ];

    const rel = window.obtenerProductosRelacionados(prodActual, productos, 4);
    assert.equal(rel.length, 4);
    assert.equal(rel[0].id, 'n2', 'El candidato de la misma categoría debe ir primero');
    assert.equal(rel[1].id, 'd1', 'El candidato de la misma marca debe ir segundo');
});

test('ProductosRelacionados - 7. Retorna array vacío si el catálogo solo contiene el producto actual', () => {
    const prodActual = { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true };
    const productos = [
        { id: 'p1', marca: 'Lattafa', categoria: 'arabe', disponible: true, stock: 5, visible: true }
    ];

    const rel = window.obtenerProductosRelacionados(prodActual, productos, 4);
    assert.equal(rel.length, 0);
});
