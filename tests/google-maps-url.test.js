/**
 * Dunes Parfums - Tests unitarios para la URL Universal del Botón Google Maps
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const EXPECTED_URL = 'https://www.google.com/maps/search/?api=1&query=-6.4626252,-76.4491609';
const OLD_SHORT_LINK_PATTERN = 'maps.app.goo.gl';

test('GoogleMapsURL - Ningún archivo HTML contiene enlaces cortos maps.app.goo.gl', () => {
    const rootDir = path.resolve(__dirname, '..');
    const htmlFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.html'));

    assert.ok(htmlFiles.length > 0, 'Deben existir archivos HTML en el proyecto');

    htmlFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        assert.strictEqual(
            content.includes(OLD_SHORT_LINK_PATTERN),
            false,
            `El archivo ${file} aún contiene el enlace corto incompatible: ${OLD_SHORT_LINK_PATTERN}`
        );
    });
});

test('GoogleMapsURL - Todos los enlaces de ubicación a Google Maps usan la URL universal con target y rel', () => {
    const rootDir = path.resolve(__dirname, '..');
    const htmlFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.html'));

    let linkCount = 0;

    htmlFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Regex para capturar etiquetas <a> que apunten a google maps o contengan "ubicación" / "Google Maps"
        const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
        let match;

        while ((match = anchorRegex.exec(content)) !== null) {
            const fullTag = match[0];
            const href = match[1];

            if (href.includes('google.com/maps') || href.includes('maps.app.goo.gl')) {
                // Si es un enlace a Google Maps (excluyendo iframe src)
                linkCount++;
                assert.strictEqual(
                    href,
                    EXPECTED_URL,
                    `El archivo ${file} debe usar la URL universal exacta: ${EXPECTED_URL}`
                );
                assert.ok(
                    fullTag.includes('target="_blank"') || fullTag.includes("target='_blank'"),
                    `El enlace en ${file} debe incluir target="_blank"`
                );
                assert.ok(
                    fullTag.includes('rel="noopener noreferrer"') || fullTag.includes("rel='noopener noreferrer'"),
                    `El enlace en ${file} debe incluir rel="noopener noreferrer"`
                );
            }
        }
    });

    assert.strictEqual(linkCount, 6, 'Se deben haber verificado exactamente los 6 enlaces de ubicación a Google Maps del catálogo');
});
