const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('MEJORA PUNTUAL - Botón Limpiar Filtros', async (t) => {
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../catalogo.html'), 'utf8');
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../js/catalogo.js'), 'utf8');
    const cssEstilos = fs.readFileSync(path.resolve(__dirname, '../css/estilos.css'), 'utf8');
    const cssResponsive = fs.readFileSync(path.resolve(__dirname, '../css/responsive.css'), 'utf8');

    await t.test('1. Existencia del botón <button id="btn-clear-filters"> en catalogo.html', () => {
        assert.ok(htmlContent.includes('id="btn-clear-filters"'), 'catalogo.html debe incluir el botón btn-clear-filters');
        assert.ok(htmlContent.includes('class="btn-clear-filters"'), 'catalogo.html debe asignar la clase btn-clear-filters');
        assert.ok(htmlContent.includes('Limpiar filtros'), 'El botón debe mostrar el texto "Limpiar filtros"');
        assert.ok(htmlContent.includes('hidden'), 'El botón debe incluir el atributo hidden por defecto');
    });

    await t.test('2. Integración en la franja inferior (.filter-bottom-row)', () => {
        assert.ok(htmlContent.includes('class="filter-actions-right"'), 'catalogo.html debe agrupar btn-clear-filters en filter-actions-right');
        assert.ok(cssEstilos.includes('.btn-clear-filters'), 'estilos.css debe definir estilos para .btn-clear-filters');
        assert.ok(cssEstilos.includes('.filter-actions-right'), 'estilos.css debe definir contenedor flex para filter-actions-right');
    });

    await t.test('3. Función de visibilidad condicional (actualizarBotonLimpiarFiltros)', () => {
        assert.ok(jsContent.includes('function actualizarBotonLimpiarFiltros'), 'catalogo.js debe declarar actualizarBotonLimpiarFiltros');
        assert.ok(jsContent.includes('btnClear.hidden = false'), 'Muestra el botón cuando hay algún filtro activo');
        assert.ok(jsContent.includes('btnClear.hidden = true'), 'Oculta el botón cuando todo está en estado inicial');
    });

    await t.test('4. Comportamiento de reinicio completo (limpiarTodosLosFiltros)', () => {
        assert.ok(jsContent.includes("estado.formato = 'todos'"), 'Restaura formato a todos');
        assert.ok(jsContent.includes("estado.tipo = 'todos'"), 'Restaura tipo a todos');
        assert.ok(jsContent.includes("estado.genero = 'todos'"), 'Restaura genero a todos');
        assert.ok(jsContent.includes("estado.ocasion = 'todas'"), 'Restaura ocasion a todas');
        assert.ok(jsContent.includes("estado.busqueda = ''"), 'Restaura busqueda a cadena vacía');
        assert.ok(jsContent.includes('estado.soloDisponibles = false'), 'Desactiva soloDisponibles');
        assert.ok(jsContent.includes("estado.orden = 'relevancia'"), 'Restaura orden a relevancia');
        assert.ok(jsContent.includes('guardarEstadoCatalogo(estado)'), 'Limpia y actualiza la persistencia');
    });

    await t.test('5. Adaptación responsive sin scroll horizontal', () => {
        assert.ok(cssResponsive.includes('.btn-clear-filters'), 'responsive.css debe incluir adaptación móvil para .btn-clear-filters');
        assert.ok(cssResponsive.includes('flex-wrap: wrap'), 'responsive.css debe permitir wrap adaptativo en filter-bottom-row');
    });
});
