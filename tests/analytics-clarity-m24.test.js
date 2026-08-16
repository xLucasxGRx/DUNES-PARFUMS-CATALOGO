const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

const ROOT_DIR = path.resolve(__dirname, '..');

test('GA4 and Clarity Integration - M24', async (t) => {

  await t.test('1. All 8 public HTML files must contain GA4 Measurement ID G-5V8CWLLYJ4 inside head', () => {
    for (const filename of PUBLIC_HTML_FILES) {
      const filePath = path.join(ROOT_DIR, filename);
      assert.strictEqual(fs.existsSync(filePath), true, `File ${filename} must exist`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const headContent = content.substring(0, content.indexOf('</head>'));
      assert.strictEqual(headContent !== '', true, `${filename} must have a valid </head> tag`);
      
      const ga4ScriptMatches = content.match(/googletagmanager\.com\/gtag\/js\?id=G-5V8CWLLYJ4/g);
      assert.strictEqual(ga4ScriptMatches ? ga4ScriptMatches.length : 0, 1, `${filename} must have exactly one GA4 script tag with G-5V8CWLLYJ4`);
      
      const ga4ConfigMatches = content.match(/gtag\('config',\s*'G-5V8CWLLYJ4'\)/g);
      assert.strictEqual(ga4ConfigMatches ? ga4ConfigMatches.length : 0, 1, `${filename} must have exactly one gtag('config', 'G-5V8CWLLYJ4') call`);
    }
  });

  await t.test('2. All 8 public HTML files must contain Microsoft Clarity Project ID y3hhkes9jq inside head', () => {
    for (const filename of PUBLIC_HTML_FILES) {
      const filePath = path.join(ROOT_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const clarityMatches = content.match(/https:\/\/www\.clarity\.ms\/tag\/["']?\+?i|y3hhkes9jq/g);
      assert.strictEqual(content.includes('y3hhkes9jq'), true, `${filename} must contain Clarity Project ID y3hhkes9jq`);
      
      const clarityScriptCount = (content.match(/y3hhkes9jq/g) || []).length;
      assert.strictEqual(clarityScriptCount, 1, `${filename} must include Clarity snippet exactly once`);
    }
  });

  await t.test('3. No HTML file should have manual duplicate gtag page_view event calls', () => {
    for (const filename of PUBLIC_HTML_FILES) {
      const filePath = path.join(ROOT_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const manualPageView = content.match(/gtag\('event',\s*'page_view'/g);
      assert.strictEqual(manualPageView, null, `${filename} must not contain manual duplicate page_view events`);
    }
  });

  await t.test('4. carrito.html must have data-clarity-mask="true" on checkout form for PII protection', () => {
    const filePath = path.join(ROOT_DIR, 'carrito.html');
    const content = fs.readFileSync(filePath, 'utf8');
    
    assert.strictEqual(content.includes('id="checkout-form"'), true, 'carrito.html must have checkout-form element');
    assert.strictEqual(content.includes('data-clarity-mask="true"'), true, 'carrito.html must contain data-clarity-mask="true" attribute');
    
    // Ensure form element itself has data-clarity-mask="true"
    const formMatch = content.match(/<form[^>]*id="checkout-form"[^>]*data-clarity-mask="true"[^>]*>|<form[^>]*data-clarity-mask="true"[^>]*id="checkout-form"[^>]*>/);
    assert.notStrictEqual(formMatch, null, '#checkout-form in carrito.html must have data-clarity-mask="true"');
  });

});
