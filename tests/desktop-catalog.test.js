/**
 * Dunes Parfums - Tests de Unidad e Integración para FASE M25 (Optimización de Catálogo Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M25 - 1. css/responsive.css contiene optimización aislada para desktop (min-width: 1024px)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M25 — OPTIMIZACIÓN EXCLUSIVA DEL CATÁLOGO EN LAPTOP / ESCRITORIO'), 'Debe incluir la cabecera de FASE M25');
    assert.ok(cssContent.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'), 'Debe definir 4 columnas para escritorio');
    assert.ok(cssContent.includes('height: 185px !important;'), 'Debe compactar la altura del contenedor de imagen a 185px');
    assert.ok(cssContent.includes('margin-top: auto !important;'), 'Debe alinear el footer de la tarjeta al fondo');
});

test('M25 - 2. Móvil permanece intacto y la grilla móvil preserva 2 columnas e imagen de 130px', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});

test('M25 - 3. Alineación del botón CONSULTAR para productos agotados en desktop', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('.product-card-footer .card-buttons-flex.out-of-stock-buttons'), 'Debe estilizar los botones de productos agotados');
    assert.ok(cssContent.includes('justify-content: center !important;'), 'Debe centrar y alinear los botones de productos agotados');
});

test('M25.1 - 1. Botones desktop alinean ícono y texto en una sola fila horizontal', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('flex-direction: row !important;'), 'Debe forzar dirección horizontal en los botones de escritorio');
    assert.ok(cssContent.includes('white-space: nowrap !important;'), 'Debe evitar saltos de línea dentro del botón');
    assert.ok(cssContent.includes('display: inline-block !important;'), 'Debe mostrar el ícono SVG de forma visible en línea');
});

test('M25.1 - 2. Botón CONSULTAR en productos agotados ocupa el 100% de la fila de acciones en desktop', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('width: 100% !important;'), 'CONSULTAR debe ocupar el 100% del ancho disponible');
    assert.ok(cssContent.includes('height: 40px !important;'), 'Todos los botones principales deben compartir 40px de altura');
});

