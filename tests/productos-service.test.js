const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

// Cargar ProductosService en el entorno de pruebas
const code = fs.readFileSync('js/productos-service.js', 'utf8');
const CONFIG = {
    GOOGLE_SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=0&single=true&output=csv',
    PRODUCTOS_RESPALDO_URL: 'data/productos.json'
};
eval(code.replace('const ProductosService', 'global.ProductosService'));

test('ProductosService - Carga exitosa desde Google Sheets CSV real', async () => {
    const res = await ProductosService.cargarProductos();
    assert.strictEqual(res.origen, 'google-sheets');
    assert.ok(Array.isArray(res.productos));
    assert.ok(res.productos.length > 0);
    
    const primerProd = res.productos[0];
    assert.ok(primerProd.id);
    assert.ok(primerProd.nombre);
    assert.ok(primerProd.marca);
    assert.ok(['arabe', 'disenador', 'nicho', 'decants'].includes(primerProd.categoria));
    assert.ok(['hombre', 'mujer', 'unisex', 'sin_clasificar'].includes(primerProd.genero));
    assert.strictEqual(typeof primerProd.visible, 'boolean');
    assert.strictEqual(typeof primerProd.disponible, 'boolean');
});

test('ProductosService - Normalización de booleans (TRUE, FALSE, 1, 0, si, no, verdadero, falso)', () => {
    assert.strictEqual(ProductosService._parseBoolean('TRUE'), true);
    assert.strictEqual(ProductosService._parseBoolean('verdadero'), true);
    assert.strictEqual(ProductosService._parseBoolean('1'), true);
    assert.strictEqual(ProductosService._parseBoolean('sí'), true);
    assert.strictEqual(ProductosService._parseBoolean('FALSE'), false);
    assert.strictEqual(ProductosService._parseBoolean('falso'), false);
    assert.strictEqual(ProductosService._parseBoolean('0'), false);
    assert.strictEqual(ProductosService._parseBoolean('no'), false);
    assert.strictEqual(ProductosService._parseBoolean('invalido'), false);
});

test('ProductosService - Normalización de encabezados dinámicos con BOM o saltos de línea', () => {
    assert.strictEqual(ProductosService._normalizarCabecera('\uFEFFNombre\r\n'), 'nombre');
    assert.strictEqual(ProductosService._normalizarCabecera('Precio 3ml'), 'precio_3ml');
    assert.strictEqual(ProductosService._normalizarCabecera('  GENERO  '), 'genero');
});

test('ProductosService - Fallback transparente a JSON si Google Sheets falla', async () => {
    const originalUrl = CONFIG.GOOGLE_SHEETS_CSV_URL;
    CONFIG.GOOGLE_SHEETS_CSV_URL = 'https://url.inexistente.google.com/invalid.csv';
    try {
        const res = await ProductosService.cargarProductos();
        assert.strictEqual(res.origen, 'json-respaldo');
        assert.ok(Array.isArray(res.productos));
        assert.ok(res.productos.length > 0);
    } finally {
        CONFIG.GOOGLE_SHEETS_CSV_URL = originalUrl;
    }
});

test('ProductosService - Lectura y normalización de precio_oferta', async () => {
    const res = await ProductosService.cargarProductos();
    const prodOferta = res.productos.find(p => p.oferta === true && p.precio_oferta !== null);
    if (prodOferta) {
        assert.strictEqual(typeof prodOferta.precio_oferta, 'number');
        assert.strictEqual(prodOferta.precio_oferta, prodOferta.precioOferta);
    }
});

test('ProductosService - Lectura y sanitización de imagen_notas (solo URLs HTTPS válidas)', () => {
    assert.strictEqual(ProductosService._normalizarImagenNotas('https://servidor.com/notas.webp'), 'https://servidor.com/notas.webp');
    assert.strictEqual(ProductosService._normalizarImagenNotas('   https://servidor.com/notas.webp  '), 'https://servidor.com/notas.webp');
    assert.strictEqual(ProductosService._normalizarImagenNotas('http://servidor-inseguro.com/notas.jpg'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas('javascript:alert(1)'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas('data:image/png;base64,123'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas('img/local.jpg'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas(''), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas(null), '');
});

test('ProductosService - Soporte de imagen_notas en productos cargados', async () => {
    const res = await ProductosService.cargarProductos();
    for (const p of res.productos) {
        assert.ok('imagen_notas' in p, 'Cada producto debe poseer la propiedad imagen_notas');
        if (p.imagen_notas) {
            assert.ok(p.imagen_notas.startsWith('https://'), 'Si imagen_notas no es vacía, debe ser una URL HTTPS');
        }
    }
});
