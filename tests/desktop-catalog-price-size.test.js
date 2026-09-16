/**
 * Dunes Parfums - Tests de Unidad para Reducción Equilibrada de Tamaño de Precios en Laptop/Desktop
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('DesktopPriceSize - 1. estilos.css define un tamaño moderado y elegante para .price-current y .price-old', () => {
    const estilosCss = fs.readFileSync(path.join(__dirname, '../css/estilos.css'), 'utf8');

    assert.ok(estilosCss.includes('.price-current'), 'Debe existir .price-current en estilos.css');
    // No debe usar los tamaños sobredimensionados anteriores (clamp(22px, 1.8vw, 26px))
    assert.ok(!estilosCss.includes('clamp(22px, 1.8vw, 26px)'), 'No debe tener tamaño gigante de 22px-26px');
    assert.ok(estilosCss.includes('clamp(17px,') || estilosCss.includes('font-size: 18px'), 'Debe definir un tamaño reducido y refinado');
});

test('DesktopPriceSize - 2. responsive.css aplica reducción calibrada para precio actual y precio tachado en desktop (>= 992px)', () => {
    const responsiveCss = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');

    assert.ok(
        responsiveCss.includes('#catalogo-productos-grid .price-current') &&
        (responsiveCss.includes('font-size: 18px !important;') || responsiveCss.includes('font-size: 17.5px !important;') || responsiveCss.includes('font-size: 1.15rem !important;')),
        'Debe definir tamaño calibrado de precio en desktop'
    );

    assert.ok(
        responsiveCss.includes('#catalogo-productos-grid .price-old') &&
        (responsiveCss.includes('font-size: 11.5px !important;') || responsiveCss.includes('font-size: 12px !important;') || responsiveCss.includes('font-size: 0.8rem !important;')),
        'Debe definir tamaño proporcional para el precio tachado en desktop'
    );
});

test('DesktopPriceSize - 3. Móvil preserva su tamaño de 14.5px aislado', () => {
    const responsiveCss = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');

    assert.ok(responsiveCss.includes('font-size: 14.5px !important;'), 'Móvil debe preservar 14.5px');
});
