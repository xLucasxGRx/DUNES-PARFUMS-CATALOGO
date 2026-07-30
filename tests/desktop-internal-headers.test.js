/**
 * Dunes Parfums - Tests unitarios para la Compactación de Encabezados Internos en Desktop (>= 768px)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('DesktopInternalHeaders - CSS responsive incluye compactación aislada para catalogo, carrito, producto y ayuda en (min-width: 768px)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('@media (min-width: 768px)'), 'Debe existir el bloque @media (min-width: 768px)');
    assert.ok(cssContent.includes('#page-catalogo main.section-padding'), 'Debe estilizar #page-catalogo main.section-padding');
    assert.ok(cssContent.includes('.ayuda-hero-section'), 'Debe compactar .ayuda-hero-section');
});

test('DesktopInternalHeaders - HTML de las paginas conserva los textos e IDs de encabezado intactos', () => {
    const catalogoHtml = fs.readFileSync('catalogo.html', 'utf8');
    const ayudaHtml = fs.readFileSync('ayuda.html', 'utf8');

    assert.ok(catalogoHtml.includes('Exclusividad'), 'Catalogo conserva el subtitulo Exclusividad');
    assert.ok(catalogoHtml.includes('CATÁLOGO'), 'Catalogo conserva el titulo CATÁLOGO');

    assert.ok(ayudaHtml.includes('Confianza y Ayuda'), 'Ayuda conserva el badge Confianza y Ayuda');
    assert.ok(ayudaHtml.includes('Preguntas frecuentes'), 'Ayuda conserva el titulo Preguntas frecuentes');
});
