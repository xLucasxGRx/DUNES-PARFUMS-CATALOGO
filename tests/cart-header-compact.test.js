/**
 * Dunes Parfums - Tests unitarios para la Compactación de Cabecera en carrito.html
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('CartHeaderCompact - carrito.html mantiene todos los textos exactos en la cabecera', () => {
    const htmlContent = fs.readFileSync('carrito.html', 'utf8');

    assert.ok(htmlContent.includes('Tu Pedido') || htmlContent.includes('TU PEDIDO'), 'Debe conservar el subtítulo Tu Pedido');
    assert.ok(htmlContent.includes('MI CARRITO'), 'Debe conservar el título MI CARRITO');
    assert.ok(
        htmlContent.includes('Revisa tus productos, selecciona la forma de entrega y confirma tu pedido.'),
        'Debe conservar el texto completo de descripción'
    );
});

test('CartHeaderCompact - CSS responsive define compactación aislada para #page-carrito', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('#page-carrito .section-header'), 'Debe estilizar #page-carrito .section-header');
    assert.ok(
        cssContent.includes('#page-carrito main.section-padding'),
        'Debe ajustar el padding-top de #page-carrito main.section-padding'
    );
});
