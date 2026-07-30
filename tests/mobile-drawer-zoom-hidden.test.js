/**
 * Dunes Parfums — Tests: Ocultamiento Real del Panel Móvil y Prevención de Desbordamiento al Alejar Zoom
 * Verifica la eliminación absoluta de la zona renderizada fuera del viewport en Android/iOS cuando el menú está cerrado.
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

/* ─── 1. HTML: Todos los archivos HTML incluyen hidden, aria-hidden="true" e inert por defecto en nav-menu ─── */
test('MobileDrawerZoomHidden - 1. HTML inicializa nav-menu con hidden, aria-hidden="true" e inert', () => {
    paginas.forEach(pag => {
        const html = fs.readFileSync(pag, 'utf8');
        const navMatch = html.match(/<nav\s+class="nav-menu"\s+id="nav-menu"([^>]*?)>/);
        assert.ok(navMatch, `${pag} debe contener <nav class="nav-menu" id="nav-menu">`);
        const attrs = navMatch[1];
        assert.ok(attrs.includes('hidden'), `${pag}: nav-menu debe incluir el atributo hidden`);
        assert.ok(attrs.includes('aria-hidden="true"'), `${pag}: nav-menu debe incluir aria-hidden="true"`);
        assert.ok(attrs.includes('inert'), `${pag}: nav-menu debe incluir el atributo inert`);
    });
});

/* ─── 2. HTML: Viewport meta tag es accesible sin bloqueos de zoom ─── */
test('MobileDrawerZoomHidden - 2. Viewport meta tag permite zoom por accesibilidad sin user-scalable=no', () => {
    paginas.forEach(pag => {
        const html = fs.readFileSync(pag, 'utf8');
        const metaMatch = html.match(/<meta\s+name="viewport"\s+content="([^"]*?)"/);
        assert.ok(metaMatch, `${pag} debe incluir meta viewport`);
        const content = metaMatch[1];
        assert.ok(!content.includes('user-scalable=no'), `${pag}: no debe restringir user-scalable=no`);
        assert.ok(!content.includes('maximum-scale=1'), `${pag}: no debe restringir maximum-scale=1`);
        assert.ok(content.includes('width=device-width'), `${pag}: debe incluir width=device-width`);
    });
});

/* ─── 3. CSS: [hidden] aplica display:none, visibility:hidden y pointer-events:none en móviles ─── */
test('MobileDrawerZoomHidden - 3. CSS aplica display:none, visibility:hidden y pointer-events:none a elementos [hidden]', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');
    const mobileBlockIndex = css.indexOf('@media screen and (max-width: 991px)');
    assert.ok(mobileBlockIndex !== -1, 'Debe contener bloque responsive móvil (max-width: 991px)');
    const mobileCss = css.substring(mobileBlockIndex);

    assert.ok(mobileCss.includes('.nav-menu[hidden]'), 'responsive.css móvil debe incluir selector .nav-menu[hidden]');
    assert.ok(mobileCss.includes('.nav-menu-overlay[hidden]'), 'responsive.css móvil debe incluir selector .nav-menu-overlay[hidden]');

    const hiddenStart = mobileCss.indexOf('.nav-menu[hidden]');
    const hiddenEnd = mobileCss.indexOf('}', hiddenStart);
    const hiddenRule = mobileCss.substring(hiddenStart, hiddenEnd);

    assert.ok(hiddenRule.includes('display: none !important;'), '[hidden] debe declarar display: none !important');
    assert.ok(hiddenRule.includes('visibility: hidden !important;'), '[hidden] debe declarar visibility: hidden !important');
    assert.ok(hiddenRule.includes('pointer-events: none !important;'), '[hidden] debe declarar pointer-events: none !important');
});

/* ─── 4. CSS: Reset en escritorio (>= 992px) para que nav-menu sea visible en la cabecera horizontal ─── */
test('MobileDrawerZoomHidden - 4. CSS de escritorio (>= 992px) restablece .nav-menu[hidden] a display:flex', () => {
    const css = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopStartIndex = css.indexOf('@media screen and (min-width: 992px)');
    const desktopEndIndex = css.indexOf('@media screen and (max-width: 991px)');
    assert.ok(desktopStartIndex !== -1 && desktopEndIndex !== -1, 'Debe contener bloque de escritorio y móvil');

    const desktopCss = css.substring(desktopStartIndex, desktopEndIndex);
    assert.ok(desktopCss.includes('.nav-menu[hidden]'), 'Escritorio debe incluir selector .nav-menu[hidden]');
    assert.ok(desktopCss.includes('display: flex !important;'), 'Escritorio debe declarar display: flex !important para nav-menu');
});

/* ─── 5. JS: Gestor del ciclo de vida (hidden, aria-hidden, inert, transitionend, resize, orientationchange) ─── */
test('MobileDrawerZoomHidden - 5. JS gestiona correctamente el ciclo de vida de hidden, inert, transitionend y resize', () => {
    const js = fs.readFileSync('js/interfaz.js', 'utf8');

    // 1. Sincronización en la carga inicial
    assert.ok(js.includes('sincronizarEstadoBreakpoint()'), 'JS debe sincronizar estado según breakpoint al cargar');

    // 2. Transición de apertura: remover hidden e inert antes de añadir active
    assert.ok(js.includes('navMenu.hidden = false'), 'abrirMenu debe quitar hidden');
    assert.ok(js.includes("navMenu.removeAttribute('inert')"), 'abrirMenu debe retirar inert');
    assert.ok(js.includes("navMenu.removeAttribute('aria-hidden')"), 'abrirMenu debe retirar aria-hidden');
    assert.ok(js.includes('void navMenu.offsetWidth'), 'abrirMenu debe forzar reflow para animación limpia');

    // 3. Transición de cierre: transitionend + fallback timer + reasignar hidden, inert, aria-hidden
    assert.ok(js.includes("navMenu.addEventListener('transitionend'"), 'cerrarMenu debe registrar listener de transitionend');
    assert.ok(js.includes("navMenu.hidden = true"), 'cerrarMenu debe establecer hidden = true al finalizar la transición');
    assert.ok(js.includes("navMenu.setAttribute('inert'"), 'cerrarMenu debe establecer inert al finalizar');
    assert.ok(js.includes("navMenu.setAttribute('aria-hidden', 'true')"), 'cerrarMenu debe establecer aria-hidden="true"');
    assert.ok(js.includes('setTimeout'), 'cerrarMenu debe incluir un timer de fallback');

    // 4. Resize y orientationchange
    assert.ok(js.includes("window.addEventListener('resize'"), 'JS debe escuchar eventos resize');
    assert.ok(js.includes("window.addEventListener('orientationchange'"), 'JS debe escuchar eventos orientationchange');
});
