/**
 * Dunes Parfums - Tests unitarios para el Catálogo Móvil en 2 Columnas (FASE M19)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('MobileCatalogTwoColumns - 1. CSS contiene grid de 2 columnas para móvil (max-width: 768px)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('@media screen and (max-width: 768px)'), 'Debe existir el bloque @media screen and (max-width: 768px)');
    assert.ok(cssContent.includes('grid-template-columns: repeat(2, minmax(0, 1fr))') || cssContent.includes('grid-template-columns: 1fr 1fr'), 'Debe definir 2 columnas para el catálogo móvil');
});

test('MobileCatalogTwoColumns - 2. CSS contiene limitación de título a máximo 2 líneas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('-webkit-line-clamp: 2'), 'Debe limitar los títulos a un máximo de 2 líneas');
});

test('MobileCatalogTwoColumns - 3. Vista de escritorio (min-width: 769px) permanece aislada e intacta', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('@media screen and (min-width: 769px)'), 'Debe existir el bloque para escritorio @media screen and (min-width: 769px)');
    assert.ok(cssContent.includes('grid-template-columns: repeat(4, 1fr)') || cssContent.includes('grid-template-columns: repeat(3, 1fr)'), 'Debe conservar la cuadrícula de 3 y 4 columnas en escritorio');
});
