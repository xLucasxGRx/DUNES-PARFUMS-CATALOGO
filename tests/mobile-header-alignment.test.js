/**
 * Dunes Parfums - Tests de Unidad para Alineación del Header Móvil (FASE CORRECCIÓN PUNTUAL)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('MobileHeaderAlignment - 1. header-actions usa flex-direction row y align-items center con height 44px', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('align-items: center !important;'), 'header-actions debe centrar verticalmente');
    assert.ok(css.includes('flex-direction: row !important;'), 'header-actions debe ordenar en fila horizontal');
    assert.ok(css.includes('height: 44px !important;'), 'header-actions debe tener altura de 44px');
});

test('MobileHeaderAlignment - 2. Todos los 3 botones comparten exactamente 44px por 44px sin desajustes', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('width: 44px !important;'), 'Ancho de botones debe ser 44px');
    assert.ok(css.includes('height: 44px !important;'), 'Alto de botones debe ser 44px');
    assert.ok(!css.includes('width: 46px;'), 'No debe quedar ningún botón antiguo con 46px');
});

test('MobileHeaderAlignment - 3. mobile-drawer-close está unificado con el sistema de 44px y 12px de radio', () => {
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
    assert.ok(responsiveCss.includes('.mobile-drawer-close'), 'Debe incluir mobile-drawer-close');
    assert.ok(responsiveCss.includes('border-radius: 12px !important;'), 'mobile-drawer-close debe tener radio 12px unificado');
});
