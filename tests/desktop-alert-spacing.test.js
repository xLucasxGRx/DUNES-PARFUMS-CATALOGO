/**
 * Dunes Parfums - Tests unitarios para las Alertas y Espaciados de Checkout en Laptop (>= 768px)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('DesktopAlertSpacing - CSS responsive incluye estilos aislados para laptop (min-width: 768px)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('@media (min-width: 768px)'), 'Debe incluir bloque @media (min-width: 768px)');
    assert.ok(cssContent.includes('.seccion-entrega-subtitle'), 'Debe estilizar .seccion-entrega-subtitle');
});

test('DesktopAlertSpacing - HTML de carrito.html no tiene margin-top negativo en el subtitulo', () => {
    const htmlContent = fs.readFileSync('carrito.html', 'utf8');

    assert.equal(htmlContent.includes('margin-top: -10px'), false, 'El subtítulo no debe tener margin-top: -10px');
    assert.ok(htmlContent.includes('seccion-entrega-subtitle'), 'El subtítulo debe tener la clase seccion-entrega-subtitle');
});
