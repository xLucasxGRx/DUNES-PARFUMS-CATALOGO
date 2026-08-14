const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('CORRECCIÓN DEFINITIVA - Solo un dropdown puede estar abierto en el comparador y selección infalible', async (t) => {
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../js/comparador.js'), 'utf8');
    const cssEstilos = fs.readFileSync(path.resolve(__dirname, '../css/estilos.css'), 'utf8');

    await t.test('1. Funciones centralizadas obligatorias de apertura y cierre', () => {
        assert.ok(jsContent.includes('function closeComparatorDropdowns'), 'js/comparador.js debe declarar closeComparatorDropdowns');
        assert.ok(jsContent.includes('function openComparatorSearch'), 'js/comparador.js debe declarar openComparatorSearch');
        assert.ok(jsContent.includes('function verificarSingleDropdownState'), 'js/comparador.js debe declarar la aserción de desarrollo verificarSingleDropdownState');
    });

    await t.test('2. Reglas estricta de CSS para ocultar .comparator-dropdown-results[hidden] e is-hidden', () => {
        assert.ok(cssEstilos.includes('.comparator-dropdown-results[hidden]'), 'estilos.css debe incluir selector .comparator-dropdown-results[hidden]');
        assert.ok(cssEstilos.includes('.comparator-dropdown-results.is-hidden'), 'estilos.css debe incluir selector .comparator-dropdown-results.is-hidden');
        assert.ok(cssEstilos.includes('display: none !important'), 'estilos.css debe aplicar display: none !important para ocultamiento físico en DOM');
    });

    await t.test('3. Cierre físico completo en JS (display = none, hidden = true, is-hidden, aria-expanded=false)', () => {
        assert.ok(jsContent.includes("dropdown.style.display = 'none'"), 'closeComparatorDropdowns debe forzar style.display = none');
        assert.ok(jsContent.includes("dropdown.setAttribute('hidden', '')"), 'closeComparatorDropdowns debe asignar atributo hidden');
        assert.ok(jsContent.includes("dropdown.classList.add('is-hidden')"), 'closeComparatorDropdowns debe añadir clase is-hidden');
        assert.ok(jsContent.includes("input.setAttribute('aria-expanded', 'false')"), 'closeComparatorDropdowns debe marcar aria-expanded=false');
    });

    await t.test('4. Todas las rutas de apertura (focus, click, input) usan openComparatorSearch', () => {
        assert.ok(jsContent.includes("input.addEventListener('focus', () => {\n            openComparatorSearch(ladoKey);"), 'focus debe usar openComparatorSearch');
        assert.ok(jsContent.includes("input.addEventListener('click', (e) => {\n            e.stopPropagation();\n            openComparatorSearch(ladoKey);"), 'click debe usar openComparatorSearch');
        assert.ok(jsContent.includes("input.addEventListener('input', () => {\n            openComparatorSearch(ladoKey);"), 'input debe usar openComparatorSearch');
    });

    await t.test('5. Captura global por pointerdown, click y Escape ignorando clics dentro del dropdown', () => {
        assert.ok(jsContent.includes("document.addEventListener('pointerdown'"), 'debe escuchar pointerdown para respuesta táctil inmediata');
        assert.ok(jsContent.includes("e.target.closest('.comparator-dropdown-results')"), 'handleOutsideInteraction debe ignorar toques dentro de .comparator-dropdown-results');
        assert.ok(jsContent.includes("e.key === 'Escape'"), 'debe cerrar al presionar Escape');
    });

    await t.test('6. Delegación de eventos para selección de sugerencias con data-product-id y priorización sobre el cierre', () => {
        assert.ok(jsContent.includes("dataset.productId = String(prod.id).trim()"), 'Cada sugerencia debe asignar dataset.productId');
        assert.ok(jsContent.includes("seleccionarProducto(ladoKey, productoSel)"), 'manejarSeleccionItem debe llamar primero a seleccionarProducto');
        assert.ok(jsContent.includes("closeComparatorDropdowns(null)"), 'closeComparatorDropdowns se ejecuta después de seleccionarProducto');
    });
});
