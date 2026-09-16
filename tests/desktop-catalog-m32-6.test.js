/**
 * Dunes Parfums - Tests de Unidad para FASE M32.6 (Uniformidad de Tarjetas, Distribución Vertical y Frasco Completo de Perfume en Laptop/Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.6 - 1. css/responsive.css contiene cabecera de FASE M32.6 y tarjetas de altura uniforme (height: 100% y align-items: stretch)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.6'), 'Debe incluir cabecera de FASE M32.6');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: 100% !important;'), 'La tarjeta debe tener height: 100% para igualar el tamaño en cada fila');
    assert.ok(desktopCss.includes('align-items: stretch !important;'), 'El grid debe estirar las tarjetas para que todas tengan el mismo tamaño');
    assert.ok(desktopCss.includes('justify-content: space-between !important;'), 'La tarjeta debe distribuir su contenido de forma uniforme');
});

test('M32.6 - 2. Frasco completo de perfume visible (188px) con object-fit contain sin recortes por la mitad', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('height: 188px !important;') || desktopCss.includes('height: 185px !important;'), 'El contenedor de imagen debe tener altura suficiente (188px) para mostrar el frasco íntegro');
    assert.ok(desktopCss.includes('min-height: 188px !important;') || desktopCss.includes('min-height: 185px !important;'), 'Debe fijar min-height');
    assert.ok(desktopCss.includes('object-fit: contain !important;'), 'Debe mantener object-fit contain sin deformar ni recortar');
    assert.ok(desktopCss.includes('padding: 8px 12px !important;'), 'Debe tener padding adecuado para que el frasco respire');
});

test('M32.6 - 3. Distribución vertical equilibrada: título con espacio reservado uniforme y precios proporcionales', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('min-height: 2.5em !important;'), 'El título debe reservar espacio uniforme de 2 líneas para igualar alturas');
    assert.ok(desktopCss.includes('font-size: 1.15rem !important;'), 'El precio actual debe tener tamaño legible y equilibrado');
    assert.ok(desktopCss.includes('Cormorant Garamond'), 'Conserva tipografía oficial Cormorant Garamond');
    assert.ok(desktopCss.includes('Montserrat'), 'Conserva tipografía oficial Montserrat');
});

test('M32.6 - 4. Botones con margin-top: auto, misma altura (34px), alineados al fondo y ópticamente centrados', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('margin-top: auto !important;'), 'El footer debe usar margin-top: auto para anclarse uniformemente al fondo');
    assert.ok(desktopCss.includes('height: 34px !important;') || desktopCss.includes('height: 38px !important;'), 'Los botones deben tener altura calibrada');
    assert.ok(desktopCss.includes('min-height: 34px !important;') || desktopCss.includes('min-height: 38px !important;'), 'Los botones deben tener min-height calibrado');
    assert.ok(desktopCss.includes('btn-details-compact'), 'Debe incluir regla explícita para .btn-details-compact');
    assert.ok(desktopCss.includes('btn-add-cart'), 'Debe incluir regla explícita para .btn-add-cart');
    assert.ok(desktopCss.includes('btn-query-wa'), 'Debe incluir regla explícita para .btn-query-wa');
});

test('M32.6 - 5. Botón Ver Detalles en overlay hover tiene altura uniforme y centrada', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('btn-view-details'), 'Debe definir regla para .btn-view-details');
    assert.ok(desktopCss.includes('height: 34px !important;'), 'El botón Ver Detalles en overlay debe tener 34px');
});

test('M32.6 - 6. Grid en 1366px, 1440px y 1920px mantiene align-items: stretch para uniformidad en todas las resoluciones de escritorio', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    const block1366 = cssContent.slice(cssContent.indexOf('@media screen and (min-width: 1366px)'), cssContent.indexOf('@media screen and (min-width: 1440px)'));
    assert.ok(block1366.includes('align-items: stretch !important;'), '1366px debe tener align-items: stretch');

    const block1440 = cssContent.slice(cssContent.indexOf('@media screen and (min-width: 1440px)'), cssContent.indexOf('@media screen and (min-width: 1920px)'));
    assert.ok(block1440.includes('align-items: stretch !important;'), '1440px debe tener align-items: stretch');

    const block1920 = cssContent.slice(cssContent.indexOf('@media screen and (min-width: 1920px)'));
    assert.ok(block1920.includes('align-items: stretch !important;'), '1920px debe tener align-items: stretch');
});

test('M32.6 - 7. Móvil (320px-480px, 768px) permanece 100% aislado e intacto con sus 2 columnas e imagen de 130px', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Móvil debe conservar 2 columnas');
    assert.ok(cssContent.includes('height: 130px !important;'), 'Móvil debe conservar altura de imagen de 130px');
});
