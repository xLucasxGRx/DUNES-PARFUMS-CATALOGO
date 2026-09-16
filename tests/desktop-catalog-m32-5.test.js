/**
 * Dunes Parfums - Tests de Unidad para FASE M32.5 (Corrección de Altura Vertical de Tarjetas en Laptop / PC)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.5 - 1. css/responsive.css contiene cabecera de FASE M32.5 e incluye #productos-destacados-grid en desktop', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.5'), 'Debe incluir cabecera de FASE M32.5');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('#productos-destacados-grid'), 'Debe incluir #productos-destacados-grid explícitamente');
    assert.ok(desktopCss.includes('height: auto !important;') || desktopCss.includes('height: 100% !important;'), 'La tarjeta debe tener height configurado en desktop');
    assert.ok(desktopCss.includes('align-items: start !important;') || desktopCss.includes('align-items: stretch !important;'), 'El grid no debe forzar alturas desproporcionadas');
});

test('M32.5 - 2. Reducción y limitación estricta de área de imagen con object-fit contain y contenedor de enlace', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: 100px !important;') || desktopCss.includes('height: 185px !important;') || desktopCss.includes('height: 188px !important;'), 'Debe compactar el área de imagen en desktop');
    assert.ok(desktopCss.includes('object-fit: contain !important;'), 'Debe preservar object-fit contain sin deformar frascos');
    assert.ok(desktopCss.includes('.product-img-link'), 'Debe estilizar el enlace contenedor de imagen para evitar desbordes');
});

test('M32.5 - 3. Título de producto no genera alturas vacías artificiales y estiliza enlace limpio', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('.product-title-link'), 'Debe definir regla separada para .product-title-link');
    assert.ok(desktopCss.includes('display: inline !important;'), 'El enlace de título debe comportarse como inline sin estirar la caja');
});

test('M32.5 - 4. css/estilos.css elimina la altura base de 310px para evitar fallbacks desproporcionados', () => {
    const estilosContent = fs.readFileSync('css/estilos.css', 'utf8');

    assert.ok(!estilosContent.includes('clamp(270px, 20vw, 310px)'), 'No debe tener clamp excesivo de 270px-310px en estilos.css');
    assert.ok(estilosContent.includes('clamp(100px, 12vw, 130px)') || estilosContent.includes('clamp(150px, 14vw, 185px)') || estilosContent.includes('clamp(150px, 14vw, 188px)'), 'Debe tener clamp compacto en estilos.css');
});

test('M32.5 - 5. Móvil (320px-480px, 768px) permanece 100% aislado e intacto con sus 2 columnas e imagen de 130px', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
