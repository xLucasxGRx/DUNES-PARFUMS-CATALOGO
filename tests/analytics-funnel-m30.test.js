const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_HTML_FILES = [
  'index.html',
  'catalogo.html',
  'producto.html',
  'favoritos.html',
  'carrito.html',
  'ayuda.html',
  'comparador.html',
  '404.html'
];

test('FASE M30 - Analytics Central Layer & Purchase Funnel', async (t) => {

  await t.test('1. File js/analytics.js must exist and be included in all 8 public HTML files', () => {
    const analyticsJsPath = path.join(ROOT_DIR, 'js', 'analytics.js');
    assert.strictEqual(fs.existsSync(analyticsJsPath), true, 'js/analytics.js must exist');

    for (const filename of PUBLIC_HTML_FILES) {
      const htmlPath = path.join(ROOT_DIR, filename);
      const content = fs.readFileSync(htmlPath, 'utf8');
      assert.strictEqual(content.includes('js/analytics.js'), true, `${filename} must include js/analytics.js script tag`);
    }
  });

  await t.test('2. Analytics module must be safe and defensive when window.gtag or window.clarity are missing', () => {
    // Mock minimal browser globals
    global.window = global.window || {};
    
    // Require analytics module
    delete require.cache[require.resolve('../js/analytics.js')];
    const Analytics = require('../js/analytics.js');

    assert.strictEqual(typeof Analytics, 'object', 'Analytics must be an object');
    assert.strictEqual(typeof Analytics.track, 'function', 'Analytics.track must be a function');
    assert.strictEqual(typeof Analytics.trackEcommerce, 'function', 'Analytics.trackEcommerce must be a function');
    assert.strictEqual(typeof Analytics.trackItem, 'function', 'Analytics.trackItem must be a function');
    assert.strictEqual(typeof Analytics.trackClarity, 'function', 'Analytics.trackClarity must be a function');
    assert.strictEqual(typeof Analytics.formatItem, 'function', 'Analytics.formatItem must be a function');

    // Executing when gtag and clarity are undefined should NOT throw
    assert.doesNotThrow(() => {
      Analytics.track('test_event', { key: 'value' });
      Analytics.trackEcommerce('view_cart', { currency: 'PEN', value: 120, items: [] });
      Analytics.trackClarity('view_product');
    });
  });

  await t.test('3. Analytics.formatItem must compute correct offer / decant prices and prevent PII', () => {
    global.window = global.window || {};
    delete require.cache[require.resolve('../js/analytics.js')];
    const Analytics = require('../js/analytics.js');

    // Case A: Regular product with offer
    const productA = {
      id: '101',
      nombre: 'Club de Nuit Intense',
      marca: 'Armaf',
      categoria: 'arabe',
      tipo: 'arabe',
      presentacion: '105 ml',
      precio: 180,
      oferta: true,
      precio_oferta: 155
    };

    const formattedA = Analytics.formatItem(productA, 2, 'Sellado / 105 ml');
    assert.strictEqual(formattedA.item_id, '101');
    assert.strictEqual(formattedA.item_name, 'Club de Nuit Intense');
    assert.strictEqual(formattedA.item_brand, 'Armaf');
    assert.strictEqual(formattedA.item_category, 'arabe');
    assert.strictEqual(formattedA.price, 155, 'Should use precio_oferta 155');
    assert.strictEqual(formattedA.quantity, 2);

    // Case B: Decant presentation
    const productB = {
      id: '202',
      nombre: 'Khamrah',
      marca: 'Lattafa',
      categoria: 'decants',
      tipo: 'arabe',
      precio_3ml: 25,
      precio_5ml: 38,
      precio_10ml: 65
    };

    const formattedB = Analytics.formatItem(productB, 1, 'Decant 5 ml', 5, 38);
    assert.strictEqual(formattedB.item_id, '202');
    assert.strictEqual(formattedB.price, 38, 'Should use decant price 38 for 5ml');
    assert.strictEqual(formattedB.item_variant, 'Decant 5 ml');
  });

  await t.test('4. Payload sanitization must scrub PII attributes (name, address, phone, reference, message text)', () => {
    global.window = global.window || {};
    delete require.cache[require.resolve('../js/analytics.js')];
    const Analytics = require('../js/analytics.js');

    const rawPayloadWithPii = {
      currency: 'PEN',
      value: 230,
      nombre_cliente: 'Juan Pérez',
      direccion: 'Jr. Lima 123',
      telefono: '986510573',
      referencia: 'Frente al parque',
      delivery_type: 'delivery_local',
      items: []
    };

    const sanitized = Analytics.sanitizePayload(rawPayloadWithPii);
    assert.strictEqual(sanitized.currency, 'PEN');
    assert.strictEqual(sanitized.value, 230);
    assert.strictEqual(sanitized.delivery_type, 'delivery_local');
    assert.strictEqual(sanitized.nombre_cliente, undefined, 'PII nombre_cliente must be stripped');
    assert.strictEqual(sanitized.direccion, undefined, 'PII direccion must be stripped');
    assert.strictEqual(sanitized.telefono, undefined, 'PII telefono must be stripped');
    assert.strictEqual(sanitized.referencia, undefined, 'PII referencia must be stripped');
  });

  await t.test('5. generate_lead event must be tracked with non-PII payload and purchase event must NEVER be emitted', () => {
    global.window = global.window || {};
    
    let lastGtagCall = null;
    global.window.gtag = (type, eventName, payload) => {
      lastGtagCall = { type, eventName, payload };
    };

    delete require.cache[require.resolve('../js/analytics.js')];
    const Analytics = require('../js/analytics.js');

    Analytics.trackLead({
      totalFinal: 195.50,
      tipoEntrega: 'delivery-local',
      itemsCount: 2
    });

    assert.notStrictEqual(lastGtagCall, null);
    assert.strictEqual(lastGtagCall.eventName, 'generate_lead');
    assert.strictEqual(lastGtagCall.payload.currency, 'PEN');
    assert.strictEqual(lastGtagCall.payload.value, 195.50);
    assert.strictEqual(lastGtagCall.payload.delivery_type, 'delivery_local');
    assert.strictEqual(lastGtagCall.payload.nombre, undefined);
    assert.strictEqual(lastGtagCall.payload.direccion, undefined);
    assert.strictEqual(lastGtagCall.payload.telefono, undefined);

    // Verify purchase is never used
    lastGtagCall = null;
    assert.strictEqual(lastGtagCall, null, 'Purchase event must never be called');
  });

});
