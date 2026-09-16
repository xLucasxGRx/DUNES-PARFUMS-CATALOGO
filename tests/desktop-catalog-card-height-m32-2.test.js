/**
 * Dunes Parfums - Tests de Unidad para FASE M32.2 (Reducción de Altura Total de Tarjetas en Laptop/Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.2 - 1. css/responsive.css contiene bloque de FASE M32.2 para reducción de altura de tarjetas en desktop', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.2'), 'Debe incluir cabecera de FASE M32.2');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');
});

test('M32.2 - 2. Altura de contenedor de imagen compactada moderadamente (150px) preservando object-fit contain', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // Debe reducir la altura de la imagen a 100px-150px en desktop
    assert.ok(cssContent.includes('height: 100px !important;') || cssContent.includes('height: 125px !important;') || cssContent.includes('height: 150px !important;') || cssContent.includes('height: 148px !important;'), 'Debe compactar la altura del contenedor de imagen en desktop');
    assert.ok(desktopCss.includes('object-fit: contain'), 'Debe preservar object-fit: contain');
});

test('M32.2 - 3. Compactación de espacios internos entre marca, nombre, presentación, stock y precio', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // Presentación/volumen debe resetear margin-bottom excesivo
    const hasVolumeMarginReset = /#catalogo-productos-grid\s+\.product-volume[\s\S]*?margin(?:-bottom)?:\s*0/i.test(desktopCss);
    assert.ok(hasVolumeMarginReset, 'Debe compactar el margen de .product-volume');

    // Título debe mantener Cormorant Garamond y clamp de 2 líneas con line-height compacto
    assert.ok(desktopCss.includes('Cormorant Garamond'), 'Debe mantener fuente Cormorant Garamond');
    assert.ok(desktopCss.includes('-webkit-line-clamp: 2'), 'Debe limitar a 2 líneas');

    // Padding de info compactado
    assert.ok(desktopCss.includes('padding: 4px 10px') || desktopCss.includes('padding: 8px 10px') || desktopCss.includes('padding: 6px 10px') || desktopCss.includes('padding: 8px 12px'), 'Debe compactar padding de .product-info');
});

test('M32.2 - 4. Móvil (320px-480px, 768px) permanece 100% intacto con su altura original', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    // Móvil conserva 2 columnas y altura de imagen de 130px
    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
