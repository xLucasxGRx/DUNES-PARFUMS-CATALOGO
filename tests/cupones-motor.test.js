/**
 * Dunes Parfums - Tests unitarios para el motor de validación y cálculo (js/cupones.js)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { FIXTURE_CUPONES } = require('./fixtures/cupones-fixtures.js');

globalThis.window = globalThis;
eval(fs.readFileSync('js/cupones.js', 'utf8'));

test('CuponesMotor - TIODUNES (Monto fijo S/10 en compra S/160)', () => {
    const tiodunes = FIXTURE_CUPONES.find(c => c.codigo === 'TIODUNES');
    const items = [
        { id: 'p1', precioUnitario: 160, cantidad: 1, categoria: 'arabe' }
    ];

    const res = window.cuponesModulo.validarCupon(tiodunes, {
        items,
        subtotalBruto: 160,
        fechaSimulada: '2026-07-20'
    });

    assert.equal(res.valido, true);
    assert.equal(res.estado, 'cupon_valido');
    assert.equal(res.subtotalBruto, 160);
    assert.equal(res.subtotalElegible, 160);
    assert.equal(res.descuento, 10);
    assert.equal(res.subtotalNeto, 150);
    assert.equal(res.montoFaltante, 0);
});

test('CuponesMotor - DUNES10 (Porcentaje 5% en compra S/155.00 con precisión flotante)', () => {
    const dunes10 = FIXTURE_CUPONES.find(c => c.codigo === 'DUNES10');
    const items = [
        { id: 'p1', precioUnitario: 155, cantidad: 1, categoria: 'arabe' }
    ];

    const res = window.cuponesModulo.validarCupon(dunes10, {
        items,
        subtotalBruto: 155,
        fechaSimulada: '2026-07-20'
    });

    assert.equal(res.valido, true);
    assert.equal(res.estado, 'cupon_valido');
    assert.equal(res.subtotalBruto, 155);
    assert.equal(res.descuento, 7.75); // 5% de 155 = 7.75
    assert.equal(res.subtotalNeto, 147.25);
});

test('CuponesMotor - DESCUENTOMAX (Porcentaje 50% tope S/20 en compra S/100)', () => {
    const cupon = FIXTURE_CUPONES.find(c => c.codigo === 'DESCUENTOMAX');
    const items = [{ id: 'p1', precioUnitario: 100, cantidad: 1 }];

    const res = window.cuponesModulo.validarCupon(cupon, {
        items,
        subtotalBruto: 100,
        fechaSimulada: '2026-07-20'
    });

    assert.equal(res.valido, true);
    assert.equal(res.descuento, 20); // 50% de 100 es 50, pero tope es 20
    assert.equal(res.subtotalNeto, 80);
});

test('CuponesMotor - SOLOARABE (Alcance por categoría en carrito mixto)', () => {
    const cupon = FIXTURE_CUPONES.find(c => c.codigo === 'SOLOARABE');
    // Carrito mixto: S/80 en producto 'arabe' + S/60 en producto 'comercial' = S/140 bruto
    const items = [
        { id: 'p1', precioUnitario: 80, cantidad: 1, categoria: 'arabe' },
        { id: 'p2', precioUnitario: 60, cantidad: 1, categoria: 'comercial' }
    ];

    const res = window.cuponesModulo.validarCupon(cupon, {
        items,
        subtotalBruto: 140,
        fechaSimulada: '2026-07-20'
    });

    // Mínimo de SOLOARABE es S/100 en productos elegibles, pero solo hay S/80 de 'arabe'
    assert.equal(res.valido, false);
    assert.equal(res.estado, 'monto_minimo_no_alcanzado');
    assert.equal(res.subtotalElegible, 80);
    assert.equal(res.montoFaltante, 20);
});

test('CuponesMotor - SOLOARABE (Valido cuando subtotal elegible alcanza compra mínima)', () => {
    const cupon = FIXTURE_CUPONES.find(c => c.codigo === 'SOLOARABE');
    const items = [
        { id: 'p1', precioUnitario: 120, cantidad: 1, categoria: 'Árabe' },
        { id: 'p2', precioUnitario: 60, cantidad: 1, categoria: 'comercial' }
    ];

    const res = window.cuponesModulo.validarCupon(cupon, {
        items,
        subtotalBruto: 180,
        fechaSimulada: '2026-07-20'
    });

    assert.equal(res.valido, true);
    assert.equal(res.subtotalElegible, 120);
    assert.equal(res.descuento, 15);
    assert.equal(res.subtotalNeto, 165); // 180 - 15 = 165
});

test('CuponesMotor - SOLOESPECIAL (Alcance por productos permitidos)', () => {
    const cupon = FIXTURE_CUPONES.find(c => c.codigo === 'SOLOESPECIAL');
    const items = [
        { id: 'p12', idProducto: '12', precioUnitario: 90, cantidad: 1 }
    ];

    const res = window.cuponesModulo.validarCupon(cupon, {
        items,
        subtotalBruto: 90,
        fechaSimulada: '2026-07-20'
    });

    assert.equal(res.valido, true);
    assert.equal(res.subtotalElegible, 90);
    assert.equal(res.descuento, 20);
    assert.equal(res.subtotalNeto, 70);
});

test('CuponesMotor - INACTIVO, VENCIDO y FUTURO', () => {
    const inactivo = FIXTURE_CUPONES.find(c => c.codigo === 'INACTIVO');
    const vencido = FIXTURE_CUPONES.find(c => c.codigo === 'VENCIDO');
    const futuro = FIXTURE_CUPONES.find(c => c.codigo === 'FUTURO');

    const items = [{ id: 'p1', precioUnitario: 200, cantidad: 1 }];

    const r1 = window.cuponesModulo.validarCupon(inactivo, { items, subtotalBruto: 200, fechaSimulada: '2026-07-20' });
    assert.equal(r1.valido, false);
    assert.equal(r1.estado, 'cupon_inactivo');

    const r2 = window.cuponesModulo.validarCupon(vencido, { items, subtotalBruto: 200, fechaSimulada: '2026-07-20' });
    assert.equal(r2.valido, false);
    assert.equal(r2.estado, 'cupon_vencido');

    const r3 = window.cuponesModulo.validarCupon(futuro, { items, subtotalBruto: 200, fechaSimulada: '2026-07-20' });
    assert.equal(r3.valido, false);
    assert.equal(r3.estado, 'cupon_no_iniciado');
});

test('CuponesMotor - Carrito Vacío o Nulo', () => {
    const cupon = FIXTURE_CUPONES.find(c => c.codigo === 'TIODUNES');
    const res = window.cuponesModulo.validarCupon(cupon, { items: [], subtotalBruto: 0 });
    assert.equal(res.valido, false);
    assert.equal(res.estado, 'carrito_vacio');
});

test('CuponesMotor - Subtotal Neto NUNCA negativo', () => {
    const cuponSuper = {
        codigo: "SUPER50",
        tipo: "monto_fijo",
        valor: 50,
        montoMinimo: 0,
        activo: true,
        alcance: "todos"
    };

    const items = [{ id: 'p1', precioUnitario: 30, cantidad: 1 }];
    const res = window.cuponesModulo.validarCupon(cuponSuper, { items, subtotalBruto: 30 });

    assert.equal(res.valido, true);
    assert.equal(res.descuento, 30); // Tope al subtotal elegible
    assert.equal(res.subtotalNeto, 0);
});
