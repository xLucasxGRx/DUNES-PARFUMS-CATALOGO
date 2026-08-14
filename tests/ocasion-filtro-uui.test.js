const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Ocasión Dropdown - Verificación UI y Comportamiento Informativo', async (t) => {
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../catalogo.html'), 'utf8');
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../js/catalogo.js'), 'utf8');
    const cssEstilos = fs.readFileSync(path.resolve(__dirname, '../css/estilos.css'), 'utf8');
    const cssResponsive = fs.readFileSync(path.resolve(__dirname, '../css/responsive.css'), 'utf8');

    await t.test('1. Existencia y orden visual en HTML ([Género] [Ocasión] [Ordenar])', () => {
        assert.ok(htmlContent.includes('id="wrapper-ocasion"'), 'catalogo.html debe incluir wrapper-ocasion');
        assert.ok(htmlContent.includes('id="ocasion-dropdown-trigger"'), 'catalogo.html debe incluir ocasion-dropdown-trigger');
        assert.ok(htmlContent.includes('Ocasión: Todas'), 'catalogo.html debe incluir la etiqueta "Ocasión: Todas"');
        assert.ok(htmlContent.includes('PRÓXIMAMENTE'), 'catalogo.html debe incluir la opción "PRÓXIMAMENTE"');

        const indexGender = htmlContent.indexOf('id="wrapper-gender"');
        const indexOcasion = htmlContent.indexOf('id="wrapper-ocasion"');
        const indexSort = htmlContent.indexOf('id="wrapper-sort"');

        assert.ok(indexGender < indexOcasion, 'wrapper-gender debe estar antes de wrapper-ocasion');
        assert.ok(indexOcasion < indexSort, 'wrapper-ocasion debe estar antes de wrapper-sort');
    });

    await t.test('2. Comportamiento en JS (no altera productos ni estado de catálogo)', () => {
        assert.ok(jsContent.includes("configurarDropdownPersonalizado('ocasion-dropdown-trigger'"), 'catalogo.js debe configurar el dropdown de ocasión');
    });

    await t.test('3. Distribución de 3 columnas en CSS (.filter-selects-row)', () => {
        assert.ok(cssEstilos.includes('repeat(3'), 'estilos.css debe usar 3 columnas para .filter-selects-row');
        assert.ok(cssResponsive.includes('repeat(3'), 'responsive.css debe usar 3 columnas para .filter-selects-row');
    });

    await t.test('4. Separación semántica de wrappers (Fila 1: 3 dropdowns, Fila 2: Solo disponibles + Contador)', () => {
        const selectsRowRegex = /<div class="filter-selects-row">([\s\S]*?)<\/div>\s*<!-- 5\./;
        const match = htmlContent.match(selectsRowRegex);
        assert.ok(match, 'filter-selects-row debe cerrarse antes del comentario de la fila 5');

        const content = match[1];
        assert.ok(content.includes('id="wrapper-gender"'), 'Fila 1 debe incluir wrapper-gender');
        assert.ok(content.includes('id="wrapper-ocasion"'), 'Fila 1 debe incluir wrapper-ocasion');
        assert.ok(content.includes('id="wrapper-sort"'), 'Fila 1 debe incluir wrapper-sort');
        assert.ok(!content.includes('class="filter-bottom-row"'), 'Fila 1 no debe contener filter-bottom-row');
    });

    await t.test('5. Ancho del dropdown ajustado al control (min-width: 0, max-width: 100%, text wrap)', () => {
        assert.ok(cssEstilos.includes('min-width: 0'), 'estilos.css debe usar min-width: 0 para .dunes-dropdown-menu');
        assert.ok(cssEstilos.includes('white-space: normal'), 'estilos.css debe permitir salto de línea en las opciones de dropdowns');
    });
});
