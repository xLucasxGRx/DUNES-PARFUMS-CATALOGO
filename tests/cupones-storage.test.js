/**
 * Dunes Parfums - Tests unitarios para la persistencia del cupón (js/interfaz.js - FASE C7)
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { CSV_SAMPLE_VALID } = require('./fixtures/cupones-fixtures.js');

globalThis.window = globalThis;

let mockStorage = {};
globalThis.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; }
};

globalThis.document = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null
};

let mockCart = [
    { id: 'p1', idProducto: 'p1', nombre: 'Khamrah Clásico', categoria: 'arabe', precioUnitario: 160, cantidad: 1 }
];

window.carritoModulo = { obtenerCarrito: () => mockCart, mostrarToastPremium: () => {} };

eval(fs.readFileSync('js/config.js', 'utf8'));
eval(fs.readFileSync('js/cupones-service.js', 'utf8'));
eval(fs.readFileSync('js/cupones.js', 'utf8'));
globalThis.fetch = async () => ({ ok: true, text: async () => CSV_SAMPLE_VALID });
eval(fs.readFileSync('js/interfaz.js', 'utf8'));

beforeEach(() => {
    mockStorage = {};
    window.cuponesCheckout.quitarCupon();
});

test('CuponesStorage - Guardar cupón válido solo versión, código y fecha', async () => {
    await window.cuponesCheckout.aplicarCupon('TIODUNES');

    const raw = mockStorage['dunes_coupon_v1'];
    assert.notEqual(raw, undefined);

    const parsed = JSON.parse(raw);
    assert.equal(parsed.version, 1);
    assert.equal(parsed.codigo, 'TIODUNES');
    assert.notEqual(parsed.guardadoEn, undefined);

    // PROHIBIDO guardar datos calculados
    assert.equal(parsed.descuento, undefined);
    assert.equal(parsed.subtotalBruto, undefined);
    assert.equal(parsed.subtotalNeto, undefined);
    assert.equal(parsed.totalFinal, undefined);
    assert.equal(parsed.cupon, undefined);
});

test('CuponesStorage - Retención de código cuando monto mínimo no es alcanzado', async () => {
    // MIN200 requiere S/200, carrito tiene S/160
    await window.cuponesCheckout.aplicarCupon('DUNES10');
    assert.notEqual(mockStorage['dunes_coupon_v1'], undefined);
});

test('CuponesStorage - Eliminación inmediata al quitar cupón', async () => {
    await window.cuponesCheckout.aplicarCupon('TIODUNES');
    assert.notEqual(mockStorage['dunes_coupon_v1'], undefined);

    window.cuponesCheckout.quitarCupon();
    assert.equal(mockStorage['dunes_coupon_v1'], undefined);
});

test('CuponesStorage - Eliminación cuando el cupón es inactivo o vencido', async () => {
    await window.cuponesCheckout.aplicarCupon('INACTIVO');
    assert.equal(mockStorage['dunes_coupon_v1'], undefined);

    await window.cuponesCheckout.aplicarCupon('VENCIDO');
    assert.equal(mockStorage['dunes_coupon_v1'], undefined);
});

test('CuponesStorage - Manejo seguro de JSON corrupto en localStorage', async () => {
    mockStorage['dunes_coupon_v1'] = '{ json corrupto invalid }';

    const res = await window.cuponesCheckout.restaurarCuponPersistido();
    assert.equal(res, null);
    assert.equal(mockStorage['dunes_coupon_v1'], undefined);
});

test('CuponesStorage - Tolerancia cuando localStorage está bloqueado o lanza excepción', async () => {
    globalThis.localStorage.getItem = () => { throw new Error('SecurityError: LocalStorage blocked'); };
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

    // No debe lanzar excepción ni romper el checkout
    const res = await window.cuponesCheckout.aplicarCupon('TIODUNES');
    assert.equal(res.valido, true);
    assert.equal(res.descuento, 10);
});
