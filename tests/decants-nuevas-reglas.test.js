const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Cargar scripts necesarios en el entorno Node global
const productosServiceCode = fs.readFileSync(path.resolve(__dirname, '../js/productos-service.js'), 'utf8');
const catalogoCode = fs.readFileSync(path.resolve(__dirname, '../js/catalogo.js'), 'utf8');

// Mock window/document mínimo para Node
global.window = global;
global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => {
        const dummyNode = {
            className: '',
            style: {},
            textContent: '',
            innerHTML: '',
            appendChild: () => {},
            querySelector: () => dummyNode,
            querySelectorAll: () => [],
            setAttribute: () => {},
            addEventListener: () => {}
        };
        return dummyNode;
    }
};
global.CONFIG = {
    GOOGLE_SHEETS_CSV_URL: ''
};

// Evaluar scripts
eval(productosServiceCode);
eval(catalogoCode);

test('Nuevas Reglas de Decants en Google Sheets', async (t) => {

    await t.test('1. Normalización de formato y categoría en ProductosService', () => {
        const rowDecantArabe = [
            '101', 'Mandarin Sky (Decant)', 'Armaf', 'ÁRABE', 'DECANT', 'hombre',
            'TRUE', 'TRUE', 'img.jpg', '', 'desc', 'FALSE', 'FALSE', '', '1',
            '', '', 'Decants de 3, 5 y 10 ml', '15', '20', '30', '112'
        ];

        const csvText = [
            'id,nombre,marca,categoria,formato,genero,disponible,visible,imagen,imagen_notas,descripcion,destacado,oferta,precio_oferta,orden,precio,stock,presentacion,precio_3ml,precio_5ml,precio_10ml,mililitros_disponibles',
            rowDecantArabe.join(',')
        ].join('\n');

        const rows = window.ProductosService._parseCSV(csvText);
        assert.equal(rows.length, 2);
    });

    await t.test('2. Prueba de datos con IDs 101, 102, 103, 104, 105 y 115', () => {
        const mockProductos = [
            {
                id: '101',
                nombre: 'Mandarin Sky (Decant)',
                marca: 'Armaf',
                categoria: 'arabe',
                formato: 'decant',
                genero: 'hombre',
                disponible: true,
                visible: true,
                mililitrosDisponibles: 112,
                precio_3ml: 15,
                precio_5ml: 20,
                precio_10ml: 30
            },
            {
                id: '102',
                nombre: 'Go Mango (Decant)',
                marca: 'Lattafa',
                categoria: 'arabe',
                formato: 'decant',
                genero: 'unisex',
                disponible: true,
                visible: true,
                mililitrosDisponibles: 60,
                precio_3ml: 15,
                precio_5ml: 20,
                precio_10ml: 30
            },
            {
                id: '103',
                nombre: 'CDN Iconic (Decant)',
                marca: 'Armaf',
                categoria: 'arabe',
                formato: 'decant',
                genero: 'hombre',
                disponible: true,
                visible: true,
                mililitrosDisponibles: 60,
                precio_3ml: 18,
                precio_5ml: 25,
                precio_10ml: 35
            },
            {
                id: '104',
                nombre: 'JPG Le Male Elixir (Decant)',
                marca: 'Jean Paul Gaultier',
                categoria: 'disenador',
                formato: 'decant',
                genero: 'hombre',
                disponible: true,
                visible: true,
                mililitrosDisponibles: 50,
                precio_3ml: 25,
                precio_5ml: 35,
                precio_10ml: 50
            },
            {
                id: '105',
                nombre: 'Valentino Born In Roma Intense (Decant)',
                marca: 'Valentino',
                categoria: 'disenador',
                formato: 'decant',
                genero: 'hombre',
                disponible: true,
                visible: true,
                mililitrosDisponibles: 60,
                precio_3ml: 25,
                precio_5ml: 35,
                precio_10ml: 50
            },
            {
                id: '115',
                nombre: 'Khamrah Clasico (Decant)',
                marca: 'Lattafa',
                categoria: 'arabe',
                formato: 'decant',
                genero: 'unisex',
                disponible: false,
                visible: true,
                mililitrosDisponibles: 0,
                precio_3ml: 15,
                precio_5ml: 20,
                precio_10ml: 30
            }
        ];

        // Decants Árabes
        const decantsArabes = mockProductos.filter(p => coincideFormato(p, 'decant') && coincideTipo(p, 'arabe'));
        assert.equal(decantsArabes.length, 4);
        assert.deepEqual(decantsArabes.map(p => p.id), ['101', '102', '103', '115']);

        // Decants Diseñador
        const decantsDisenador = mockProductos.filter(p => coincideFormato(p, 'decant') && coincideTipo(p, 'disenador'));
        assert.equal(decantsDisenador.length, 2);
        assert.deepEqual(decantsDisenador.map(p => p.id), ['104', '105']);

        // Decants Nicho
        const decantsNicho = mockProductos.filter(p => coincideFormato(p, 'decant') && coincideTipo(p, 'nicho'));
        assert.equal(decantsNicho.length, 0);

        // Verificación de disponibilidad de decants
        const p101 = mockProductos.find(p => p.id === '101');
        assert.equal(p101.mililitrosDisponibles > 0 && p101.disponible, true, 'ID 101 Mandarin Sky debe estar DISPONIBLE');

        const p104 = mockProductos.find(p => p.id === '104');
        assert.equal(p104.mililitrosDisponibles > 0 && p104.disponible, true, 'ID 104 JPG Le Male Elixir debe estar DISPONIBLE');

        const p115 = mockProductos.find(p => p.id === '115');
        assert.equal(p115.mililitrosDisponibles > 0 && p115.disponible, false, 'ID 115 Khamrah debe estar AGOTADO');
    });

    await t.test('3. Invariante: grid se limpia completamente al filtrar 0 productos (DECANTS + NICHO = 0 tarjetas)', () => {
        const children = [];
        const mockGrid = {
            style: { display: '' },
            appendChild: (child) => { children.push(child); },
            querySelectorAll: (selector) => {
                if (selector.includes('product-card')) {
                    return children;
                }
                return [];
            }
        };

        Object.defineProperty(mockGrid, 'innerHTML', {
            get: () => '',
            set: (val) => {
                if (val === '') children.length = 0;
            }
        });

        const mockProductos = [
            { id: '101', nombre: 'Mandarin Sky (Decant)', marca: 'Armaf', categoria: 'arabe', formato: 'decant', disponible: true, visible: true, mililitrosDisponibles: 112 },
            { id: '104', nombre: 'JPG Le Male Elixir (Decant)', marca: 'JPG', categoria: 'disenador', formato: 'decant', disponible: true, visible: true, mililitrosDisponibles: 50 }
        ];

        // 1. Renderizar DECANTS + ÁRABES (1 producto)
        const estadoArabe = { formato: 'decant', tipo: 'arabe', genero: 'todos', busqueda: '', orden: 'relevancia', soloDisponibles: false };
        filtrarYRenderizar(mockProductos, estadoArabe, mockGrid);
        assert.equal(mockGrid.querySelectorAll('.product-card').length, 1, 'DECANTS + ÁRABES debe renderizar 1 tarjeta');

        // 2. Cambiar a DECANTS + NICHO (0 productos)
        const estadoNicho = { formato: 'decant', tipo: 'nicho', genero: 'todos', busqueda: '', orden: 'relevancia', soloDisponibles: false };
        filtrarYRenderizar(mockProductos, estadoNicho, mockGrid);

        // Invariante: 0 tarjetas en el DOM cuando resultado === 0
        assert.equal(mockGrid.querySelectorAll('.product-card').length, 0, 'DECANTS + NICHO debe dejar 0 tarjetas en el grid');
    });
});
