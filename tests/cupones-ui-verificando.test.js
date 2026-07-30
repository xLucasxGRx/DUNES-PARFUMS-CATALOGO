/**
 * Dunes Parfums - Tests de Unidad e Integración para el Estado VERIFICANDO... al Aplicar Cupones
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('CuponesUI - 1. HTML de carrito.html contiene input y botón de cupones con clases e IDs requeridos', () => {
    const html = fs.readFileSync('carrito.html', 'utf8');
    assert.ok(html.includes('id="coupon-code"'), 'Debe existir input con id coupon-code');
    assert.ok(html.includes('id="coupon-apply-btn"'), 'Debe existir botón con id coupon-apply-btn');
    assert.ok(html.includes('id="coupon-feedback"'), 'Debe existir div con id coupon-feedback');
    assert.ok(html.includes('class="btn-coupon-apply"'), 'Debe incluir clase btn-coupon-apply');
});

test('CuponesUI - 2. CSS contiene estilos para el spinner y prefers-reduced-motion', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(css.includes('.btn-coupon-spinner'), 'estilos.css debe definir .btn-coupon-spinner');
    assert.ok(css.includes('@keyframes btn-coupon-spin'), 'estilos.css debe definir keyframes btn-coupon-spin');
    assert.ok(css.includes('prefers-reduced-motion'), 'estilos.css debe soportar prefers-reduced-motion');
});

test('CuponesUI - 3. JS en cupones-ui.js incluye el texto VERIFICANDO…, spinner, aria-busy y seguro de clics esAplicando', () => {
    const js = fs.readFileSync('js/cupones-ui.js', 'utf8');
    assert.ok(js.includes('VERIFICANDO…'), 'cupones-ui.js debe incluir el texto VERIFICANDO…');
    assert.ok(js.includes('btn-coupon-spinner'), 'cupones-ui.js debe incluir la clase del spinner');
    assert.ok(js.includes("aria-busy', 'true'"), 'cupones-ui.js debe asignar aria-busy="true"');
    assert.ok(js.includes('if (esAplicando) return;'), 'cupones-ui.js debe bloquear clics concurrentes con esAplicando');
    assert.ok(js.includes('finally'), 'cupones-ui.js debe restaurar el estado dentro de finally');
});

test('CuponesUI - 4. Mapeo de mensajes de error unifica invalidez a CUPÓN NO VÁLIDO', () => {
    const js = fs.readFileSync('js/cupones-ui.js', 'utf8');
    assert.ok(js.includes("'CUPÓN NO VÁLIDO'"), 'Mapeador debe retornar CUPÓN NO VÁLIDO');
    assert.ok(js.includes("'INGRESA UN CUPÓN'"), 'Mapeador debe retornar INGRESA UN CUPÓN cuando el campo está vacío');
    assert.ok(js.includes("'NO PUDIMOS VERIFICAR EL CUPÓN. INTÉNTALO NUEVAMENTE.'"), 'Mapeador debe retornar mensaje amigable en caso de error de servicio');
});
