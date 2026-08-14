/**
 * Dunes Parfums - Tests de Unidad e Integración para CORRECCIÓN VISUAL M23.3 (Nuestra Ubicación Compacta y Aviso de Envíos)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M23.3 - 1. Preservación estricta de textos y links aprobados en index.html', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    // Título y descripción
    assert.ok(html.includes('Dunes Parfums en Tarapoto'), 'Debe conservar el título del bloque');
    assert.ok(html.includes('Cacatachi, Tarapoto'), 'Debe conservar la mención de Cacatachi');
    assert.ok(html.includes('Realizamos envíos rápidos y seguros en la región de San Martín y a todo el territorio nacional.'), 'Debe conservar el texto descriptivo');

    // Localidades de delivery local
    assert.ok(html.includes('<li>Cacatachi</li>'));
    assert.ok(html.includes('<li>Morales</li>'));
    assert.ok(html.includes('<li>Tarapoto</li>'));
    assert.ok(html.includes('<li>La Banda de Shilcayo</li>'));

    // Aviso de envíos por agencia
    assert.ok(html.includes('ENVÍOS POR AGENCIA A TODO EL PERÚ'), 'Debe incluir el título destacado');
    assert.ok(html.includes('Llegamos a cada rincón del país de forma rápida y segura.') || html.includes('También realizamos envíos por agencia a todo el Perú.'), 'Debe conservar la frase de envíos por agencia');

    // Botones e iframe
    assert.ok(html.includes('https://www.google.com/maps/search/?api=1&query=-6.4626252,-76.4491609'), 'Debe conservar el link de Maps');
    assert.ok(html.includes('https://wa.me/51986510573'), 'Debe conservar el enlace de WhatsApp');
});

test('M23.3 - 2. Estilos CSS del aviso destacado y microanimación sutil', () => {
    const css = fs.readFileSync('css/estilos.css', 'utf8');

    assert.ok(css.includes('.location-shipping-callout'), 'Debe contener la clase .location-shipping-callout');
    assert.ok(css.includes('@keyframes goldBreathingGlow'), 'Debe contener la microanimación goldBreathingGlow');
    assert.ok(css.includes('prefers-reduced-motion'), 'Debe contemplar la preferencia de reducción de movimiento');
});

test('M23.3 - 3. Reglas de compactación responsiva en responsive.css', () => {
    const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(responsiveCss.includes('.ubicacion-card'), 'Debe contener reglas responsivas para .ubicacion-card');
    assert.ok(responsiveCss.includes('padding: 20px 18px;'), 'Debe aplicar padding compacto en móvil');
});
