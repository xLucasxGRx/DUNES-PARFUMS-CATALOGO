/**
 * Dunes Parfums - Tests unitarios para la Eliminación/Ocultamiento del WhatsApp Flotante en carrito.html
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('CarritoNoFloatWA - carrito.html no contiene el boton flotante de WhatsApp', () => {
    const carritoHtml = fs.readFileSync('carrito.html', 'utf8');

    assert.equal(
        carritoHtml.includes('class="wa-float-btn"'),
        false,
        'carrito.html no debe incluir la clase wa-float-btn'
    );
    assert.equal(
        carritoHtml.includes('id="whatsapp-floating-btn"'),
        false,
        'carrito.html no debe incluir id="whatsapp-floating-btn"'
    );
});

test('CarritoNoFloatWA - Ocultamiento CSS exclusivo para #page-carrito en estilos.css o responsive.css', () => {
    const estilosCss = fs.readFileSync('css/estilos.css', 'utf8');
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');

    const tieneOcultamiento = estilosCss.includes('#page-carrito .wa-float-btn') || responsiveCss.includes('#page-carrito .wa-float-btn');
    assert.ok(tieneOcultamiento, 'CSS debe incluir regla especifica para ocultar #page-carrito .wa-float-btn');
});

test('CarritoNoFloatWA - Las paginas index.html, catalogo.html y producto.html conservan su boton flotante', () => {
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const catalogoHtml = fs.readFileSync('catalogo.html', 'utf8');
    const productoHtml = fs.readFileSync('producto.html', 'utf8');

    assert.ok(indexHtml.includes('id="whatsapp-floating-btn"'), 'index.html debe conservar whatsapp-floating-btn');
    assert.ok(catalogoHtml.includes('id="whatsapp-floating-btn"'), 'catalogo.html debe conservar whatsapp-floating-btn');
    assert.ok(productoHtml.includes('id="whatsapp-floating-btn"'), 'producto.html debe conservar whatsapp-floating-btn');
});
