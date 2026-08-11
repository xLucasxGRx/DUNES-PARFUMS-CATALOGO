/**
 * Dunes Parfums - módulo de carga y consulta de productos
 * Carga dinámicamente los datos desde data/productos.json.
 */

let cacheProductos = [];
let promesaCargaEnProgreso = null;

/**
 * Obtiene la lista completa de productos desde el servicio centralizado (Google Sheets con fallback a JSON)
 * Guarantees single-flight request sharing and in-memory caching per page lifecycle.
 * @returns {Promise<Array>} - Promesa con la lista de productos
 */
async function obtenerProductos() {
    if (cacheProductos.length > 0) {
        return cacheProductos;
    }

    if (promesaCargaEnProgreso) {
        return promesaCargaEnProgreso;
    }

    promesaCargaEnProgreso = (async () => {
        try {
            const resultado = await ProductosService.cargarProductos();
            cacheProductos = resultado ? (resultado.productos || []) : [];
            return cacheProductos;
        } catch (error) {
            console.error('Error al cargar el catálogo de productos:', error);
            return [];
        } finally {
            promesaCargaEnProgreso = null;
        }
    })();

    return promesaCargaEnProgreso;
}

/**
 * Filtra los productos por una categoría específica
 * @param {string} categoria - Nombre de la categoría (árabes, diseñador, nicho, decants)
 * @returns {Promise<Array>}
 */
async function obtenerProductosPorCategoria(categoria) {
    const todos = await obtenerProductos();
    return todos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
}

/**
 * Obtiene los productos marcados como destacados o en oferta
 * @returns {Promise<Array>}
 */
async function obtenerProductosDestacados() {
    const todos = await obtenerProductos();
    return todos
        .filter(p => p.visible === true && p.destacado === true)
        .sort((a, b) => {
            if (a.disponible !== b.disponible) {
                return Number(b.disponible) - Number(a.disponible);
            }
            const ordenA = a.orden !== null && a.orden !== undefined ? Number(a.orden) : 9999;
            const ordenB = b.orden !== null && b.orden !== undefined ? Number(b.orden) : 9999;
            return ordenA - ordenB;
        })
        .slice(0, 8);
}

/**
 * Busca un producto por su identificador único
 * @param {string} id - ID del producto
 * @returns {Promise<Object|null>}
 */
async function obtenerProductoPorId(id) {
    const todos = await obtenerProductos();
    return todos.find(p => String(p.id) === String(id)) || null;
}

/**
 * Obtiene el producto activo para la Oferta Especial (visible = true && oferta = true)
 * Rota automáticamente entre los productos con oferta activa, evitando repetir
 * inmediatamente el último producto mostrado almacenado en 'dunes_ultima_oferta_inicio'.
 * @returns {Promise<Object|null>}
 */
async function obtenerProductoOferta() {
    const todos = await obtenerProductos();
    const candidatos = (todos || []).filter(p => {
        if (!p || p.visible !== true || p.oferta !== true) return false;
        if (!p.id || !p.nombre || !p.imagen) return false;
        const precioNum = Number(p.precio);
        if (isNaN(precioNum) || precioNum <= 0) return false;
        const esDecant = p.categoria === 'decants';
        const poVal = p.precio_oferta ?? p.precioOferta;
        const tienePrecioOferta = poVal !== undefined && poVal !== null && !isNaN(Number(poVal)) && Number(poVal) > 0;
        if (!tienePrecioOferta && !esDecant) return false;
        return true;
    });

    if (candidatos.length === 0) {
        return null;
    }

    const LAST_KEY = 'dunes_ultima_oferta_inicio';

    if (candidatos.length === 1) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(LAST_KEY, String(candidatos[0].id).trim());
            }
        } catch (e) {}
        return candidatos[0];
    }

    let ultimoId = '';
    try {
        if (typeof localStorage !== 'undefined') {
            ultimoId = String(localStorage.getItem(LAST_KEY) || '').trim();
        }
    } catch (e) {}

    let disponibles = candidatos.filter(p => String(p.id).trim() !== ultimoId);
    if (disponibles.length === 0) {
        disponibles = candidatos;
    }

    const randomIndex = Math.floor(Math.random() * disponibles.length);
    const seleccionado = disponibles[randomIndex];

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_KEY, String(seleccionado.id).trim());
        }
    } catch (e) {}

    return seleccionado;
}

// Hacer las funciones disponibles globalmente
window.productosModulo = {
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductosDestacados,
    obtenerProductoPorId,
    obtenerProductoOferta
};
