/**
 * Dunes Parfums - Tests unitarios para js/cupones-service.js (FASE C7)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { CSV_SAMPLE_VALID } = require('./fixtures/cupones-fixtures.js');

// Configurar entorno global simulado
globalThis.window = globalThis;
eval(fs.readFileSync('js/config.js', 'utf8'));
eval(fs.readFileSync('js/cupones-service.js', 'utf8'));

test('CuponesService - Carga y parseo correcto de CSV válido', async () => {
    window.cuponesService.limpiarCache();

    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_VALID
    });

    const cupones = await window.cuponesService.cargarCupones();
    assert.equal(Array.isArray(cupones), true);
    assert.equal(cupones.length, 6);

    const tiodunes = cupones.find(c => c.codigo === 'TIODUNES');
    assert.notEqual(tiodunes, undefined);
    assert.equal(tiodunes.codigo, 'TIODUNES');
    assert.equal(tiodunes.tipo, 'monto_fijo');
    assert.equal(tiodunes.valor, 10);
    assert.equal(tiodunes.montoMinimo, 160);
    assert.equal(tiodunes.activo, true);
    assert.equal(tiodunes.alcance, 'todos');
});

test('CuponesService - Normalización de booleanos y listas separadas por pipe |', async () => {
    window.cuponesService.limpiarCache();

    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_VALID
    });

    const cupones = await window.cuponesService.cargarCupones();
    const soloArabe = cupones.find(c => c.codigo === 'SOLOARABE');
    assert.equal(soloArabe.activo, true);
    assert.deepEqual(soloArabe.categoriasPermitidas, ['arabe']);

    const soloEspecial = cupones.find(c => c.codigo === 'SOLOESPECIAL');
    assert.equal(soloEspecial.activo, true);
    assert.deepEqual(soloEspecial.productosPermitidos, ['p12', '12']);
});

test('CuponesService - Búsqueda de cupón por código case-insensitive', async () => {
    window.cuponesService.limpiarCache();

    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_VALID
    });

    const cupon1 = await window.cuponesService.buscarCuponPorCodigo('tiodunes');
    assert.notEqual(cupon1, null);
    assert.equal(cupon1.codigo, 'TIODUNES');

    const cupon2 = await window.cuponesService.buscarCuponPorCodigo('  dunes10  ');
    assert.notEqual(cupon2, null);
    assert.equal(cupon2.codigo, 'DUNES10');
});

test('CuponesService - Manejo de error de red o HTTP 500', async () => {
    window.cuponesService.limpiarCache();

    globalThis.fetch = async () => ({
        ok: false,
        status: 500
    });

    const cupones = await window.cuponesService.cargarCupones();
    assert.deepEqual(cupones, []);

    const res = await window.cuponesService.buscarCuponPorCodigo('TIODUNES');
    assert.equal(res, null);
});

test('CuponesService - Manejo de CSV con estructura o columnas inválidas', async () => {
    window.cuponesService.limpiarCache();

    globalThis.fetch = async () => ({
        ok: true,
        text: async () => 'columna_invalida,otra_columna\n1,2'
    });

    const cupones = await window.cuponesService.cargarCupones();
    assert.deepEqual(cupones, []);
});

test('CuponesService - Caché en memoria y recarga forzada por limpiarCache()', async () => {
    window.cuponesService.limpiarCache();
    let llamadasFetch = 0;

    globalThis.fetch = async () => {
        llamadasFetch++;
        return { ok: true, text: async () => CSV_SAMPLE_VALID };
    };

    await window.cuponesService.cargarCupones();
    await window.cuponesService.cargarCupones();
    assert.equal(llamadasFetch, 1);

    window.cuponesService.limpiarCache();
    await window.cuponesService.cargarCupones();
    assert.equal(llamadasFetch, 2);
});
