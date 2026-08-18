const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const pages = [
    'index.html',
    'catalogo.html',
    'producto.html',
    'carrito.html',
    'favoritos.html',
    'ayuda.html',
    'comparador.html',
    '404.html'
];

test('FooterUnification - 1. Todas las páginas HTML principales poseen la estructura oficial de acordeón móvil', () => {
    pages.forEach(page => {
        if (!fs.existsSync(page)) return;
        const html = fs.readFileSync(page, 'utf8');

        assert.ok(html.includes('footer-col--accordion'), `${page} debe contener footer-col--accordion`);
        assert.ok(html.includes('footer-accordion-btn'), `${page} debe contener footer-accordion-btn`);
        assert.ok(html.includes('id="footer-menu-nav"'), `${page} debe contener footer-menu-nav`);
        assert.ok(html.includes('id="footer-menu-cat"'), `${page} debe contener footer-menu-cat`);
        assert.ok(html.includes('id="footer-menu-contact"'), `${page} debe contener footer-menu-contact`);
    });
});

test('FooterUnification - 2. Todos los botones de acordeón inician con aria-expanded="false" en HTML', () => {
    pages.forEach(page => {
        if (!fs.existsSync(page)) return;
        const html = fs.readFileSync(page, 'utf8');

        const expandedTrueMatches = html.match(/class="footer-accordion-btn"[^>]*aria-expanded="true"/g);
        assert.equal(expandedTrueMatches, null, `${page} no debe tener ningún acordeón abierto por defecto en HTML`);

        const activeMatches = html.match(/class="footer-accordion-content[^"]*active"/g);
        assert.equal(activeMatches, null, `${page} no debe tener ningún footer-accordion-content activo por defecto`);
    });
});

test('FooterUnification - 3. inicializarAcordeonFooter en js/interfaz.js garantiza acordeón exclusivo (1 solo abierto a la vez)', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');

    assert.ok(js.includes('inicializarAcordeonFooter'), 'js/interfaz.js debe definir inicializarAcordeonFooter');
    assert.ok(js.includes('dataset.accordionBound'), 'js/interfaz.js debe prevenir listeners duplicados con dataset.accordionBound');
    assert.ok(js.includes('otherBtn !== btn'), 'js/interfaz.js debe cerrar los otros acordeones al abrir uno');
});
