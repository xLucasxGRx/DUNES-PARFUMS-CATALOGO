/**
 * Dunes Parfums — Tests: Cabecera limpia del panel móvil y superficie clicable de la X
 * Verifica la causa raíz: .header-actions se oculta COMPLETA con body.menu-open
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

/* ─── 1. HTML: panel contiene SOLO brand + X ─── */
test('MobileDrawerHeaderClean - 1. En HTML, mobile-drawer-header contiene únicamente brand y botón X', () => {
    paginas.forEach(pag => {
        const html = fs.readFileSync(pag, 'utf8');
        const headerStart = html.indexOf('class="mobile-drawer-header"');
        const headerEnd = html.indexOf('class="nav-list"', headerStart);
        assert.ok(headerStart !== -1 && headerEnd !== -1, `${pag} debe contener mobile-drawer-header`);
        const headerContent = html.substring(headerStart, headerEnd);

        assert.ok(headerContent.includes('mobile-drawer-brand'), `${pag} debe contener marca mobile-drawer-brand`);
        assert.ok(headerContent.includes('mobile-drawer-close'), `${pag} debe contener botón mobile-drawer-close`);
        assert.ok(!headerContent.includes('favorites-header-icon-btn'), `${pag} NO debe contener Favoritos dentro del panel`);
        assert.ok(!headerContent.includes('cart-icon-btn'), `${pag} NO debe contener Carrito dentro del panel`);
        assert.ok(!headerContent.includes('burger-menu-btn'), `${pag} NO debe contener hamburguesa dentro del panel`);
    });
});

/* ─── 2. CSS: body.menu-open oculta TODO .header-actions (no solo burger) ─── */
test('MobileDrawerHeaderClean - 2. body.menu-open oculta TODO .header-actions (Favoritos + Carrito + Hamburguesa)', () => {
    const cssR = fs.readFileSync('css/responsive.css', 'utf8');
    const cssE = fs.readFileSync('css/estilos.css', 'utf8');

    // Debe existir la regla que oculta .header-actions directamente (NO .header-actions .burger-menu-btn)
    const ruleRegex = /body\.menu-open\s+\.header-actions[\s,{]/;
    assert.ok(ruleRegex.test(cssR), 'responsive.css: body.menu-open .header-actions debe existir como regla directa');
    assert.ok(ruleRegex.test(cssE), 'estilos.css: body.menu-open .header-actions debe existir como regla directa');

    // NO debe existir la regla parcial que solo oculta .burger-menu-btn
    assert.ok(!cssR.includes('body.menu-open .header-actions .burger-menu-btn'),
        'responsive.css: NO debe contener la regla parcial .burger-menu-btn (debe ocultar TODO .header-actions)');
    assert.ok(!cssE.includes('body.menu-open .header-actions .burger-menu-btn'),
        'estilos.css: NO debe contener la regla parcial .burger-menu-btn (debe ocultar TODO .header-actions)');
});

/* ─── 3. CSS: Botón X con área táctil de 50px, position:relative, pointer-events:auto ─── */
test('MobileDrawerHeaderClean - 3. mobile-drawer-close con 50px, position:relative, pointer-events:auto', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');
    assert.ok(css.includes('width: 50px !important;'), 'Ancho de botón X debe ser 50px');
    assert.ok(css.includes('height: 50px !important;'), 'Alto de botón X debe ser 50px');
    assert.ok(css.includes('touch-action: manipulation !important;'), 'Debe incluir touch-action manipulation');
    assert.ok(css.includes('position: relative !important;'), 'Debe incluir position: relative');
    assert.ok(css.includes('pointer-events: auto !important;'), 'Debe incluir pointer-events: auto');
});

