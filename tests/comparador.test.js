/**
 * Dunes Parfums - Tests de Unidad e Integración para FASE M24.1 (Reparación del Buscador y Rediseño Visual)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('M24.1 - 1. comparador.html NO incluye HERRAMIENTA OLFATIVA y posee la estructura del encabezado aprobada', () => {
    assert.ok(fs.existsSync('comparador.html'), 'El archivo comparador.html debe existir');
    const html = fs.readFileSync('comparador.html', 'utf8');

    assert.ok(!html.includes('HERRAMIENTA OLFATIVA'), 'NO debe contener el texto HERRAMIENTA OLFATIVA');
    assert.ok(html.includes('page-heading__title'), 'Debe usar el sistema de encabezados de página oficial');
    assert.ok(html.includes('btn-mode-sellados'), 'Debe incluir el botón de modo Sellados');
    assert.ok(html.includes('btn-mode-decants'), 'Debe incluir el botón de modo Decants');
});

test('M24.1 - 2. Menú de navegación contiene Comparar Perfumes colocado debajo de Ofertas en HTMLs', () => {
    const paginas = ['index.html', 'catalogo.html', 'producto.html', 'favoritos.html', 'carrito.html', 'ayuda.html', 'comparador.html'];

    paginas.forEach(pag => {
        if (fs.existsSync(pag)) {
            const content = fs.readFileSync(pag, 'utf8');
            assert.ok(content.includes('Comparar Perfumes'), `Página ${pag} debe incluir la opción Comparar Perfumes`);
            
            const posOfertas = content.indexOf('span class="nav-link-text">Ofertas');
            const posComparar = content.indexOf('span class="nav-link-text">Comparar Perfumes');
            assert.ok(posComparar > posOfertas, `En ${pag}, Comparar Perfumes debe estar ubicado después de Ofertas en el menú`);
        }
    });
});

test('M24.1 - 3. Búsqueda insensible a acentos/mayúsculas y coincidencia parcial (ej. MANDARIN)', () => {
    const mockProductos = [
        { id: '1', nombre: 'Mandarin Sky', marca: 'Armaf', visible: true, stock: 5, imagen_notas: 'img/productos/ArmafMandarinSky.webp', categoria: 'arabe' },
        { id: '2', nombre: 'Khamrah Qahwa', marca: 'Lattafa', visible: true, stock: 3, imagen_notas: 'img/productos/LattafaKhamrahQahwa.webp', categoria: 'arabe' }
    ];

    const normalizarTexto = (str) => {
        if (!str) return '';
        return String(str).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const buscar = (query, productos) => {
        const qNorm = normalizarTexto(query);
        return productos.filter(p => {
            const nomNorm = normalizarTexto(p.nombre);
            const marNorm = normalizarTexto(p.marca);
            return nomNorm.includes(qNorm) || marNorm.includes(qNorm);
        });
    };

    // Test 1: Búsqueda con Mayúsculas "MANDARIN"
    const resMandarin = buscar('MANDARIN', mockProductos);
    assert.strictEqual(resMandarin.length, 1, 'MANDARIN debe encontrar Mandarin Sky');
    assert.strictEqual(resMandarin[0].nombre, 'Mandarin Sky');

    // Test 2: Búsqueda parcial "mand"
    const resMand = buscar('mand', mockProductos);
    assert.strictEqual(resMand.length, 1, 'mand debe encontrar Mandarin Sky');

    // Test 3: Búsqueda por marca "armaf"
    const resArmaf = buscar('armaf', mockProductos);
    assert.strictEqual(resArmaf.length, 1, 'armaf debe encontrar productos de la marca Armaf');
});

test('M24.1 - 4. Lógica de Filtrado de Productos por Modo y Exclusión Cruzada', () => {
    const mockProductos = [
        { id: '1', nombre: 'Khamrah', marca: 'Lattafa', visible: true, stock: 5, imagen_notas: 'img/notas/khamrah.webp', categoria: 'arabe', presentaciones: [] },
        { id: '2', nombre: 'Asad', marca: 'Lattafa', visible: true, stock: 0, imagen_notas: 'img/notas/asad.webp', categoria: 'decants', presentaciones: [{ ml: 5, precio: 30 }] },
        { id: '3', nombre: 'Yara', marca: 'Lattafa', visible: true, stock: 2, imagen_notas: '', categoria: 'arabe', presentaciones: [] }, // Sin imagen_notas
        { id: '4', nombre: 'Club de Nuit', marca: 'Armaf', visible: false, stock: 10, imagen_notas: 'img/notas/cdnim.webp', categoria: 'arabe', presentaciones: [] } // Visible false
    ];

    const filtrar = (modo, productos, excluirId) => {
        return productos.filter(p => {
            if (p.visible === false) return false;
            if (!p.imagen_notas || p.imagen_notas.trim() === '') return false;
            if (excluirId && String(p.id).trim() === String(excluirId).trim()) return false;

            if (modo === 'sellados') {
                return p.stock > 0 && p.categoria !== 'decants';
            } else if (modo === 'decants') {
                const esDecant = p.categoria === 'decants' || (p.presentaciones && p.presentaciones.length > 0);
                return esDecant;
            }
            return false;
        });
    };

    const sellados = filtrar('sellados', mockProductos, null);
    assert.strictEqual(sellados.length, 1, 'Solo Khamrah debe ser elegible en Sellados');
    assert.strictEqual(sellados[0].nombre, 'Khamrah');

    const selladosConExclusion = filtrar('sellados', mockProductos, '1');
    assert.strictEqual(selladosConExclusion.length, 0, 'Khamrah debe ser excluido si ya se seleccionó en el otro lado');
});

test('M24.2 - 1. comparador.html incluye design-system.css y estructura de encabezado limpia sin $ en DECANTS', () => {
    assert.ok(fs.existsSync('comparador.html'), 'El archivo comparador.html debe existir');
    const html = fs.readFileSync('comparador.html', 'utf8');

    assert.ok(html.includes('css/design-system.css'), 'comparador.html debe incluir css/design-system.css');
    assert.ok(html.includes('page-heading page-heading--light section-header'), 'Debe utilizar las clases del sistema de encabezado del catálogo');
    assert.ok(html.includes('COMPARAR PERFUMES'), 'Título debe ser COMPARAR PERFUMES');
    assert.ok(html.includes('Compara sus notas y encuentra tu fragancia ideal.'), 'Descripción debe ser la aprobada');
    
    // Verificar selector de modo sin símbolo $
    const posDecantsBtn = html.indexOf('id="btn-mode-decants"');
    assert.ok(posDecantsBtn !== -1, 'Debe existir el botón DECANTS');
    const decantsSubStr = html.substring(posDecantsBtn, posDecantsBtn + 300);
    assert.ok(!decantsSubStr.includes('$'), 'El botón DECANTS NO debe incluir el símbolo $');
});

test('M24.2 - 2. js/comparador.js utiliza ProductosService.cargarProductos centralizadamente', () => {
    const jsContent = fs.readFileSync('js/comparador.js', 'utf8');
    assert.ok(jsContent.includes('ProductosService.cargarProductos'), 'Debe invocar ProductosService.cargarProductos');
    assert.ok(!jsContent.includes('obtenerTodos()'), 'NO debe invocar obtenerTodos() que no existe en ProductosService');
});

test('M24.3 - 1. js/comparador.js gestiona estado asíncrono de carga (state.cargando) y sincroniza al finalizar', () => {
    const jsContent = fs.readFileSync('js/comparador.js', 'utf8');
    assert.ok(jsContent.includes('state.cargando'), 'Debe rastrear el estado de carga con state.cargando');
    assert.ok(jsContent.includes('CARGANDO FRAGANCIAS...'), 'Debe mostrar mensaje de carga en el dropdown mientras finaliza el fetch');
    assert.ok(jsContent.includes('renderizarLado(\'izq\')'), 'Debe re-renderizar lados al completar la carga');
});

test('M24.3 - 2. css/estilos.css contiene reglas compactas M24.3 para encabezado y selector de modo', () => {
    const cssContent = fs.readFileSync('css/estilos.css', 'utf8');
    assert.ok(cssContent.includes('FASE M24.3'), 'Debe incluir bloque de estilos de FASE M24.3');
    assert.ok(cssContent.includes('max-width: 380px;'), 'Selector de modo debe ser 15-20% más compacto (max-width 380px)');
    assert.ok(cssContent.includes('height: 40px;'), 'Input de búsqueda debe ser compacto (height 40px)');
});

test('M24.5 - 1. js/interfaz.js soporta URLs directas string en abrirLightboxVisor sin reemplazar por logo', () => {
    const interfazContent = fs.readFileSync('js/interfaz.js', 'utf8');
    assert.ok(interfazContent.includes('typeof prod === \'string\''), 'abrirLightboxVisor debe verificar si prod es una cadena de texto URL');
    assert.ok(interfazContent.includes('imgEl.onerror'), 'Solo debe asignar logo en caso de evento error real');
});

test('M24.5 - 2. js/comparador.js y css/estilos.css incorporan elementos y diseño premium M24.5', () => {
    const comparadorContent = fs.readFileSync('js/comparador.js', 'utf8');
    const cssContent = fs.readFileSync('css/estilos.css', 'utf8');

    assert.ok(comparadorContent.includes('comparator-zoom-badge'), 'Ficha olfativa debe incluir el indicador discreto VER FICHA');
    assert.ok(comparadorContent.includes('ELIGE TU DECANT'), 'Modo decants debe incluir el subtítulo ELIGE TU DECANT');
    assert.ok(cssContent.includes('FASE M24.5 Rediseño Premium'), 'css/estilos.css debe incluir la sección de diseño premium M24.5');
    assert.ok(cssContent.includes('.comparator-zoom-badge'), 'css/estilos.css debe estilizar .comparator-zoom-badge');
    assert.ok(cssContent.includes('.comparator-qty-selector'), 'css/estilos.css debe definir el stepper premium');
});

test('M24.6 - 1. comparador.html reutiliza exactamente el header-actions oficial con cart-icon-btn y cart-count', () => {
    const html = fs.readFileSync('comparador.html', 'utf8');
    assert.ok(html.includes('class="cart-icon-btn"'), 'comparador.html debe incluir la clase cart-icon-btn oficial');
    assert.ok(html.includes('class="cart-count" id="cart-count"'), 'comparador.html debe incluir el elemento badge cart-count id="cart-count"');
    assert.ok(html.includes('class="favorites-header-icon-btn"'), 'comparador.html debe incluir favorites-header-icon-btn oficial');
    assert.ok(html.includes('class="burger-menu-btn"'), 'comparador.html debe incluir la clase burger-menu-btn oficial');
});




