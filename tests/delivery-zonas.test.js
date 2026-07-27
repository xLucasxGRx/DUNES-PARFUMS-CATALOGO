/**
 * Dunes Parfums - Tests unitarios para Zonas y Tarifas de Delivery Local
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

globalThis.window = globalThis;
globalThis.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
};
globalThis.document = {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    addEventListener() {}
};

eval(fs.readFileSync('js/interfaz.js', 'utf8'));
eval(fs.readFileSync('js/whatsapp.js', 'utf8'));

beforeEach(() => {
    localStorage.clear();
    window.seleccionarTipoEntrega('delivery-local');
    window.seleccionarZonaEntrega(null);
});

test('Delivery Zonas - Configuración centralizada de 6 zonas', () => {
    const zonas = window.ZONAS_DELIVERY_LOCAL;
    assert.ok(zonas.cacatachi, 'Cacatachi existe');
    assert.ok(zonas.morales, 'Morales existe');
    assert.ok(zonas.tarapoto_central, 'Tarapoto Central existe');
    assert.ok(zonas.tarapoto_aeropuerto, 'Tarapoto Aeropuerto existe');
    assert.ok(zonas.banda_entrada, 'La Banda Entrada existe');
    assert.ok(zonas.banda_alta, 'La Banda Alta existe');

    assert.equal(zonas.cacatachi.costo, 0);
    assert.equal(zonas.morales.costo, 3);
    assert.equal(zonas.tarapoto_central.costo, 4);
    assert.equal(zonas.tarapoto_aeropuerto.costo, 4.5);
    assert.equal(zonas.banda_entrada.costo, 5);
    assert.equal(zonas.banda_alta.costo, 6);
});

test('Delivery Zonas - Tarifas con subtotal menor a S/30', () => {
    const subtotal = 25;
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'cacatachi'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'morales'), 3);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'tarapoto_central'), 4);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'tarapoto_aeropuerto'), 4.5);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'banda_entrada'), 5);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'banda_alta'), 6);
});

test('Delivery Zonas - Gratuidad para subtotal >= S/30 en todas las zonas', () => {
    const subtotal = 30;
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'cacatachi'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'morales'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'tarapoto_central'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'tarapoto_aeropuerto'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'banda_entrada'), 0);
    assert.equal(window.calcularCostoDeliveryLocal(subtotal, 'banda_alta'), 0);
});

test('Delivery Zonas - Limpieza automática de claves obsoletas en localStorage', () => {
    localStorage.setItem('dunes_delivery_pref', JSON.stringify({
        tipoEntrega: 'delivery-local',
        zona: 'tarapoto' // Clave antigua obsoleta
    }));

    window.cargarPreferenciaEntrega();
    assert.equal(window.obtenerZonaSeleccionada(), null, 'La zona antigua fue descartada y reseteada a null');
});

test('Delivery Zonas - Formato de mensaje de WhatsApp con zona y referencia del sector', () => {
    const pedido = {
        productos: [{ nombre: 'Khamrah', cantidad: 1, precio: 25 }],
        subtotalBruto: 25,
        subtotalProductos: 25,
        costoEntrega: 4.5,
        totalFinal: 29.5,
        datosEntrega: {
            tipoEntrega: 'delivery-local',
            nombre: 'Lucas',
            zona: 'tarapoto_aeropuerto',
            direccion: 'Av. Cáceres 123'
        }
    };

    const msg = window.whatsappConfig.generarMensajeWhatsApp(pedido);
    assert.ok(msg.includes('Tipo de entrega: Delivery local'));
    assert.ok(msg.includes('Zona: Tarapoto – Sector Aeropuerto'));
    assert.ok(msg.includes('Referencia del sector: Barrio Huayco, Av. Cáceres y zona del Aeropuerto'));
    assert.ok(msg.includes('Costo de delivery: S/4.50'));
    assert.equal(msg.includes('Celular:'), false);
});