/* ─── 4. CSS: SVG y sus hijos con pointer-events: none ─── */
test('MobileDrawerHeaderClean - 4. SVG e hijos del botón X tienen pointer-events: none', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');
    assert.ok(css.includes('.mobile-drawer-close svg'), 'Debe tener regla para SVG del botón X');
    assert.ok(css.includes('.mobile-drawer-close svg *'), 'Debe tener regla para hijos del SVG (line, path, etc)');

    // Extraer bloque del SVG para verificar pointer-events: none
    const svgSection = css.substring(
        css.indexOf('.mobile-drawer-close svg {'),
        css.indexOf('}', css.indexOf('.mobile-drawer-close svg {')) + 1
    );
    assert.ok(svgSection.includes('pointer-events: none'), 'SVG debe tener pointer-events: none');
});

/* ─── 5. CSS: Pseudo-elementos del botón X desactivados ─── */
test('MobileDrawerHeaderClean - 5. Pseudoelementos ::before y ::after del botón X desactivados', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('.mobile-drawer-close::before'), 'Debe existir regla para ::before');
    assert.ok(css.includes('.mobile-drawer-close::after'), 'Debe existir regla para ::after');
    assert.ok(css.includes('content: none !important;'), 'Debe eliminar content de pseudoelementos');
});

/* ─── 6. JS: cerrarMenu() devuelve foco a burgerBtn ─── */
test('MobileDrawerHeaderClean - 6. cerrarMenu devuelve el foco a burgerBtn', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');
    assert.ok(js.includes('burgerBtn.focus()'), 'Debe devolver el foco al botón hamburguesa');
});

/* ─── 7. JS: 4 mecanismos de cierre (X, overlay, Escape, nav links) ─── */
test('MobileDrawerHeaderClean - 7. JavaScript soporta 4 formas de cierre', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');
    assert.ok(js.includes("'mobile-menu-close'"), 'Debe registrar listener en #mobile-menu-close');
    assert.ok(js.includes("e.key === 'Escape'"), 'Debe cerrar al presionar Escape');
    assert.ok(js.includes('navLinks.forEach'), 'Debe autocerrar al seleccionar una opción del menú');
    assert.ok(js.includes("overlay.addEventListener('click'"), 'Debe cerrar al tocar el overlay');
});

/* ─── 8. JS: Listener del cierre usa stopPropagation, no depende de event.target ─── */
test('MobileDrawerHeaderClean - 8. Listener de cierre usa stopPropagation y no depende de event.target', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');

    // El listener del botón X debe usar stopPropagation
    const closeSection = js.substring(
        js.indexOf("closeBtn.addEventListener('click'"),
        js.indexOf('}', js.indexOf("closeBtn.addEventListener('click'") + 50) + 1
    );
    assert.ok(closeSection.includes('stopPropagation'), 'Listener del botón X debe usar stopPropagation');

    // No debe usar event.target para decidir si cierra
    assert.ok(!closeSection.includes('event.target') && !closeSection.includes('e.target.closest'),
        'No debe depender de event.target para decidir si cierra');
});

/* ─── 9. HTML: header-actions está FUERA del panel .nav-menu ─── */
test('MobileDrawerHeaderClean - 9. header-actions está fuera del panel nav-menu en el DOM', () => {
    paginas.forEach(pag => {
        const html = fs.readFileSync(pag, 'utf8');
        const navMenuEnd = html.indexOf('</nav>');
        const headerActionsStart = html.indexOf('class="header-actions"');
        assert.ok(navMenuEnd !== -1 && headerActionsStart !== -1, `${pag} debe tener nav-menu y header-actions`);
        assert.ok(headerActionsStart > navMenuEnd,
            `${pag}: header-actions debe estar DESPUÉS del cierre </nav> (fuera del panel)`);
    });
});

/* ─── 10. No hay cloneNode de header-actions en JS ─── */
test('MobileDrawerHeaderClean - 10. No se clonan header-actions, favoritos ni carrito hacia el panel', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');
    assert.ok(!js.includes("cloneNode") || !js.includes("header-actions"),
        'No debe haber cloneNode relacionado con header-actions');
    assert.ok(!js.includes("insertAdjacentHTML") || !js.includes("mobile-drawer-header"),
        'No debe insertar HTML dinámicamente en mobile-drawer-header');
});
