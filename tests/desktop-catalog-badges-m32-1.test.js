/**
 * Dunes Parfums - Tests de Unidad para FASE M32.1 (Ajuste Vertical de Etiquetas en Tarjetas Desktop)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M32.1 - 1. css/responsive.css contiene bloque de FASE M32.1 para etiquetas compactas en desktop (>= 1024px)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    assert.ok(cssContent.includes('FASE M32.1'), 'Debe incluir cabecera o identificador de FASE M32.1');

    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    assert.ok(desktopBlockStart !== -1, 'Debe existir media query min-width: 1024px');

    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    assert.ok(desktopCss.includes('.product-tag.promo-tag'), 'Debe definir reglas para .product-tag.promo-tag en desktop');
    assert.ok(desktopCss.includes('.product-tag.out-tag'), 'Debe definir reglas para .product-tag.out-tag en desktop');
    assert.ok(desktopCss.includes('.product-category-badge'), 'Debe definir reglas para .product-category-badge en desktop');
});

test('M32.1 - 2. Reducción y optimización de altura vertical con padding vertical reducido y alineación centrada', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // Padding vertical debe ser reducido a ~2px - 3px (comparado con los 5px originales)
    const hasReducedVerticalPadding = /padding:\s*(?:2(?:|\.5)|3)px\s+(?:8|9|10)px/i.test(desktopCss) ||
        (/padding-top:\s*(?:2(?:|\.5)|3)px/i.test(desktopCss) && /padding-bottom:\s*(?:2(?:|\.5)|3)px/i.test(desktopCss));
    assert.ok(hasReducedVerticalPadding, 'El padding vertical debe ser reducido (2px - 3px) manteniendo el ancho horizontal');

    // Alineación flexbox centrada verticalmente
    assert.ok(desktopCss.includes('align-items: center'), 'Debe usar align-items: center para centrar perfectamente el texto verticalmente');
    assert.ok(desktopCss.includes('inline-flex') || desktopCss.includes('display: flex'), 'Debe usar flex o inline-flex para el centrado óptico');

    // Line-height controlado y compacto
    assert.ok(desktopCss.includes('line-height: 1.15') || desktopCss.includes('line-height: 1.2') || desktopCss.includes('line-height: 1'), 'Debe definir un line-height compacto');
});

test('M32.1 - 3. La cápsula de categoría no se superpone con el botón de favoritos (corazón)', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');
    const desktopBlockStart = cssContent.indexOf('@media screen and (min-width: 1024px)');
    const desktopCss = cssContent.slice(desktopBlockStart, cssContent.indexOf('/* Reglas de Escritorio (≥ 769px)', desktopBlockStart));

    // El botón de favoritos está en top: 10px; right: 10px; con altura de 34px (termina en 44px).
    // La cápsula de categoría (.product-category-badge) debe estar posicionada sin colisionar con el corazón.
    // Por ejemplo, top: 48px; right: 10px; debajo del corazón, o posición segura no solapada.
    const hasCategoryBadgePosition = desktopCss.includes('.product-category-badge');
    assert.ok(hasCategoryBadgePosition, 'Debe posicionar .product-category-badge');

    // Verificar que en desktop NO tenga top: 10px; right: 10px; simultáneamente (lo cual solaparía el corazón)
    const categoryBadgeRuleMatch = desktopCss.match(/#catalogo-productos-grid\s+\.product-category-badge[\s\S]*?\{([\s\S]*?)\}/);
    if (categoryBadgeRuleMatch) {
        const ruleBody = categoryBadgeRuleMatch[1];
        const isDirectOverlap = ruleBody.includes('top: 10px') && ruleBody.includes('right: 10px');
        assert.equal(isDirectOverlap, false, 'No debe tener top: 10px y right: 10px a la vez para no solapar el corazón');
        assert.ok(ruleBody.includes('top: 36px') || ruleBody.includes('top: 40px') || ruleBody.includes('top: 48px') || ruleBody.includes('top: 46px') || ruleBody.includes('top: 50px'), 'Debe posicionarse verticalmente despejado del corazón');
    }
});

test('M32.1 - 4. Móvil permanece 100% aislado e intacto con sus reglas previas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    // En móvil, .product-category-badge sigue oculto
    assert.ok(/#catalogo-productos-grid\s+\.product-category-badge[\s\S]*?display:\s*none !important;/.test(cssContent), 'Móvil debe mantener oculta la insignia sobre imagen');

    // En móvil, .product-tag mantiene su tamaño móvil original (padding: 2px 5px, font-size: 8.5px)
    assert.ok(cssContent.includes('padding: 2px 5px !important;'), 'Móvil debe conservar padding: 2px 5px');
    assert.ok(cssContent.includes('font-size: 8.5px !important;'), 'Móvil debe conservar font-size: 8.5px');
});
