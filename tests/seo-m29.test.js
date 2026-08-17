/**
 * Test Suite — FASE M29: SEO Local, Indexación, Datos Estructurados y Autoridad
 * (tests/seo-m29.test.js)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

test('1. index.html - Canonical, Open Graph y LocalBusiness JSON-LD usan el dominio oficial https://dunesparfums.com/', () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');

    assert.match(content, /<link rel="canonical" href="https:\/\/dunesparfums\.com\/">/);
    assert.match(content, /<meta property="og:url" content="https:\/\/dunesparfums\.com\/">/);
    assert.match(content, /"url": "https:\/\/dunesparfums\.com\/"/);
    assert.match(content, /"streetAddress": "Jr\. Independencia 434"/);
    assert.match(content, /"addressLocality": "Cacatachi"/);
    assert.match(content, /"addressRegion": "San Martín"/);
    assert.match(content, /"addressCountry": "PE"/);
    assert.match(content, /"latitude": -6\.4626252/);
    assert.match(content, /"longitude": -76\.4491609/);

    // Verificar que no existan datos inventados prohibidos
    assert.doesNotMatch(content, /"priceRange"/);
    assert.doesNotMatch(content, /"postalCode"/);
    assert.doesNotMatch(content, /"openingHours"/);
});

test('2. catalogo.html y ayuda.html - Canonical y Open Graph usan el dominio oficial', () => {
    const catalogoHtml = fs.readFileSync(path.join(ROOT_DIR, 'catalogo.html'), 'utf-8');
    assert.match(catalogoHtml, /<link rel="canonical" href="https:\/\/dunesparfums\.com\/catalogo\.html">/);
    assert.match(catalogoHtml, /<meta property="og:url" content="https:\/\/dunesparfums\.com\/catalogo\.html">/);

    const ayudaHtml = fs.readFileSync(path.join(ROOT_DIR, 'ayuda.html'), 'utf-8');
    assert.match(ayudaHtml, /<link rel="canonical" href="https:\/\/dunesparfums\.com\/ayuda\.html">/);
    assert.match(ayudaHtml, /<meta property="og:url" content="https:\/\/dunesparfums\.com\/ayuda\.html">/);
});

test('3. sitemap.xml y robots.txt - Utilizan el dominio oficial y excluyen noindex', () => {
    const sitemapContent = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf-8');
    assert.match(sitemapContent, /<loc>https:\/\/dunesparfums\.com\/<\/loc>/);
    assert.match(sitemapContent, /<loc>https:\/\/dunesparfums\.com\/catalogo\.html<\/loc>/);
    assert.match(sitemapContent, /<loc>https:\/\/dunesparfums\.com\/ayuda\.html<\/loc>/);
    assert.doesNotMatch(sitemapContent, /xlucasxgrx\.github\.io/);
    assert.doesNotMatch(sitemapContent, /404\.html/);
    assert.doesNotMatch(sitemapContent, /favoritos\.html/);
    assert.doesNotMatch(sitemapContent, /carrito\.html/);
    assert.doesNotMatch(sitemapContent, /comparador\.html/);

    const robotsContent = fs.readFileSync(path.join(ROOT_DIR, 'robots.txt'), 'utf-8');
    assert.match(robotsContent, /Sitemap: https:\/\/dunesparfums\.com\/sitemap\.xml/);
    assert.doesNotMatch(robotsContent, /xlucasxgrx\.github\.io/);
});

test('4. CNAME y Meta Robots - Preservación y noindex en utilidades', () => {
    const cnameContent = fs.readFileSync(path.join(ROOT_DIR, 'CNAME'), 'utf-8').trim();
    assert.strictEqual(cnameContent, 'dunesparfums.com');

    ['favoritos.html', 'carrito.html', 'comparador.html', '404.html'].forEach(file => {
        const html = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');
        assert.match(html, /<meta name="robots" content="noindex/);
    });
});

test('5. actualizarSeoProducto en JS - Genera canonical, Open Graph y Product JSON-LD con precio de oferta real', () => {
    const elements = new Map();
    const createdElements = [];

    const mockDocument = {
        title: '',
        addEventListener() {},
        removeEventListener() {},
        head: {
            appendChild(child) {
                createdElements.push(child);
                if (child.id) elements.set(child.id, child);
            }
        },
        getElementById(id) {
            return elements.get(id) || null;
        },
        querySelector(selector) {
            for (const el of createdElements) {
                if (selector.includes('canonical') && el.rel === 'canonical') return el;
                if (selector.includes('meta[')) {
                    if (selector.includes('property="') && el._property === selector.match(/property="([^"]+)"/)?.[1]) return el;
                    if (selector.includes('name="') && el._name === selector.match(/name="([^"]+)"/)?.[1]) return el;
                }
            }
            return null;
        },
        createElement(tagName) {
            const el = {
                tagName,
                attributes: {},
                setAttribute(k, v) {
                    this.attributes[k] = v;
                    if (k === 'property') this._property = v;
                    if (k === 'name') this._name = v;
                },
                textContent: ''
            };
            return el;
        }
    };

    global.window = { document: mockDocument, addEventListener() {}, removeEventListener() {} };
    global.document = mockDocument;

    const interfazJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'interfaz.js'), 'utf-8');
    eval(interfazJs);

    const productoPrueba = {
        id: 'p1',
        nombre: 'Khamrah',
        marca: 'Lattafa',
        precio: 180,
        oferta: true,
        precio_oferta: 155,
        disponible: true,
        stock: 5,
        imagen: 'img/productos/khamrah.jpg'
    };

    actualizarSeoProducto(productoPrueba);

    assert.strictEqual(mockDocument.title, 'Khamrah | Dunes Parfums');

    const jsonLdScript = mockDocument.getElementById('schema-product-jsonld');
    assert.ok(jsonLdScript);

    const schemaData = JSON.parse(jsonLdScript.textContent);
    assert.strictEqual(schemaData["@type"], "Product");
    assert.strictEqual(schemaData.name, "Khamrah");
    assert.strictEqual(schemaData.brand.name, "Lattafa");
    assert.strictEqual(schemaData.offers.price, 155); // Precio de oferta real
    assert.strictEqual(schemaData.offers.priceCurrency, "PEN");
    assert.strictEqual(schemaData.offers.availability, "https://schema.org/InStock");
    assert.strictEqual(schemaData.offers.url, "https://dunesparfums.com/producto.html?id=p1");
});
