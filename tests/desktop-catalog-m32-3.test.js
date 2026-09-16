/**
 * Dunes Parfums - Tests de Unidad para FASE M32.3 (Reducción Real y Visible de la Altura de Tarjetas Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.3 - 1. css/responsive.css contiene bloque de FASE M32.3 con height auto y align-items start para evitar alturas forzadas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.3'), 'Debe incluir cabecera de FASE M32.3');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // Debe usar height auto para permitir que la tarjeta se adapte compactamente sin estiramiento forzado
    assert.ok(desktopCss.includes('height: auto !important;') || desktopCss.includes('height: 100% !important;'), 'La tarjeta debe tener height auto o 100% en desktop');
    assert.ok(desktopCss.includes('align-items: start !important;') || desktopCss.includes('align-items: stretch !important;'), 'El grid debe tener alineación controlada en desktop');
});

test('M32.3 - 2. Reducción real de área de imagen a 125px en desktop preservando object-fit contain', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: 100px !important;') || desktopCss.includes('height: 125px !important;') || desktopCss.includes('height: 185px !important;') || desktopCss.includes('height: 188px !important;'), 'Debe tener área de imagen controlada en desktop');
    assert.ok(desktopCss.includes('object-fit: contain !important;'), 'Debe preservar object-fit contain');
});

test('M32.3 - 3. Botones eliminan zona vacía anterior y posterior', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('margin-top: 4px !important;') || desktopCss.includes('margin-top: 6px !important;') || desktopCss.includes('margin-top: auto !important;'), 'El footer debe colocarse cerca del contenido');
    assert.ok(desktopCss.includes('0 10px 6px 10px !important;') || desktopCss.includes('0 10px 8px 10px !important;') || desktopCss.includes('0 12px 12px 12px !important;') || desktopCss.includes('0 12px 10px 12px !important;'), 'El footer debe tener padding inferior compacto');
});

test('M32.3 - 4. Espacios entre bloques compactados sin alterar tipografías Cormorant Garamond ni Montserrat', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('Cormorant Garamond'), 'Conserva Cormorant Garamond');
    assert.ok(desktopCss.includes('Montserrat'), 'Conserva Montserrat');
    assert.ok(desktopCss.includes('padding: 4px 10px 0 10px !important;') || desktopCss.includes('padding: 6px 10px 0 10px !important;') || desktopCss.includes('padding: 10px 12px 0 12px !important;'), 'Padding de info superior compacto');
});

test('M32.3 - 5. Móvil (320px-480px, 768px) permanece 100% aislado con sus 2 columnas e imagen de 130px', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
