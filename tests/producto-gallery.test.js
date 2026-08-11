/**
 * Dunes Parfums - Tests de Unidad e Integración para la Galería de 2 Imágenes y Visor Fullscreen Lightbox (producto.html)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Environment mocks for node test runner
global.window = {
    location: { search: '?id=p1' },
    addEventListener: () => {},
    matchMedia: () => ({ matches: false }),
    whatsappConfig: {
        enviarMensajeWhatsApp: () => {},
        consultarDisponibilidad: () => {}
    }
};
global.document = {
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
};

const scriptContent = fs.readFileSync('js/interfaz.js', 'utf8');

test('ProductoGallery - 1. Sin imagen_notas genera HTML con gatillo de zoom para visor de 1 sola imagen', () => {
    const scope = {};
    const evalFn = new Function('exports', scriptContent + '\nexports.generarHtmlLadoImagen = generarHtmlLadoImagen;');
    evalFn(scope);

    const prodSinNotas = {
        id: 'p1',
        nombre: 'Khamrah',
        marca: 'Lattafa',
        imagen: 'img/productos/khamrah.webp',
        imagen_notas: ''
    };

    const html = scope.generarHtmlLadoImagen(prodSinNotas);

    assert.ok(html.includes('class="detail-image-side"'));
    assert.ok(html.includes('gallery-zoom-trigger'));
    assert.ok(html.includes('gallery-zoom-badge'));
    assert.ok(!html.includes('product-gallery-side'));
    assert.ok(!html.includes('gallery-thumb'));
    assert.ok(!html.includes('gallery-arrow'));
    assert.ok(!html.includes('PERFUME'));
    assert.ok(!html.includes('NOTAS'));
});

test('ProductoGallery - 2. Con imagen_notas válida genera estructura compacta con miniaturas verticales a la derecha y sin flechas normales', () => {
    const scope = {};
    const evalFn = new Function('exports', scriptContent + '\nexports.generarHtmlLadoImagen = generarHtmlLadoImagen;');
    evalFn(scope);

    const prodConNotas = {
        id: 'p1',
        nombre: 'Khamrah',
        marca: 'Lattafa',
        imagen: 'img/productos/khamrah.webp',
        imagen_notas: 'https://servidor-externo.com/khamrah-notas.webp'
    };

    const html = scope.generarHtmlLadoImagen(prodConNotas);

    assert.ok(html.includes('product-gallery-side'));
    assert.ok(html.includes('product-gallery--layout-side'));
    assert.ok(html.includes('product-gallery__thumbs--vertical'));
    assert.ok(!html.includes('gallery-arrow--prev'), 'La galería normal no debe incluir flecha anterior');
    assert.ok(!html.includes('gallery-arrow--next'), 'La galería normal no debe incluir flecha siguiente');
    assert.ok(html.includes('gallery-zoom-badge'));
    assert.ok(html.includes('role="button"'));
    assert.ok(html.includes('PERFUME'));
    assert.ok(html.includes('NOTAS'));
    assert.ok(html.includes('alt="Notas y perfil olfativo de Khamrah"'));

    const indexPerfume = html.indexOf('gallery-img--main');
    const indexNotas = html.indexOf('gallery-img--notas');
    assert.ok(indexPerfume < indexNotas, 'La imagen del perfume debe preceder a la imagen de notas');
});

test('ProductoGallery - 3. CSS contiene reglas de miniaturas verticales, Visor Lightbox y responsividad', () => {
    const estilosCss = fs.readFileSync('css/estilos.css', 'utf8');
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(estilosCss.includes('.product-gallery__thumbs--vertical'), 'estilos.css debe contener .product-gallery__thumbs--vertical');
    assert.ok(estilosCss.includes('.product-lightbox'), 'estilos.css debe contener .product-lightbox');
    assert.ok(estilosCss.includes('.product-lightbox__backdrop'), 'estilos.css debe contener .product-lightbox__backdrop');
    assert.ok(estilosCss.includes('.lightbox-close-btn'), 'estilos.css debe contener .lightbox-close-btn');
    assert.ok(estilosCss.includes('.lightbox-img'), 'estilos.css debe contener .lightbox-img');
    assert.ok(estilosCss.includes('object-fit: contain'), 'estilos.css debe usar object-fit: contain');
    assert.ok(estilosCss.includes('body.lightbox-open'), 'estilos.css debe contener body.lightbox-open');

    assert.ok(responsiveCss.includes('.product-gallery__thumbs--vertical'), 'responsive.css debe contener adaptaciones móviles para .product-gallery__thumbs--vertical');
    assert.ok(responsiveCss.includes('.lightbox-img'), 'responsive.css debe contener adaptaciones móviles para .lightbox-img');
});

test('ProductoGallery - 4. Restricción estricta de no modificar otras secciones', () => {
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const catalogoHtml = fs.readFileSync('catalogo.html', 'utf8');
    const carritoHtml = fs.readFileSync('carrito.html', 'utf8');
    const favoritosHtml = fs.readFileSync('favoritos.html', 'utf8');

    assert.ok(!indexHtml.includes('product-gallery-side'), 'index.html no debe incluir cambios de galería');
    assert.ok(!catalogoHtml.includes('product-gallery-side'), 'catalogo.html no debe incluir cambios de galería');
    assert.ok(!carritoHtml.includes('product-gallery-side'), 'carrito.html no debe incluir cambios de galería');
    assert.ok(!favoritosHtml.includes('product-gallery-side'), 'favoritos.html no debe incluir cambios de galería');
});
