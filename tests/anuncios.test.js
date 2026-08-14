/**
 * Dunes Parfums - Tests de Unidad e Integración para CORRECCIÓN PUNTUAL M23.4 (Sin Símbolos Predeterminados)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Environment mocks para Node test runner
global.window = {
    addEventListener: () => {}
};
global.document = {
    readyState: 'complete',
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({
        className: '',
        id: '',
        setAttribute: function(k, v) { this[k] = v; },
        removeAttribute: function(k) { delete this[k]; },
        appendChild: () => {},
        insertBefore: () => {},
        classList: {
            _classes: new Set(),
            add: function(c) { this._classes.add(c); },
            remove: function(c) { this._classes.delete(c); },
            contains: function(c) { return this._classes.has(c); }
        },
        innerHTML: '',
        style: {}
    })
};

const serviceCode = fs.readFileSync('js/anuncios-service.js', 'utf8');
eval(serviceCode.replace('const AnunciosService', 'global.AnunciosService'));

test('AnunciosService M23.2 - PRUEBA 1: Todos FALSE (FALSE, FALSE) -> 0 anuncios activos y array []', () => {
    const csvTodosFalse = [
        'activo,texto,orden',
        'FALSE,REALIZAMOS ENVÍOS POR AGENCIA A TODO EL PERÚ,1',
        'FALSE,"CUPÓN ""BIENVENIDO5"" CON S/5 DE DESCUENTO",2'
    ].join('\n');

    const lista = AnunciosService._procesarCSVAnuncios(csvTodosFalse);

    assert.ok(Array.isArray(lista));
    assert.strictEqual(lista.length, 0, 'Debe retornar exactamente 0 anuncios activos');
});

test('AnunciosService M23.2 - PRUEBA 2: TRUE, FALSE -> Muestra únicamente anuncio 1', () => {
    const csvUnTrue = [
        'activo,texto,orden',
        'TRUE,REALIZAMOS ENVÍOS POR AGENCIA A TODO EL PERÚ,1',
        'FALSE,"CUPÓN ""BIENVENIDO5"" CON S/5 DE DESCUENTO",2'
    ].join('\n');

    const lista = AnunciosService._procesarCSVAnuncios(csvUnTrue);

    assert.strictEqual(lista.length, 1);
    assert.strictEqual(lista[0].texto, 'REALIZAMOS ENVÍOS POR AGENCIA A TODO EL PERÚ');
});

test('AnunciosService M23.2 - PRUEBA 3: FALSE, TRUE -> Muestra únicamente anuncio 2', () => {
    const csvSegundoTrue = [
        'activo,texto,orden',
        'FALSE,REALIZAMOS ENVÍOS POR AGENCIA A TODO EL PERÚ,1',
        'TRUE,"CUPÓN ""BIENVENIDO5"" CON S/5 DE DESCUENTO",2'
    ].join('\n');

    const lista = AnunciosService._procesarCSVAnuncios(csvSegundoTrue);

    assert.strictEqual(lista.length, 1);
    assert.strictEqual(lista[0].texto, 'CUPÓN "BIENVENIDO5" CON S/5 DE DESCUENTO');
});

test('AnunciosService M23.2 - PRUEBA 4: TRUE, TRUE -> Retorna ambos anuncios ordenados', () => {
    const csvAmbosTrue = [
        'activo,texto,orden',
        'TRUE,ENVÍO POR AGENCIA,1',
        'TRUE,CUPÓN DESCUENTO,2'
    ].join('\n');

    const lista = AnunciosService._procesarCSVAnuncios(csvAmbosTrue);

    assert.strictEqual(lista.length, 2);
    assert.strictEqual(lista[0].texto, 'ENVÍO POR AGENCIA');
    assert.strictEqual(lista[1].texto, 'CUPÓN DESCUENTO');
});

test('AnunciosUI M23.4 - Eliminación total del símbolo $ e icono predeterminado', () => {
    const uiCode = fs.readFileSync('js/anuncios-ui.js', 'utf8');

    const headerNode = {
        className: 'header-main',
        id: 'header-main',
        firstChild: null,
        insertBefore: function(newNode, beforeNode) {
            this.firstChild = newNode;
        }
    };

    const createdElement = {
        className: '',
        id: '',
        setAttribute: function(k, v) { this[k] = v; },
        removeAttribute: function(k) { delete this[k]; },
        innerHTML: '',
        classList: {
            _classes: new Set(),
            add: function(c) { this._classes.add(c); },
            remove: function(c) { this._classes.delete(c); },
            contains: function(c) { return this._classes.has(c); }
        }
    };

    const mockDocument = {
        readyState: 'complete',
        getElementById: (id) => id === 'header-main' ? headerNode : null,
        querySelector: () => null,
        createElement: () => createdElement,
        addEventListener: () => {}
    };

    const evalFn = new Function('document', 'AnunciosService', uiCode + '\nreturn AnunciosUI;');
    const AnunciosUI = evalFn(mockDocument, AnunciosService);

    const barra = AnunciosUI._obtenerOCrearBarraDOM();
    assert.ok(barra);
    assert.ok(!barra.innerHTML.includes('announcement-badge'), 'No debe contener el contenedor de badge');
    assert.ok(!barra.innerHTML.includes('announcement-icon-svg'), 'No debe contener SVG predeterminado ($)');
    assert.ok(!barra.innerHTML.includes('$'), 'No debe contener el símbolo $');
});
