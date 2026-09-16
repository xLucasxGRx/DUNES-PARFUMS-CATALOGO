/**
 * Dunes Parfums - Tests de Unidad para Tarjetas de Productos Agotados Mejoradas
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('OutOfStockEnhanced - 1. estilos.css define desaturación clara (85%), atenuación y distintivo central AGOTADO', () => {
    const cssContent = fs.readFileSync('css/estilos.css', 'utf8');

    // Desaturación y opacidad atenuada del frasco
    assert.ok(cssContent.includes('.product-card.out-of-stock .product-img'), 'Debe estilizar la imagen del producto agotado');
    assert.ok(cssContent.includes('grayscale(85%)') || cssContent.includes('grayscale(80%)'), 'Debe aplicar desaturación visible al frasco');
    assert.ok(cssContent.includes('opacity(0.48)') || cssContent.includes('opacity(0.5)'), 'Debe atenuar la opacidad del frasco agotado');

    // Distintivo central "AGOTADO" sobre el frasco (cápsula frosted)
    assert.ok(cssContent.includes('.product-card.out-of-stock .product-image-container::after'), 'Debe definir cápsula central ::after sobre el contenedor');
    assert.ok(cssContent.includes('content: "AGOTADO"'), 'Debe mostrar texto AGOTADO en la cápsula central');
    assert.ok(cssContent.includes('backdrop-filter: blur'), 'Debe tener efecto frosted glass elegante');
});

test('OutOfStockEnhanced - 2. estilos.css y responsive.css subordinan el precio y destacan el badge de stock', () => {
    const estilosCss = fs.readFileSync('css/estilos.css', 'utf8');
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');

    // Precio atenuado
    assert.ok(estilosCss.includes('.product-card.out-of-stock .price-current'), 'Debe atenuar el precio en estilos.css');
    assert.ok(responsiveCss.includes('.product-card.out-of-stock .price-current'), 'Debe atenuar el precio en responsive.css');

    // Badge de stock con contraste nítido
    assert.ok(estilosCss.includes('.product-card.out-of-stock .product-stock-status.out'), 'Debe resaltar el badge agotado');
    assert.ok(responsiveCss.includes('.product-card.out-of-stock .product-stock-status.out'), 'Debe resaltar el badge en responsive.css');
});

test('OutOfStockEnhanced - 3. responsive.css define reglas desktop de alta especificidad para tarjetas agotadas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopStart !== -1, 'Debe existir media query desktop');

    const desktopCss = cssContent.slice(desktopStart);

    // Fondo y borde distintivo en desktop
    assert.ok(desktopCss.includes('#catalogo-productos-grid .product-card.out-of-stock'), 'Debe definir regla específica de tarjeta agotada en desktop');
    assert.ok(desktopCss.includes('border-top: 3px solid #B83A3A'), 'Debe tener línea superior de acento de estado');
    assert.ok(desktopCss.includes('#catalogo-productos-grid .product-card.out-of-stock .product-image-container::after'), 'Debe tener cápsula central desktop');
    assert.ok(desktopCss.includes('#catalogo-productos-grid .product-card.out-of-stock .product-img'), 'Debe desaturar imagen en desktop');
});

test('OutOfStockEnhanced - 4. responsive.css móvil conserva 2 columnas y aplica desaturación y cápsula central', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const mobileSlice = cssContent.slice(0, cssContent.indexOf('@media screen and (min-width: 1024px)'));

    assert.ok(mobileSlice.includes('#catalogo-productos-grid .product-card.out-of-stock .product-img'), 'Debe desaturar frasco en móvil');
    assert.ok(mobileSlice.includes('#catalogo-productos-grid .product-card.out-of-stock .product-image-container::after'), 'Debe tener distintivo central móvil');
    assert.ok(mobileSlice.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important;'), 'Conserva 2 columnas en móvil');
});

test('OutOfStockEnhanced - 5. Encabezado de tarjeta limpio: sin etiqueta AGOTADO superior ni insignia de tipo colisionante', () => {
    const catalogoJs = fs.readFileSync('js/catalogo.js', 'utf8');
    const interfazJs = fs.readFileSync('js/interfaz.js', 'utf8');
    const favoritosPageJs = fs.readFileSync('js/favoritos-page.js', 'utf8');
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
    const estilosCss = fs.readFileSync('css/estilos.css', 'utf8');

    // No se genera la cápsula de tipo sobre el contenedor de imagen
    assert.equal(catalogoJs.includes('class="product-category-badge"'), false, 'catalogo.js no debe incluir product-category-badge sobre imagen');
    assert.equal(interfazJs.includes('class="product-category-badge"'), false, 'interfaz.js no debe incluir product-category-badge sobre imagen');
    assert.equal(favoritosPageJs.includes('class="product-category-badge"'), false, 'favoritos-page.js no debe incluir product-category-badge sobre imagen');

    // tagHtml no añade AGOTADO en el encabezado
    assert.equal(catalogoJs.includes('tagHtml = `<span class="product-tag out-tag">'), false, 'catalogo.js no debe añadir out-tag en el encabezado');
    assert.equal(favoritosPageJs.includes('tagHtml = `<span class="product-tag out-tag">'), false, 'favoritos-page.js no debe añadir out-tag en el encabezado');

    // Solo se permite promo-tag para ofertas
    assert.ok(catalogoJs.includes('product-tag promo-tag'), 'catalogo.js conserva promo-tag para descuentos');

    // CSS garantiza display: none en caso de elementos residuales
    assert.ok(responsiveCss.includes('.product-category-badge') && responsiveCss.includes('display: none !important'), 'responsive.css oculta product-category-badge');
    assert.ok(estilosCss.includes('.product-category-badge') && estilosCss.includes('display: none !important'), 'estilos.css oculta product-category-badge');
});
