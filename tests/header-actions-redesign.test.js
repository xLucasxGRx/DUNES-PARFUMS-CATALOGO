/**
 * Dunes Parfums - Tests de Unidad para el Rediseño de Botones del Header (FASE MEJORA PUNTUAL)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const paginas = [
    'index.html',
    'catalogo.html',
    'producto.html',
    'carrito.html',
    'ayuda.html',
    'favoritos.html'
];

test('HeaderActionsRedesign - 1. Todas las páginas HTML contienen las tres acciones de cabecera', () => {
    paginas.forEach(pag => {
        const html = fs.readFileSync(pag, 'utf8');
        assert.ok(html.includes('class="favorites-header-icon-btn"'), `${pag} debe incluir favorites-header-icon-btn`);
        assert.ok(html.includes('class="cart-icon-btn"'), `${pag} debe incluir cart-icon-btn`);
        assert.ok(html.includes('class="burger-menu-btn"'), `${pag} debe incluir burger-menu-btn`);
    });
});

test('HeaderActionsRedesign - 2. CSS contiene el sistema visual unificado de 44px y bordes dorados', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('.header-actions .favorites-header-icon-btn'), 'Debe incluir el selector aislado para favoritos header');
    assert.ok(css.includes('.header-actions .cart-icon-btn'), 'Debe incluir el selector aislado para carrito header');
    assert.ok(css.includes('.header-actions .burger-menu-btn'), 'Debe incluir el selector aislado para hamburguesa header');
    assert.ok(css.includes('width: 44px;'), 'Debe tener tamaño unificado de 44px');
    assert.ok(css.includes('height: 44px;'), 'Debe tener altura unificada de 44px');
    assert.ok(css.includes('border-radius: 12px;'), 'Debe tener border-radius unificado de 12px');
});

test('HeaderActionsRedesign - 3. CSS contiene transformación hamburguesa a X y microanimaciones', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('span:nth-child(1)'), 'Debe incluir animación de la primera línea a X');
    assert.ok(css.includes('span:nth-child(3)'), 'Debe incluir animación de la tercera línea a X');
    assert.ok(css.includes('@keyframes badgePop'), 'Debe incluir microanimación badgePop');
    assert.ok(css.includes('@keyframes favHeaderPulse'), 'Debe incluir microanimación favHeaderPulse');
});

test('HeaderActionsRedesign - 4. CSS contempla prefers-reduced-motion para accesibilidad', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('prefers-reduced-motion: reduce'), 'Debe respetar la preferencia de movimiento reducido');
});
