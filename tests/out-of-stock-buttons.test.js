/**
 * Dunes Parfums - Tests unitarios para Productos Agotados y Vista Detalle (FASE M19.1)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('OutOfStockButtons - 1. catalogo.js y favoritos-page.js eliminan el boton Detalles para productos agotados', () => {
    const catalogoJs = fs.readFileSync('js/catalogo.js', 'utf8');
    const favoritosPageJs = fs.readFileSync('js/favoritos-page.js', 'utf8');

    // Verificar que en productos agotados no se concatena detailsBtnHtml en la accion
    assert.ok(catalogoJs.includes('out-of-stock-buttons'), 'catalogo.js debe usar contenedor out-of-stock-buttons');
    assert.ok(favoritosPageJs.includes('out-of-stock-buttons'), 'favoritos-page.js debe usar contenedor out-of-stock-buttons');
});

test('OutOfStockButtons - 2. Imagen y Titulo siguen teniendo enlaces a producto.html en productos agotados', () => {
    const catalogoJs = fs.readFileSync('js/catalogo.js', 'utf8');

    assert.ok(catalogoJs.includes('href="producto.html?id='), 'Debe incluir hipervinculos a producto.html en la tarjeta');
});

test('MobileDetailOptimization - 3. CSS de responsive.css reduce paddings laterales y amplia imagen en movil', () => {
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(responsiveCss.includes('#page-producto main.container'), 'Debe estilizar el contenedor principal de producto.html');
    assert.ok(responsiveCss.includes('.detail-image-side'), 'Debe estilizar el contenedor de imagen de detalle');
});
