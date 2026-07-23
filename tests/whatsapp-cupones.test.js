/**
 * Dunes Parfums - Tests unitarios para el generador de mensajes de WhatsApp (js/whatsapp.js - FASE C7)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;
eval(fs.readFileSync('js/whatsapp.js', 'utf8'));

const mockProductos = [
    {
        id: 'p1',
        nombre: 'Khamrah Clásico',
        tamanoMl: '100 ml',
        presentacion: 'Sellado / 100 ml',
        precio: 160,
        cantidad: 1,
        subtotal: 160
    }
];

test('WhatsApp - Mensaje SIN cupón aplicado (Limpio sin campos de cupón)', () => {
    const pedido = {
        productos: mockProductos,
        subtotalBruto: 160,
        subtotalProductos: 160,
        costoEntrega: 0,
        totalFinal: 160,
        cuponAplicado: null,
        descuento: 0,
        datosEntrega: {
            tipoEntrega: 'delivery-local',
            nombre: 'Juan Pérez',
            celular: '987654321',
            zona: 'cacatachi',
            nombreZona: 'Cacatachi',
            direccion: 'Jr. Lima 123'
        }
    };

    const msg = window.whatsappConfig.generarMensajeWhatsApp(pedido);

    assert.equal(msg.includes('Subtotal de productos: S/160.00'), true);
    assert.equal(msg.includes('Costo de entrega: GRATIS'), true);
    assert.equal(msg.includes('*TOTAL DEL PEDIDO: S/160.00*'), true);
    assert.equal(msg.includes('Cupón aplicado'), false);
    assert.equal(msg.includes('Descuento:'), false);
    assert.equal(msg.includes('NaN'), false);
    assert.equal(msg.includes('undefined'), false);
});

test('WhatsApp - Mensaje CON cupón fijo TIODUNES (-S/10.00)', () => {
    const pedido = {
        productos: mockProductos,
        subtotalBruto: 160,
        subtotalProductos: 160,
        costoEntrega: 0,
        descuento: 10,
        subtotalNeto: 150,
        totalFinal: 150,
        cuponAplicado: {
            codigo: 'TIODUNES',
            tipo: 'monto_fijo',
            valor: 10
        },
        datosEntrega: {
            tipoEntrega: 'delivery-local',
            nombre: 'Juan Pérez',
            celular: '987654321',
            zona: 'cacatachi',
            nombreZona: 'Cacatachi',
            direccion: 'Jr. Lima 123'
        }
    };

    const msg = window.whatsappConfig.generarMensajeWhatsApp(pedido);

    assert.equal(msg.includes('Subtotal de productos: S/160.00'), true);
    assert.equal(msg.includes('Cupón aplicado: TIODUNES'), true);
    assert.equal(msg.includes('Descuento: -S/10.00'), true);
    assert.equal(msg.includes('Subtotal con descuento: S/150.00'), true);
    assert.equal(msg.includes('Costo de entrega: GRATIS'), true);
    assert.equal(msg.includes('*TOTAL DEL PEDIDO: S/150.00*'), true);
});

test('WhatsApp - Mensaje CON cupón porcentual DUNES10 (5% en S/155.00)', () => {
    const productos = [
        { id: 'p1', nombre: 'Khamrah', tamanoMl: '100 ml', precio: 155, cantidad: 1 }
    ];

    const pedido = {
        productos,
        subtotalBruto: 155,
        subtotalProductos: 155,
        costoEntrega: 0,
        descuento: 7.75,
        subtotalNeto: 147.25,
        totalFinal: 147.25,
        cuponAplicado: {
            codigo: 'DUNES10',
            tipo: 'porcentaje',
            valor: 5
        },
        datosEntrega: {
            tipoEntrega: 'delivery-local',
            nombre: 'Juan Pérez',
            celular: '987654321',
            zona: 'tarapoto',
            nombreZona: 'Tarapoto',
            direccion: 'Jr. San Martín 456'
        }
    };

    const msg = window.whatsappConfig.generarMensajeWhatsApp(pedido);

    assert.equal(msg.includes('Subtotal de productos: S/155.00'), true);
    assert.equal(msg.includes('Cupón aplicado: DUNES10'), true);
    assert.equal(msg.includes('Descuento: -S/7.75'), true);
    assert.equal(msg.includes('Subtotal con descuento: S/147.25'), true);
    assert.equal(msg.includes('*TOTAL DEL PEDIDO: S/147.25*'), true);
});

test('WhatsApp - Modalidades de entrega (Agencia y Recojo local)', () => {
    const pAgencia = {
        productos: mockProductos,
        subtotalBruto: 160,
        costoEntrega: 4,
        totalFinal: 164,
        datosEntrega: { tipoEntrega: 'agencia' }
    };
    const msgAgencia = window.whatsappConfig.generarMensajeWhatsApp(pAgencia);
    assert.equal(msgAgencia.includes('Tipo de entrega: Envío por agencia'), true);
    assert.equal(msgAgencia.includes('Embalaje y llevada: S/4.00'), true);
    assert.equal(msgAgencia.includes('*TOTAL DEL PEDIDO: S/164.00*'), true);

    const pRecojo = {
        productos: mockProductos,
        subtotalBruto: 160,
        costoEntrega: 0,
        totalFinal: 160,
        datosEntrega: { tipoEntrega: 'recojo-local', nombre: 'Carlos', celular: '912345678' }
    };
    const msgRecojo = window.whatsappConfig.generarMensajeWhatsApp(pRecojo);
    assert.equal(msgRecojo.includes('Tipo de entrega: Recojo en local'), true);
    assert.equal(msgRecojo.includes('Costo de entrega: GRATIS'), true);
    assert.equal(msgRecojo.includes('*TOTAL DEL PEDIDO: S/160.00*'), true);
});

test('WhatsApp - Enlace oficial y teléfono 51986510573', () => {
    assert.equal(window.whatsappConfig.phone, '51986510573');
    const enlace = window.whatsappConfig.obtenerEnlaceWhatsApp('Hola');
    assert.equal(enlace.startsWith('https://wa.me/51986510573?text=Hola'), true);
});
