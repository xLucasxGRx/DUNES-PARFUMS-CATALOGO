/**
 * Dunes Parfums - Tests unitarios para la estructura responsive de las Tarjetas de Modalidad de Entrega
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('ResponsiveDeliveryCards - CSS responsive no debe romper la estructura horizontal de las tarjetas', () => {
    const cssContent = fs.readFileSync('css/responsive.css', 'utf8');

    // Verificar que no exista grid-column: 1 / -1 en .delivery-option-badge
    assert.equal(
        cssContent.includes('#page-carrito .delivery-option-badge {\n    grid-column: 1 / -1'),
        false,
        'El badge no debe colapsar a una segunda fila completa'
    );

    // Verificar que .delivery-option-card mantenga 4 columnas grid
    assert.ok(
        cssContent.includes('grid-template-columns: auto auto minmax(0, 1fr) auto'),
        'Debe definir las 4 columnas horizontales compactas'
    );
});
