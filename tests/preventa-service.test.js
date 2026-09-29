/**
 * Dunes Parfums - Tests Unitarios para js/preventa-service.js (FASE P1)
 * Verifica estructura técnica base, parseo, normalización y filtrado de Preventa.
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { CSV_SAMPLE_PREVENTA, FIXTURE_PREVENTA_JSON } = require('./fixtures/preventa-fixtures.js');

const ROOT_DIR = path.join(__dirname, '..');
const originalFetch = globalThis.fetch;

// Simulación de entorno de navegador global
beforeEach(() => {
    globalThis.window = globalThis;
    delete globalThis.CONFIG_PREVENTA;
    eval(fs.readFileSync(path.join(ROOT_DIR, 'js', 'preventa-service.js'), 'utf8'));
    if (globalThis.PreventaService && typeof globalThis.PreventaService.limpiarCache === 'function') {
        globalThis.PreventaService.limpiarCache();
    }
});

test('1. PreventaService - Carga y parseo de CSV con las 12 columnas requeridas', async () => {
    globalThis.fetch = async (url) => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos();
    assert.equal(Array.isArray(productos), true);
    assert.equal(productos.length, 6);

    const khamrah = productos.find(p => p.nombre === 'Khamrah Qahwa');
    assert.notEqual(khamrah, undefined);
    assert.equal(khamrah.nombre, 'Khamrah Qahwa');
    assert.equal(khamrah.marca, 'Lattafa');
    assert.equal(khamrah.categoria, 'Árabe');
    assert.equal(khamrah.genero, 'Unisex');
    assert.equal(khamrah.formato_presentacion, '100 ml');
    assert.equal(khamrah.precio_regular, 230);
    assert.equal(khamrah.precio_preventa, 195);
    assert.equal(khamrah.stock, 8);
    assert.equal(khamrah.disponible, true);
    assert.equal(khamrah.visible, true);
    assert.equal(khamrah.imagen, 'https://dunesparfums.com/img/preventa/khamrah-qahwa.webp');
    assert.equal(khamrah.ocasion, 'Citas,Noche');
});

test('2. PreventaService - Normalización de booleanos (true, false, si, no, 1, 0)', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos();
    
    // Club de Nuit Iconic tiene disponible="si", visible="true"
    const cdni = productos.find(p => p.nombre === 'Club de Nuit Iconic');
    assert.equal(cdni.disponible, true);
    assert.equal(cdni.visible, true);

    // Yara Moi tiene disponible="false", visible="true", stock=0
    const yara = productos.find(p => p.nombre === 'Yara Moi');
    assert.equal(yara.disponible, false);
    assert.equal(yara.visible, true);

    // Sauvage Elixir tiene disponible="1", visible="false"
    const sauvage = productos.find(p => p.nombre.includes('Sauvage'));
    assert.equal(sauvage.disponible, true);
    assert.equal(sauvage.visible, false);

    // Producto Oculto tiene disponible="0", visible="0"
    const oculto = productos.find(p => p.nombre.includes('Oculto'));
    assert.equal(oculto.disponible, false);
    assert.equal(oculto.visible, false);
});

test('3. PreventaService - obtenerProductosVisibles() excluye productos con visible = false', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    await globalThis.PreventaService.cargarProductos();
    const visibles = globalThis.PreventaService.obtenerProductosVisibles();

    // De los 6 productos, 2 tienen visible=false o 0: Sauvage y Oculto
    assert.equal(visibles.length, 4);
    assert.equal(visibles.some(p => p.nombre.includes('Sauvage')), false);
    assert.equal(visibles.some(p => p.nombre.includes('Oculto')), false);
    assert.equal(visibles.every(p => p.visible === true), true);
});

test('4. PreventaService - obtenerProductosDisponibles() filtra visibles con disponible = true y stock > 0', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    await globalThis.PreventaService.cargarProductos();
    const disponibles = globalThis.PreventaService.obtenerProductosDisponibles();

    // Visibles: Khamrah (stock 8, disp true), CDNI (stock 5, disp true), Yara Moi (stock 0, disp false), Oud Maracujá (stock 2, disp true)
    // Disponibles para reserva: Khamrah, CDNI, Oud Maracujá (3)
    assert.equal(disponibles.length, 3);
    assert.equal(disponibles.some(p => p.nombre === 'Yara Moi'), false);
    assert.equal(disponibles.every(p => p.visible && p.disponible && p.stock > 0), true);
});

test('5. PreventaService - Fallback a data/preventa.json únicamente en modo pruebas unitarias si permitirFallback es true', async () => {
    globalThis.CONFIG_PREVENTA = {
        sheetsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=1833078058&single=true&output=csv',
        respaldoJsonUrl: 'data/preventa.json',
        permitirFallback: true,
        timeoutMs: 8000
    };
    globalThis.fetch = async (url) => {
        if (url.includes('docs.google.com')) {
            throw new Error('Network error Google Sheets unreachable');
        }
        if (url.includes('data/preventa.json')) {
            return {
                ok: true,
                json: async () => FIXTURE_PREVENTA_JSON
            };
        }
        return { ok: false, status: 404 };
    };

    const productos = await globalThis.PreventaService.cargarProductos(true);
    assert.equal(Array.isArray(productos), true);
    assert.equal(productos.length, 2);
    assert.equal(productos[0].nombre, 'Khamrah Qahwa');
    assert.equal(productos[1].nombre, 'Club de Nuit Iconic');
    assert.equal(globalThis.PreventaService.obtenerOrigen(), 'json-pruebas');
});

test('6. PreventaService - Resiliencia ante CSV con solo encabezados o datos vacíos', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => 'nombre,marca,categoria,genero,formato_presentacion,precio_regular,precio_preventa,stock,disponible,visible,imagen,ocasion\n',
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos();
    assert.equal(Array.isArray(productos), true);
    assert.equal(productos.length, 0);
    assert.equal(globalThis.PreventaService.obtenerProductosVisibles().length, 0);
    assert.equal(globalThis.PreventaService.obtenerProductosDisponibles().length, 0);
});

test('7. PreventaService - Aislamiento e independencia total respecto al catálogo principal', () => {
    assert.notEqual(globalThis.PreventaService, undefined);
    assert.equal(typeof globalThis.PreventaService.cargarProductos, 'function');
    assert.equal(typeof globalThis.PreventaService.obtenerProductos, 'function');
    assert.equal(typeof globalThis.PreventaService.obtenerProductosVisibles, 'function');
    assert.equal(typeof globalThis.PreventaService.obtenerProductosDisponibles, 'function');
    assert.equal(typeof globalThis.PreventaService.obtenerOrigen, 'function');
    assert.equal(typeof globalThis.PreventaService.limpiarCache, 'function');
});

test('8. preventa/index.html - Estructura HTML oficial: header, footer independiente, contenedor y estados base (FASE P4.8)', () => {
    const htmlPath = path.join(ROOT_DIR, 'preventa', 'index.html');
    assert.equal(fs.existsSync(htmlPath), true, 'preventa/index.html debe existir');

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Header y navegación oficial independiente
    assert.ok(html.includes('class="header-main"'), 'Debe incluir header-main');
    assert.ok(html.includes('class="logo-container"'), 'Debe incluir logo-container');
    assert.ok(html.includes('class="nav-menu"'), 'Debe incluir nav-menu');
    assert.ok(html.includes('class="mobile-drawer-header"'), 'Debe incluir mobile-drawer-header');
    assert.ok(html.includes('class="mobile-drawer-brand"'), 'Debe incluir mobile-drawer-brand');
    assert.ok(html.includes('class="mobile-drawer-close"'), 'Debe incluir mobile-drawer-close');
    assert.ok(html.includes('id="mobile-menu-toggle"'), 'Debe incluir botón hamburguesa');

    // Botón de reserva en header (FASE P4.8: Mi Reserva Preventa abre reserva/, no carrito)
    assert.ok(html.includes('class="reserva-header-btn"'), 'Debe incluir botón reserva-header-btn');
    assert.ok(html.includes('href="reserva/"'), 'El acceso de reserva debe apuntar a reserva/');
    assert.ok(!html.includes('href="../carrito.html"'), 'preventa/index.html NO debe enlazar a ../carrito.html');
    assert.ok(!html.includes('class="favorites-header-icon-btn"'), 'preventa/index.html NO debe incluir botón favoritos en header');

    // Footer independiente y compacto (FASE P4.8)
    assert.ok(html.includes('class="preventa-footer-independent"'), 'Debe incluir preventa-footer-independent');
    assert.ok(html.includes('Alta perfumería, lanzamientos exclusivos y reservas anticipadas.'), 'Debe incluir eslogan boutique');
    assert.ok(html.includes('Las reservas PREVENTA se confirman mediante WhatsApp.'), 'Debe incluir aviso obligatorio de WhatsApp');
    assert.ok(!html.includes('id="footer-menu-cat"'), 'Debe haber eliminado categorías del footer (footer-menu-cat)');
    assert.ok(!html.includes('id="footer-menu-nav"'), 'Debe haber eliminado menú repetido del footer (footer-menu-nav)');

    // Contenedor y estados base de preventa
    assert.ok(html.includes('id="preventa-container"'), 'Debe contener contenedor principal #preventa-container');
    assert.ok(html.includes('id="preventa-loading"'), 'Debe contener estado de carga #preventa-loading');
    assert.ok(html.includes('id="preventa-empty-state"'), 'Debe contener estado vacío #preventa-empty-state');
    assert.ok(html.includes('id="preventa-products-grid"'), 'Debe contener zona de productos #preventa-products-grid');

    // Inclusión de CSS y JS de preventa
    assert.ok(html.includes('css/preventa.css'), 'Debe incluir css/preventa.css');
    assert.ok(html.includes('js/preventa-service.js'), 'Debe incluir js/preventa-service.js');
});

test('9. preventa/index.html - Aislamiento estricto: cero dependencias acopladas del catálogo normal', () => {
    const htmlPath = path.join(ROOT_DIR, 'preventa', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // No debe cargar scripts acoplados del catálogo
    assert.ok(!html.includes('js/productos-service.js'), 'preventa/index.html NO debe cargar productos-service.js');
    assert.ok(!html.includes('js/catalogo.js'), 'preventa/index.html NO debe cargar catalogo.js');
    assert.ok(!html.includes('js/carrito.js'), 'preventa/index.html NO debe cargar carrito.js');
    assert.ok(!html.includes('js/cupones.js'), 'preventa/index.html NO debe cargar cupones.js');
    assert.ok(!html.includes('js/comparador.js'), 'preventa/index.html NO debe cargar comparador.js');

    // Verificar que los archivos del catálogo no cargan preventa
    const catalogoHtml = fs.readFileSync(path.join(ROOT_DIR, 'catalogo.html'), 'utf8');
    assert.ok(!catalogoHtml.includes('preventa-service.js'), 'catalogo.html NO debe cargar preventa-service.js');

    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    assert.ok(!indexHtml.includes('preventa-service.js'), 'index.html NO debe cargar preventa-service.js');
});

test('10. PreventaService - Manejo y preservación de múltiples valores de ocasión separados por coma ("Citas,Noche", "Versátil,Diario,Citas")', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos();
    const khamrah = productos.find(p => p.nombre === 'Khamrah Qahwa');
    const cdni = productos.find(p => p.nombre === 'Club de Nuit Iconic');

    // 1. Conservar valores múltiples sin transformarlos
    assert.equal(khamrah.ocasion, 'Citas,Noche');
    assert.equal(cdni.ocasion, 'Versátil,Diario,Citas');

    // 2. No reemplazar comas por guiones
    assert.equal(khamrah.ocasion.includes('-'), false, 'No debe reemplazar comas por guiones');
    assert.equal(cdni.ocasion.includes('-'), false, 'No debe reemplazar comas por guiones');

    // 3. No eliminar valores múltiples ni truncar a texto simple
    assert.deepEqual(khamrah.ocasion.split(','), ['Citas', 'Noche']);
    assert.deepEqual(cdni.ocasion.split(','), ['Versátil', 'Diario', 'Citas']);
});

test('11. PreventaService - Compatibilidad estricta con la lógica de filtros del catálogo (coincideOcasion)', async () => {
    globalThis.fetch = async () => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos();
    const khamrah = productos.find(p => p.nombre === 'Khamrah Qahwa');
    const cdni = productos.find(p => p.nombre === 'Club de Nuit Iconic');

    // Implementación exacta de coincideOcasion y normalizarTextoOcasion de js/catalogo.js
    function normalizarTextoOcasion(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function coincideOcasion(ocasionProducto, ocasionFiltro) {
        const filtroNorm = normalizarTextoOcasion(ocasionFiltro);
        if (!filtroNorm || filtroNorm === 'todas' || filtroNorm === 'todos') {
            return true;
        }
        if (!ocasionProducto || typeof ocasionProducto !== 'string') {
            return false;
        }
        const tagsProducto = ocasionProducto.split(',').map(tag => normalizarTextoOcasion(tag));
        return tagsProducto.includes(filtroNorm);
    }

    // Validación de coincidencia con Khamrah Qahwa ("Citas,Noche")
    assert.equal(coincideOcasion(khamrah.ocasion, 'citas'), true, 'Khamrah debe coincidir con citas');
    assert.equal(coincideOcasion(khamrah.ocasion, 'noche'), true, 'Khamrah debe coincidir con noche');
    assert.equal(coincideOcasion(khamrah.ocasion, 'diario'), false, 'Khamrah NO debe coincidir con diario');
    assert.equal(coincideOcasion(khamrah.ocasion, 'formal'), false, 'Khamrah NO debe coincidir con formal');
    assert.equal(coincideOcasion(khamrah.ocasion, 'todas'), true, 'Khamrah debe coincidir con todas');

    // Validación de coincidencia con Club de Nuit Iconic ("Versátil,Diario,Citas")
    assert.equal(coincideOcasion(cdni.ocasion, 'versatil'), true, 'CDNI debe coincidir con versatil');
    assert.equal(coincideOcasion(cdni.ocasion, 'diario'), true, 'CDNI debe coincidir con diario');
    assert.equal(coincideOcasion(cdni.ocasion, 'citas'), true, 'CDNI debe coincidir con citas');
    assert.equal(coincideOcasion(cdni.ocasion, 'noche'), false, 'CDNI NO debe coincidir con noche');
    assert.equal(coincideOcasion(cdni.ocasion, 'formal'), false, 'CDNI NO debe coincidir con formal');
    assert.equal(coincideOcasion(cdni.ocasion, 'todas'), true, 'CDNI debe coincidir con todas');
});

test('12. PreventaService - Carga exitosa desde Google Sheets CSV real (hoja PREVENTA, GID 1833078058)', async () => {
    // Restaurar fetch nativo de Node.js si estaba simulado
    globalThis.fetch = originalFetch;
    
    // Configuración real con GID 1833078058
    globalThis.CONFIG_PREVENTA = {
        sheetsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=1833078058&single=true&output=csv',
        respaldoJsonUrl: 'data/preventa.json',
        timeoutMs: 15000
    };

    const productos = await globalThis.PreventaService.cargarProductos(true);
    assert.equal(Array.isArray(productos), true);
    assert.equal(productos.length >= 1, true, 'Debe cargar al menos 1 producto real');

    const prod = productos[0];
    assert.equal(prod.nombre.toLowerCase().includes('khamrah'), true, 'El producto real debe ser Khamrah');
    assert.equal(typeof prod.precio_regular, 'number');
    assert.equal(typeof prod.precio_preventa, 'number');
    assert.equal(typeof prod.stock, 'number');
    assert.equal(typeof prod.disponible, 'boolean');
    assert.equal(typeof prod.visible, 'boolean');
    assert.equal(typeof prod.ocasion, 'string');
    assert.equal(prod.ocasion.includes(','), true, 'La ocasión debe contener valores múltiples separados por coma');

    const visibles = globalThis.PreventaService.obtenerProductosVisibles();
    assert.equal(visibles.length >= 1, true);
    assert.equal(visibles[0].nombre, prod.nombre);
    assert.equal(globalThis.PreventaService.obtenerOrigen(), 'google-sheets');
});

test('13. PreventaService - En producción NO se utiliza preventa.json ni activa fallback ante error de Google Sheets', async () => {
    delete globalThis.CONFIG_PREVENTA;
    globalThis.fetch = async (url) => {
        if (url.includes('docs.google.com')) {
            throw new Error('Network error simulated in production');
        }
        return { ok: false, status: 500 };
    };

    await assert.rejects(
        async () => {
            await globalThis.PreventaService.cargarProductos(true);
        },
        /Network error simulated in production/
    );
    assert.equal(globalThis.PreventaService.obtenerOrigen(), 'error');
    assert.equal(globalThis.PreventaService.obtenerProductos().length, 0);
});

test('14. PreventaService - Flujo de producción exclusivo con Google Sheets (origen = "google-sheets")', async () => {
    delete globalThis.CONFIG_PREVENTA;
    globalThis.fetch = async (url) => ({
        ok: true,
        text: async () => CSV_SAMPLE_PREVENTA,
        json: async () => []
    });

    const productos = await globalThis.PreventaService.cargarProductos(true);
    assert.equal(Array.isArray(productos), true);
    assert.equal(globalThis.PreventaService.obtenerOrigen(), 'google-sheets');
});

test('15. FASE P2.3 - Grid responsive (4 col desktop, 3 col tablet, 2 col móvil) y estructura visual de .preventa-card', () => {
    const cssPath = path.join(ROOT_DIR, 'css', 'preventa.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Grid: Desktop 4 columnas, Tablet 3 columnas, Móvil 2 columnas
    assert.ok(css.includes('repeat(4, minmax(0, 1fr))'), 'Debe definir grid de 4 columnas en desktop');
    assert.ok(css.includes('repeat(3, minmax(0, 1fr))'), 'Debe definir grid de 3 columnas en tablet');
    assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), 'Debe definir grid de 2 columnas en móvil');

    // Componentes de tarjeta boutique
    assert.ok(css.includes('.preventa-card'), 'Debe estilizar .preventa-card');
    assert.ok(css.includes('.preventa-card-media'), 'Debe estilizar .preventa-card-media');
    assert.ok(css.includes('.preventa-card-img'), 'Debe estilizar .preventa-card-img con object-fit contain');
    assert.ok(css.includes('.preventa-status-badge'), 'Debe incluir badges de estado en esquina superior izquierda');
    assert.ok(css.includes('.preventa-format-badge'), 'Debe incluir badge de formato');
    assert.ok(css.includes('.preventa-card-name'), 'Debe estilizar nombre del perfume con Cormorant Garamond');
    assert.ok(css.includes('.preventa-price-regular-val'), 'Debe incluir precio regular tachado');
    assert.ok(css.includes('.preventa-price-preventa-val'), 'Debe incluir precio preventa destacado');
    assert.ok(css.includes('.preventa-reserve-badge'), 'Debe incluir elemento informativo Reserva con S/10');
    assert.ok(css.includes('.preventa-card-btn'), 'Debe incluir botón RESERVAR AHORA');

    // Markup en preventa/index.html
    const htmlPath = path.join(ROOT_DIR, 'preventa', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(html.includes("join(' · ')"), 'Debe formatear ocasión múltiple con separador interpunct');
    assert.ok(html.includes('preventa-card-brand'), 'Debe renderizar marca');
    assert.ok(html.includes('preventa-card-category'), 'Debe renderizar categoría');
    assert.ok(html.includes('preventa-card-volume'), 'Debe renderizar formato/volumen');
    assert.ok(html.includes('preventa-card-occasion'), 'Debe renderizar ocasión');
    assert.ok(html.includes('Reserva con S/ 10.00'), 'Debe renderizar mensaje de separación S/10');
});




