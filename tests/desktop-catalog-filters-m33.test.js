/**
 * Dunes Parfums - Tests de Unidad e Integración para FASE M33
 * Organización y equilibrio visual de filtros del catálogo en Laptop / Desktop
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('M33 - 1. css/responsive.css organiza los filtros del catálogo en 2 columnas equilibradas en Laptop/Desktop (min-width: 1024px)', () => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');

    // Debe incluir la sección de optimización de filtros desktop
    assert.ok(
        cssContent.includes('FASE M33') || cssContent.includes('ORGANIZACIÓN DE FILTROS EN LAPTOP'),
        'Debe incluir la cabecera descriptiva de FASE M33'
    );

    // Debe aplicar grid de 2 columnas para organizar FORMATO y TIPO en una sola fila
    assert.ok(
        cssContent.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr)') ||
        cssContent.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr)') ||
        cssContent.includes('grid-template-columns: auto 1fr') ||
        cssContent.includes('grid-template-columns: 1fr 1fr'),
        'catalog-filters-bar debe usar grid de 2 columnas en laptop/desktop'
    );

    // Buscador debe ocupar el ancho completo en la parte superior
    assert.ok(
        cssContent.includes('#page-catalogo .filter-search-box') &&
        cssContent.includes('grid-column: 1 / -1'),
        'filter-search-box debe abarcar todas las columnas (1 / -1)'
    );

    // Formato en columna 1 y Tipo en columna 2
    assert.ok(
        cssContent.includes('#page-catalogo .filter-group--formato') &&
        cssContent.includes('grid-column: 1'),
        'filter-group--formato debe posicionarse en la columna 1'
    );
    assert.ok(
        cssContent.includes('#page-catalogo .filter-group--tipo') &&
        cssContent.includes('grid-column: 2'),
        'filter-group--tipo debe posicionarse en la columna 2'
    );

    // Selects y bottom-row deben abarcar todas las columnas
    assert.ok(
        cssContent.includes('#page-catalogo .filter-selects-row') &&
        cssContent.includes('grid-column: 1 / -1'),
        'filter-selects-row debe abarcar todas las columnas'
    );
    assert.ok(
        cssContent.includes('#page-catalogo .filter-bottom-row') &&
        cssContent.includes('grid-column: 1 / -1'),
        'filter-bottom-row debe abarcar todas las columnas'
    );
});

test('M33 - 2. catalogo.html preserva todos los nombres, funciones, IDs y atributos de los filtros', () => {
    const html = fs.readFileSync(path.join(__dirname, '../catalogo.html'), 'utf8');

    // Nombres exactos de botones de formato
    assert.ok(html.includes('>TODOS</button>'), 'Debe conservar botón TODOS');
    assert.ok(html.includes('>SELLADOS</button>'), 'Debe conservar botón SELLADOS');
    assert.ok(html.includes('>DECANTS</button>'), 'Debe conservar botón DECANTS');

    // Nombres exactos de botones de tipo
    assert.ok(html.includes('>ÁRABES</button>'), 'Debe conservar botón ÁRABES');
    assert.ok(html.includes('>DISEÑADOR</button>'), 'Debe conservar botón DISEÑADOR');
    assert.ok(html.includes('>NICHO</button>'), 'Debe conservar botón NICHO');

    // Etiquetas exactas
    assert.ok(html.includes('>FORMATO</span>'), 'Debe conservar etiqueta FORMATO');
    assert.ok(html.includes('>TIPO</span>'), 'Debe conservar etiqueta TIPO');

    // IDs de controles
    assert.ok(html.includes('id="search-perfume"'), 'Debe conservar id search-perfume');
    assert.ok(html.includes('id="gender-dropdown-trigger"'), 'Debe conservar id gender-dropdown-trigger');
    assert.ok(html.includes('id="ocasion-dropdown-trigger"'), 'Debe conservar id ocasion-dropdown-trigger');
    assert.ok(html.includes('id="sort-dropdown-trigger"'), 'Debe conservar id sort-dropdown-trigger');
    assert.ok(html.includes('id="filter-available"'), 'Debe conservar id filter-available');
    assert.ok(html.includes('id="btn-clear-filters"'), 'Debe conservar id btn-clear-filters');
    assert.ok(html.includes('id="results-count"'), 'Debe conservar id results-count');
});

test('M33 - 3. Filtros móviles (<= 768px) permanecen intactos e independientes', () => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');

    // Debe conservar las reglas móviles de FASE M26 intactas
    assert.ok(cssContent.includes('#page-catalogo .filter-group--formato .filter-buttons-container'), 'Móvil debe conservar grid de formato');
    assert.ok(cssContent.includes('#page-catalogo .filter-group--tipo .filter-buttons-container'), 'Móvil debe conservar grid de tipo');
});
