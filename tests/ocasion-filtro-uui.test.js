const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('CORRECCIÓN PUNTUAL - Textos del Filtro Ocasión y Visualización en Una Sola Línea', async (t) => {
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../catalogo.html'), 'utf8');
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../js/catalogo.js'), 'utf8');
    const cssEstilos = fs.readFileSync(path.resolve(__dirname, '../css/estilos.css'), 'utf8');
    const cssResponsive = fs.readFileSync(path.resolve(__dirname, '../css/responsive.css'), 'utf8');

    await t.test('1. Presencia del dropdown compacto wrapper-ocasion', () => {
        assert.ok(htmlContent.includes('id="wrapper-ocasion"'), 'catalogo.html debe contener wrapper-ocasion');
        assert.ok(htmlContent.includes('id="ocasion-dropdown-trigger"'), 'catalogo.html debe contener ocasion-dropdown-trigger');
        assert.ok(htmlContent.includes('id="ocasion-dropdown-menu"'), 'catalogo.html debe contener ocasion-dropdown-menu');
    });

    await t.test('2. Verificación de los 6 textos exactos sin descripciones parentéticas', () => {
        assert.ok(htmlContent.includes('<span>Todos</span>'), 'Opción 1 debe ser Todos');
        assert.ok(!htmlContent.includes('<span>TODOS</span>'), 'NO debe decir TODOS en mayúsculas');
        assert.ok(htmlContent.includes('<span>Versátil</span>'), 'Opción 2 debe ser Versátil');
        assert.ok(htmlContent.includes('<span>Diario / Oficina</span>'), 'Opción 3 debe ser Diario / Oficina');
        assert.ok(htmlContent.includes('<span>Citas</span>'), 'Opción 4 debe ser Citas');
        assert.ok(htmlContent.includes('<span>Noche / Fiesta</span>'), 'Opción 5 debe ser Noche / Fiesta');
        assert.ok(htmlContent.includes('<span>Formal</span>'), 'Opción 6 debe ser Formal');
    });

    await t.test('3. Reglas CSS de 1 sola línea (white-space: nowrap) para #ocasion-dropdown-menu', () => {
        assert.ok(cssEstilos.includes('#ocasion-dropdown-menu'), 'estilos.css debe definir regla específica para #ocasion-dropdown-menu');
        assert.ok(cssEstilos.includes('white-space: nowrap'), 'estilos.css debe forzar white-space: nowrap en #ocasion-dropdown-menu');
        assert.ok(cssResponsive.includes('#ocasion-dropdown-menu'), 'responsive.css debe incluir override para #ocasion-dropdown-menu');
        assert.ok(cssResponsive.includes('white-space: nowrap'), 'responsive.css debe forzar white-space: nowrap en responsive');
    });

    await t.test('4. Conservación de la cuadrícula de 3 columnas para los triggers cerrados', () => {
        assert.ok(cssResponsive.includes('repeat(3'), 'responsive.css debe mantener 3 columnas para .filter-selects-row');
    });
});
