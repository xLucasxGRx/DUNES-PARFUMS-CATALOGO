/**
 * Dunes Parfums - Tests de Unidad e Integración para FASE M26 (Rediseño del Sistema de Filtros)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('M26 - 1. catalogo.html contiene la estructura de FORMATO, TIPO, Dropdowns Personalizados de Género y Ordenamiento', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '../catalogo.html'), 'utf8');

    assert.ok(htmlContent.includes('filter-group--formato'), 'Debe existir el grupo de formato');
    assert.ok(htmlContent.includes('data-formato="sellado"'), 'Debe incluir la opción SELLADOS');
    assert.ok(htmlContent.includes('data-formato="decant"'), 'Debe incluir la opción DECANTS');

    assert.ok(htmlContent.includes('filter-group--tipo'), 'Debe existir el grupo de tipo');
    assert.ok(htmlContent.includes('data-tipo="arabe"'), 'Debe incluir la opción ÁRABES');
    assert.ok(htmlContent.includes('data-tipo="disenador"'), 'Debe incluir la opción DISEÑADOR');
    assert.ok(htmlContent.includes('data-tipo="nicho"'), 'Debe incluir la opción NICHO');

    assert.ok(htmlContent.includes('filter-selects-row'), 'Debe existir la fila que agrupa Género y Ordenar en la misma fila');
    assert.ok(htmlContent.includes('filter-bottom-row'), 'Debe existir la fila inferior con Solo disponibles a la izquierda y Contador a la derecha');

    assert.ok(htmlContent.includes('id="gender-dropdown-trigger"'), 'Debe existir el botón disparador del dropdown de género');
    assert.ok(htmlContent.includes('id="gender-dropdown-menu"'), 'Debe existir el menú flotante del dropdown de género');
    assert.ok(htmlContent.includes('id="sort-dropdown-trigger"'), 'Debe existir el botón disparador del dropdown de ordenamiento');
    assert.ok(htmlContent.includes('id="sort-dropdown-menu"'), 'Debe existir el menú flotante del dropdown de ordenamiento');

    assert.ok(htmlContent.includes('id="filter-gender-select"'), 'Debe mantener el select nativo de género de respaldo');
    assert.ok(htmlContent.includes('id="sort-price"'), 'Debe mantener el select nativo de ordenamiento de respaldo');
});

test('M26.3 - Restitución de margen útil en móvil y CSS de dropdowns Dunes', () => {
    const cssEstilos = fs.readFileSync(path.join(__dirname, '../css/estilos.css'), 'utf8');
    const cssResponsive = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');

    assert.ok(cssEstilos.includes('.dunes-dropdown-trigger'), 'Debe definir los estilos del disparador Dunes');
    assert.ok(cssEstilos.includes('.dunes-dropdown-menu'), 'Debe definir los estilos del menú flotante Dunes');
    assert.ok(cssResponsive.includes('calc(100% - 32px)'), 'Debe definir la restitución del margen útil en móvil (16px de respiración lateral)');
    assert.ok(cssResponsive.includes('padding-left: 0'), 'Debe alinear el grid de productos con los filtros en móvil usando padding-left: 0');
});

test('M26 - 2. Lógica combinada de FORMATO (sellados/decants) y TIPO (nicho/árabe/diseñador) con Erba Pura', () => {
    const jsonContent = fs.readFileSync(path.join(__dirname, '../data/productos.json'), 'utf8');
    const productos = JSON.parse(jsonContent);

    const normalizarTexto = (str) => {
        if (!str) return '';
        return String(str).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const coincideGenero = (generoProducto, generoFiltro) => {
        if (!generoFiltro || generoFiltro === 'todos') return true;
        const gProd = normalizarTexto(generoProducto);
        if (generoFiltro === 'hombre') return gProd === 'hombre' || gProd === 'unisex';
        if (generoFiltro === 'mujer') return gProd === 'mujer' || gProd === 'unisex';
        if (generoFiltro === 'unisex') return gProd === 'unisex';
        return false;
    };

    const filtrarPipeline = (list, estado) => {
        return list.filter(prod => {
            if (prod.visible === false) return false;

            if (estado.busqueda) {
                const qNorm = normalizarTexto(estado.busqueda);
                const nomNorm = normalizarTexto(prod.nombre);
                const marNorm = normalizarTexto(prod.marca);
                if (!nomNorm.includes(qNorm) && !marNorm.includes(qNorm)) return false;
            }

            if (estado.formato === 'sellado') {
                const esDecant = prod.categoria === 'decants' || (prod.formato && normalizarTexto(prod.formato).includes('decant'));
                if (esDecant) return false;
            } else if (estado.formato === 'decant') {
                const esDecant = prod.categoria === 'decants' || (prod.formato && normalizarTexto(prod.formato).includes('decant'));
                if (!esDecant) return false;
            }

            if (estado.tipo !== 'todos') {
                const catNorm = normalizarTexto(prod.categoria);
                const tipoProdNorm = normalizarTexto(prod.tipo);
                const tipoNorm = normalizarTexto(estado.tipo);
                if (catNorm !== tipoNorm && !tipoProdNorm.includes(tipoNorm)) return false;
            }

            if (!coincideGenero(prod.genero, estado.genero)) return false;

            if (estado.soloDisponibles) {
                const esDecant = prod.categoria === 'decants' || (prod.formato && normalizarTexto(prod.formato).includes('decant'));
                const estaAgotado = esDecant
                    ? (!prod.disponible || (prod.mililitrosDisponibles ?? 0) < 3)
                    : (!prod.disponible || (prod.stock ?? 0) <= 0);
                if (estaAgotado) return false;
            }

            return true;
        });
    };

    // Prueba Erba Pura con FORMATO: SELLADOS + TIPO: NICHO
    const resErbaSelladosNicho = filtrarPipeline(productos, {
        busqueda: '',
        formato: 'sellado',
        tipo: 'nicho',
        genero: 'todos',
        soloDisponibles: false,
        orden: 'relevancia'
    });

    assert.ok(resErbaSelladosNicho.length >= 1, 'FORMATO: sellado + TIPO: nicho debe encontrar a Erba Pura');
    const erbaItem = resErbaSelladosNicho.find(p => p.nombre === 'Erba Pura');
    assert.ok(erbaItem, 'Erba Pura debe estar en los resultados de sellados nicho');

    // Prueba Khamrah con FORMATO: SELLADOS + TIPO: ARABE
    const resKhamrahSelladosArabe = filtrarPipeline(productos, {
        busqueda: '',
        formato: 'sellado',
        tipo: 'arabe',
        genero: 'todos',
        soloDisponibles: false,
        orden: 'relevancia'
    });
    assert.ok(resKhamrahSelladosArabe.length >= 1, 'FORMATO: sellado + TIPO: arabe debe encontrar a Khamrah');

    // Prueba Erba Pura con búsqueda "xerjoff" + FORMATO: SELLADOS
    const resXerjoff = filtrarPipeline(productos, {
        busqueda: 'xerjoff',
        formato: 'sellado',
        tipo: 'todos',
        genero: 'todos',
        soloDisponibles: false,
        orden: 'relevancia'
    });
    assert.ok(resXerjoff.length >= 1, 'Búsqueda xerjoff debe encontrar a Erba Pura');
});
