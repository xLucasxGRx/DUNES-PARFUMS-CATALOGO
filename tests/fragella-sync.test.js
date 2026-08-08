/**
 * Dunes Parfums - Tests unitarios para la Infraestructura de Fragella API (FASE PERFIL OLFATIVO - ETAPA 1)
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('FragellaInfra - 1. data/perfumes-olfativos.json existe e inicia vacio {}', () => {
    assert.ok(fs.existsSync('data/perfumes-olfativos.json'), 'data/perfumes-olfativos.json debe existir');
    const content = fs.readFileSync('data/perfumes-olfativos.json', 'utf8').trim();
    assert.equal(content, '{}', 'Debe iniciar exactamente como {}');
});

test('FragellaInfra - 2. .gitignore protege variables de entorno .env', () => {
    assert.ok(fs.existsSync('.gitignore'), '.gitignore debe existir');
    const content = fs.readFileSync('.gitignore', 'utf8');
    assert.ok(content.includes('.env'), 'Debe incluir .env');
    assert.ok(content.includes('.env.local'), 'Debe incluir .env.local');
});

test('FragellaInfra - 3. .github/workflows/sincronizar-fragella.yml existe y usa exclusivamente workflow_dispatch', () => {
    const workflowPath = '.github/workflows/sincronizar-fragella.yml';
    assert.ok(fs.existsSync(workflowPath), 'El workflow YAML debe existir');
    const content = fs.readFileSync(workflowPath, 'utf8');

    assert.ok(content.includes('workflow_dispatch:'), 'Debe usar workflow_dispatch');
    assert.ok(!content.includes('push:'), 'NO debe usar disparador push');
    assert.ok(!content.includes('pull_request:'), 'NO debe usar disparador pull_request');
    assert.ok(!content.includes('schedule:'), 'NO debe usar disparador schedule');
    assert.ok(content.includes('secrets.FRAGELLA_API_KEY'), 'Debe usar secret FRAGELLA_API_KEY');
});

test('FragellaInfra - 4. Evaluar coincidencia detecta marcas y variantes ambiguas (Hawas Ice, Qahwa, Elixir, Bourbon)', async () => {
    const { evaluarCoincidencia, normalizarCadena } = await import('../scripts/sincronizar-fragella.mjs');

    assert.equal(normalizarCadena('  Lattafa  '), 'lattafa');
    assert.equal(normalizarCadena('Khamrah Qahwa!'), 'khamrah qahwa');

    const dunesProd = { id: 'p1', nombre: 'Khamrah Clasico', marca: 'Lattafa' };

    // Coincidencia valida
    const fragellaExacto = { id: 'f1', name: 'Khamrah', brand: 'Lattafa' };
    const resExacto = evaluarCoincidencia(dunesProd, fragellaExacto);
    assert.equal(resExacto.estado, 'ENCONTRADO');

    // Variante ambigua (Qahwa vs Clasico)
    const fragellaQahwa = { id: 'f2', name: 'Khamrah Qahwa', brand: 'Lattafa' };
    const resQahwa = evaluarCoincidencia(dunesProd, fragellaQahwa);
    assert.equal(resQahwa.estado, 'AMBIGUO');

    // Hawas vs Hawas Ice
    const dunesHawas = { id: 'p2', nombre: 'Hawas', marca: 'Rasasi' };
    const fragellaIce = { id: 'f3', name: 'Hawas Ice', brand: 'Rasasi' };
    const resIce = evaluarCoincidencia(dunesHawas, fragellaIce);
    assert.equal(resIce.estado, 'AMBIGUO');

    // Marca no coincide
    const fragellaMarcaIncorrecta = { id: 'f4', name: 'Khamrah', brand: 'Afnan' };
    const resMarca = evaluarCoincidencia(dunesProd, fragellaMarcaIncorrecta);
    assert.equal(resMarca.estado, 'NO_ENCONTRADO');
});

test('FragellaInfra - 5. Deteccion de productos cacheados e ignorado seguro en String vs Number ID', async () => {
    const { obtenerProductosPendientes } = await import('../scripts/sincronizar-fragella.mjs');

    const productosDunes = [
        { id: 10, nombre: 'Khamrah', marca: 'Lattafa', visible: true },
        { id: '11', nombre: 'Asad', marca: 'Lattafa', visible: true },
        { id: '12', nombre: '9PM', marca: 'Afnan', visible: true }
    ];

    const cacheLocal = {
        '10': { dunesId: '10', estado: 'ENCONTRADO' }
    };

    const pendientes = obtenerProductosPendientes(productosDunes, cacheLocal);
    assert.equal(pendientes.length, 2);
    assert.equal(pendientes[0].id, '11');
    assert.equal(pendientes[1].id, '12');
});

test('FragellaInfra - 6. Ejecución en modo --dry-run realiza 0 solicitudes reales HTTP a la API y no altera el JSON', async () => {
    const { ejecutarSincronizacionFragella } = await import('../scripts/sincronizar-fragella.mjs');

    const res = await ejecutarSincronizacionFragella({ dryRun: true, limit: 1 });
    assert.equal(res.success, true);
    assert.equal(res.dryRun, true);

    const jsonContent = fs.readFileSync('data/perfumes-olfativos.json', 'utf8').trim();
    assert.equal(jsonContent, '{}', 'El JSON local no debe sufrir modificaciones durante dry-run');
});

test('FragellaInfra - 7. No existen API keys en código duro en el proyecto', () => {
    const scriptCode = fs.readFileSync('scripts/sincronizar-fragella.mjs', 'utf8');

    assert.ok(!scriptCode.includes('const apiKey = "http'), 'No debe hardcodear URLs con claves');
    assert.ok(!scriptCode.includes('const apiKey = "frag'), 'No debe hardcodear claves privadas');
    assert.ok(scriptCode.includes('process.env.FRAGELLA_API_KEY'), 'Debe utilizar process.env.FRAGELLA_API_KEY');
});
