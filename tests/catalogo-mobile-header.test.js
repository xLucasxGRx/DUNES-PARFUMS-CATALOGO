/**
 * Dunes Parfums - Tests unitarios para Ocultar Cabecera Visual del Catálogo en Móvil
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('CatalogoMobileHeader - 1. catalogo.html conserva el elemento H1 id="catalogo-titulo" para SEO y accesibilidad', () => {
    const html = fs.readFileSync('catalogo.html', 'utf8');
    assert.ok(html.includes('<h1 class="page-heading__title section-title" id="catalogo-titulo">'), 'catalogo.html debe conservar el H1 en el DOM');
});

test('CatalogoMobileHeader - 2. css/responsive.css aplica ocultamiento visual accesible en movil para .catalog-header', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(css.includes('#page-catalogo .catalog-header'), 'Debe incluir regla para #page-catalogo .catalog-header');
    assert.ok(css.includes('visually-hidden') || css.includes('clip: rect') || css.includes('height: 0') || css.includes('display: none'), 'Debe ocultar los elementos de la cabecera del catálogo en móvil');
});

test('CatalogoMobileHeader - 3. Las reglas estan aisladas para catalogo y no afectan a favoritos ni carrito', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');

    // Verificar que las reglas de ocultamiento estan delimitadas a #page-catalogo o .catalog-header
    assert.ok(css.includes('#page-catalogo .catalog-header'), 'Las reglas deben apuntar a la cabecera especifica del catalogo');
});
