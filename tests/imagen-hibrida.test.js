/**
 * Dunes Parfums - Tests de Unidad e Integración para FASE M22 (Soporte Híbrido de Imágenes)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

// Cargar ProductosService en el entorno de pruebas
const serviceCode = fs.readFileSync('js/productos-service.js', 'utf8');
const CONFIG = {
    GOOGLE_SHEETS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=0&single=true&output=csv',
    PRODUCTOS_RESPALDO_URL: 'data/productos.json'
};
eval(serviceCode.replace('const ProductosService', 'global.ProductosService'));

test('FASE M22 - resolverImagen: Caso 1 (Ruta local)', () => {
    const resolver = ProductosService.resolverImagen;
    const resultado = resolver('img/productos/khamrah.webp');
    assert.strictEqual(resultado, 'img/productos/khamrah.webp');
});

test('FASE M22 - resolverImagen: Caso 2 (URLs HTTPS/HTTP externas)', () => {
    const resolver = ProductosService.resolverImagen;
    assert.strictEqual(resolver('https://i.imgur.com/xxxxx.webp'), 'https://i.imgur.com/xxxxx.webp');
    assert.strictEqual(resolver('http://servidor.com/imagenes/khamrah.jpg'), 'http://servidor.com/imagenes/khamrah.jpg');
    assert.strictEqual(resolver('https://cdn.midominio.com/productos/asad.webp'), 'https://cdn.midominio.com/productos/asad.webp');
});

test('FASE M22 - resolverImagen: Manejo de valores vacíos, nulos e inseguros', () => {
    const resolver = ProductosService.resolverImagen;
    const placeholder = 'img/logo/logohorizontaldunesparfums.png';
    assert.strictEqual(resolver(''), placeholder);
    assert.strictEqual(resolver('   '), placeholder);
    assert.strictEqual(resolver(null), placeholder);
    assert.strictEqual(resolver(undefined), placeholder);
    assert.strictEqual(resolver('javascript:alert(1)'), placeholder);
});

test('FASE M22 - normalizarImagenNotas: Soporte híbrido local y externa', () => {
    const norm = ProductosService._normalizarImagenNotas;
    assert.strictEqual(norm('img/notas/khamrah.webp'), 'img/notas/khamrah.webp');
    assert.strictEqual(norm('https://servidor.com/notas.webp'), 'https://servidor.com/notas.webp');
    assert.strictEqual(norm('http://servidor.com/notas.jpg'), 'http://servidor.com/notas.jpg');
    assert.strictEqual(norm(''), '');
    assert.strictEqual(norm(null), '');
});

test('FASE M22 - generarHtmlLadoImagen: Renderiza URLs locales y externas con handlers onerror', () => {
    global.window = {};
    global.document = { addEventListener: () => {} };
    const interfazCode = fs.readFileSync('js/interfaz.js', 'utf8');
    const scope = {};
    const evalFn = new Function('resolverImagen', interfazCode + '\nreturn generarHtmlLadoImagen;');
    const generarHtmlLadoImagen = evalFn(ProductosService.resolverImagen);

    const prodHibrido = {
        id: 'p-test',
        nombre: 'Perfume Test',
        marca: 'Marca Test',
        imagen: 'https://i.imgur.com/test.webp',
        imagen_notas: 'img/notas/test-notas.webp'
    };

    const html = generarHtmlLadoImagen(prodHibrido);
    assert.ok(html.includes('src="https://i.imgur.com/test.webp"'));
    assert.ok(html.includes('src="img/notas/test-notas.webp"'));
    assert.ok(html.includes('onerror="this.onerror=null; this.src=\'img/logo/logohorizontaldunesparfums.png\';"'));
});

test('FASE M22.1 - Determinismo estricto Badee Noble Blush en 10 recargas simuladas', () => {
    const prodBadee = {
        id: '3',
        nombre: 'Badee Noble Blush',
        marca: 'Lattafa',
        imagen: 'img/productos/badee noble blush.webp',
        imagen_notas: 'https://fimgs.net/mdimg/perfume-social-cards/es-p_c_98937.jpeg'
    };

    const resolver = ProductosService.resolverImagen;
    const rutaEsperada = 'img/productos/badee noble blush.webp';

    for (let i = 0; i < 10; i++) {
        const res = resolver(prodBadee.imagen);
        assert.strictEqual(res, rutaEsperada, `Iteración ${i + 1}: Debe retornar exactamente "${rutaEsperada}"`);
    }

    // Verificar existencia física en disco de la ruta con espacios y sin espacios
    const pathConEspacios = 'img/productos/badee noble blush.webp';
    const pathSinEspacios = 'img/productos/badeenobleblush.webp';
    assert.ok(fs.existsSync(pathConEspacios), `El archivo "${pathConEspacios}" debe existir en el repositorio`);
    assert.ok(fs.existsSync(pathSinEspacios), `El archivo "${pathSinEspacios}" debe existir en el repositorio`);
});
