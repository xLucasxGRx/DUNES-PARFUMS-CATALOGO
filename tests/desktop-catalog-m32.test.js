/**
 * Dunes Parfums - Tests de Unidad para FASE M32 (Reducción de tamaño de tarjetas del catálogo en Laptop/Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32 - 1. css/responsive.css contiene reglas de FASE M32 con grid centrado y max-width controlado', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32 — REDUCCIÓN DE TAMAÑO DE TARJETAS DEL CATÁLOGO EN LAPTOP/DESKTOP'), 'Debe incluir la cabecera de FASE M32');
    assert.ok(cssContent.includes('#page-catalogo main.container') || cssContent.includes('#page-catalogo #catalogo-productos-grid'), 'Debe definir reglas para el catálogo en desktop');
    assert.ok(cssContent.includes('max-width: 1060px') || cssContent.includes('max-width: 1080px'), 'Debe limitar el ancho máximo del catálogo para dejar márgenes laterales visibles');
    assert.ok(cssContent.includes('margin-inline: auto') || cssContent.includes('margin: 0 auto'), 'Debe centrar el contenedor del catálogo');
});

test('M32 - 2. Laptop y Desktop (1024px, 1366px, 1440px, 1920px) mantienen 4 columnas compactas sin quinta columna', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    // Comprobar que en 1920px el catálogo NO tiene 5 columnas
    const block1920 = cssContent.slice(cssContent.indexOf('@media screen and (min-width: 1920px)'));
    assert.ok(block1920.includes('#catalogo-productos-grid'), 'Debe tener regla específica para #catalogo-productos-grid en 1920px');
    assert.ok(block1920.includes('repeat(4,'), 'Debe mantener 4 columnas en 1920px para el catálogo en lugar de expandir a 5');
});

test('M32 - 3. Tarjeta de producto compacta en desktop con tipografía legible y proporciones cuidadas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('object-fit: contain'), 'Debe mantener object-fit: contain para la imagen');
    assert.ok(cssContent.includes('Cormorant Garamond'), 'Debe mantener la fuente Cormorant Garamond');
    assert.ok(cssContent.includes('height: 100px !important;') || cssContent.includes('height: 125px !important;') || cssContent.includes('height: 150px !important;') || cssContent.includes('height: 185px !important;'), 'Debe mantener altura compacta de imagen');
    assert.ok(cssContent.includes('height: 34px !important;') || cssContent.includes('height: 36px !important;') || cssContent.includes('height: 40px !important;') || cssContent.includes('height: 38px !important;'), 'Debe mantener altura de botones unificada');
});

test('M32 - 4. Móvil permanece 100% aislado e intacto con 2 columnas y sin contaminación', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
