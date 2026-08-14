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

test('ProductosService - Lectura y sanitización de imagen_notas (URLs externas HTTPS/HTTP y rutas locales)', () => {
    assert.strictEqual(ProductosService._normalizarImagenNotas('https://servidor.com/notas.webp'), 'https://servidor.com/notas.webp');
    assert.strictEqual(ProductosService._normalizarImagenNotas('   https://servidor.com/notas.webp  '), 'https://servidor.com/notas.webp');
    assert.strictEqual(ProductosService._normalizarImagenNotas('http://servidor.com/notas.jpg'), 'http://servidor.com/notas.jpg');
    assert.strictEqual(ProductosService._normalizarImagenNotas('img/notas/khamrah.webp'), 'img/notas/khamrah.webp');
    assert.strictEqual(ProductosService._normalizarImagenNotas('javascript:alert(1)'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas('data:image/png;base64,123'), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas(''), '');
    assert.strictEqual(ProductosService._normalizarImagenNotas(null), '');
});

test('ProductosService - resolverImagen soporta URLs externas, rutas locales y fallbacks', () => {
    const resolver = ProductosService.resolverImagen || ProductosService._resolverImagen;
    assert.strictEqual(resolver('https://i.imgur.com/xxxxx.webp'), 'https://i.imgur.com/xxxxx.webp');
    assert.strictEqual(resolver('http://servidor.com/imagenes/khamrah.jpg'), 'http://servidor.com/imagenes/khamrah.jpg');
    assert.strictEqual(resolver('img/productos/khamrah.webp'), 'img/productos/khamrah.webp');
    assert.strictEqual(resolver(''), 'img/logo/logohorizontaldunesparfums.png');
    assert.strictEqual(resolver(null), 'img/logo/logohorizontaldunesparfums.png');
    assert.strictEqual(resolver('javascript:alert(1)'), 'img/logo/logohorizontaldunesparfums.png');
});

test('ProductosService - Soporte de imagen_notas en productos cargados', async () => {
    const res = await ProductosService.cargarProductos();
    for (const p of res.productos) {
        assert.ok('imagen_notas' in p, 'Cada producto debe poseer la propiedad imagen_notas');
        if (p.imagen_notas) {
            assert.ok(p.imagen_notas.startsWith('https://') || p.imagen_notas.startsWith('http://') || p.imagen_notas.startsWith('img/'), 'Si imagen_notas no es vacía, debe ser una URL válida o ruta local');
        }
    }
});

test('ProductosService - Simulación de CSV SIN las 4 columnas de oferta eliminadas (oferta_titulo, oferta_subtitulo, oferta_texto_stock, oferta_vigencia)', () => {
    // CSV de prueba donde las columnas V, W, X, Y fueron eliminadas de la hoja
    const csvSinColumnasOferta = [
        'id,nombre,marca,categoria,formato,genero,disponible,visible,imagen,imagen_notas,descripcion,destacado,oferta,precio_oferta,precio,stock',
        'p100,Khamrah Spec,Lattafa,sellados,Sellado,unisex,true,true,img/p100.webp,https://img.com/notas.webp,Fragancia dulce,true,true,140,165,5'
    ].join('\n');

    const rows = ProductosService._parseCSV(csvSinColumnasOferta);
    assert.strictEqual(rows.length, 2);

    const headers = rows[0].map(h => ProductosService._normalizarCabecera(h));
    assert.ok(!headers.includes('oferta_titulo'), 'No debe contener oferta_titulo');
    assert.ok(!headers.includes('oferta_subtitulo'), 'No debe contener oferta_subtitulo');
    assert.ok(!headers.includes('oferta_texto_stock'), 'No debe contener oferta_texto_stock');
    assert.ok(!headers.includes('oferta_vigencia'), 'No debe contener oferta_vigencia');

    const row = rows[1];
    const rawObj = {};
    headers.forEach((h, idx) => { rawObj[h] = row[idx] !== undefined ? row[idx] : ''; });

    assert.strictEqual(rawObj.id, 'p100');
    assert.strictEqual(rawObj.nombre, 'Khamrah Spec');
    assert.strictEqual(ProductosService._parseBoolean(rawObj.oferta), true);
    assert.strictEqual(ProductosService._parseNumber(rawObj.precio_oferta), 140);
    assert.strictEqual(ProductosService._parseNumber(rawObj.precio), 165);
    assert.strictEqual(rawObj.imagen_notas, 'https://img.com/notas.webp');
});
