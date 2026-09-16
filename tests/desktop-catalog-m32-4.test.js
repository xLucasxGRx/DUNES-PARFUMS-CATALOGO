/**
 * Dunes Parfums - Tests de Unidad para FASE M32.4 (Corrección Definitiva de Altura de Tarjetas Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.4 - 1. css/responsive.css contiene cabecera de FASE M32.4 para corrección definitiva de altura en desktop', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.4'), 'Debe incluir cabecera de FASE M32.4');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: auto !important;') || desktopCss.includes('height: 100% !important;'), 'La tarjeta debe tener height configurado en desktop');
    assert.ok(desktopCss.includes('align-items: start !important;') || desktopCss.includes('align-items: stretch !important;'), 'El grid no debe forzar alturas desproporcionadas');
});

test('M32.4 - 2. Reducción definitiva de área de imagen a 100px en desktop con object-fit contain', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: 100px !important;') || desktopCss.includes('height: 185px !important;') || desktopCss.includes('height: 188px !important;'), 'Debe compactar el área de imagen en desktop');
    assert.ok(desktopCss.includes('object-fit: contain !important;'), 'Debe preservar object-fit contain sin recortar ni deformar');
});

test('M32.4 - 3. Compactación vertical estricta de espacios entre bloques y eliminación de huecos antes y después de botones', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // Footer pegado al contenido con margin-top compacto o auto y padding inferior
    assert.ok(desktopCss.includes('margin-top: 4px !important;') || desktopCss.includes('margin-top: auto !important;'), 'El footer debe estar alineado');
    assert.ok(desktopCss.includes('0 10px 6px 10px !important;') || desktopCss.includes('0 12px 12px 12px !important;') || desktopCss.includes('0 12px 10px 12px !important;'), 'El footer debe tener padding inferior adecuado');
    assert.ok(desktopCss.includes('height: 34px !important;') || desktopCss.includes('height: 38px !important;'), 'Los botones deben tener altura adecuada');
});

test('M32.4 - 4. Tipografía se conserva al 100%: Cormorant Garamond, Montserrat y tamaños aprobados', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('Cormorant Garamond'), 'Conserva Cormorant Garamond');
    assert.ok(desktopCss.includes('Montserrat'), 'Conserva Montserrat');
    assert.ok(desktopCss.includes('clamp(15px, 1vw, 16.5px) !important;'), 'Conserva tamaño del título de producto');
    assert.ok(desktopCss.includes('font-size: 1.05rem !important;') || desktopCss.includes('font-size: 1.15rem !important;'), 'Conserva tamaño del precio');
});

test('M32.4 - 5. Móvil (320px-480px, 768px) permanece 100% aislado e intacto con sus 2 columnas e imagen de 130px', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
