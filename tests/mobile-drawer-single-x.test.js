/**
 * Dunes Parfums - Tests de Unidad para la Eliminación de Botón/Capas Duplicadas Detrás de la "X" (FASE REPARACIÓN DEFINITIVA)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('MobileDrawerSingleX - 1. body.menu-open oculta TODO .header-actions del header principal (Favoritos + Carrito + Hamburguesa)', () => {
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
    const estilosCss = fs.readFileSync('css/estilos.css', 'utf8');

    // Debe existir la regla que oculta .header-actions completo
    const ruleRegex = /body\.menu-open\s+\.header-actions[\s,{]/;
    assert.ok(ruleRegex.test(responsiveCss), 'responsive.css debe ocultar .header-actions completo en menu-open');
    assert.ok(ruleRegex.test(estilosCss), 'estilos.css debe ocultar .header-actions completo en menu-open');
});

test('MobileDrawerSingleX - 2. Pseudoelementos ::before y ::after deshabilitados en botones de cabecera y cierre', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('.mobile-drawer-close::before'), 'Debe incluir reset para mobile-drawer-close::before');
    assert.ok(css.includes('.mobile-drawer-close::after'), 'Debe incluir reset para mobile-drawer-close::after');
    assert.ok(css.includes('content: none !important;'), 'Debe usar content: none !important en pseudoelementos');
});

test('MobileDrawerSingleX - 3. mobile-drawer-close mantiene una única caja sin sombras múltiples', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');
    assert.ok(css.includes('.mobile-drawer-close'), 'Debe existir .mobile-drawer-close');
    assert.ok(css.includes('border-radius: 12px !important;'), 'Debe mantener un solo borde redondeado de 12px');
});
