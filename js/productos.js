/**
 * Dunes Parfums - módulo de carga y consulta de productos
 * Carga dinámicamente los datos desde data/productos.json.
 */

let cacheProductos = [];

/**
 * Obtiene la lista completa de productos desde el archivo JSON
 * @returns {Promise<Array>} - Promesa con la lista de productos
 */
async function obtenerProductos() {
    if (cacheProductos.length > 0) {
        return cacheProductos;
    }

    try {
        const resultado = await ProductosService.cargarProductos();
        cacheProductos = resultado.productos || [];
        return cacheProductos;
    } catch (error) {
        console.error('Error al cargar el catálogo de productos:', error);
        return [];
    }
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
 * Si hay múltiples, selecciona el primero según el campo orden y emite un warning en consola.
 * @returns {Promise<Object|null>}
 */
async function obtenerProductoOferta() {
    const todos = await obtenerProductos();
    const ofertas = todos
        .filter(p => p.visible === true && p.oferta === true)
        .sort((a, b) => {
            const ordenA = a.orden !== null && a.orden !== undefined ? Number(a.orden) : 9999;
            const ordenB = b.orden !== null && b.orden !== undefined ? Number(b.orden) : 9999;
            return ordenA - ordenB;
        });

    if (ofertas.length === 0) {
        return null;
    }

    if (ofertas.length > 1) {
        console.warn(`Hay más de una oferta activa (${ofertas.length}). Se mostrará la primera según el campo orden: "${ofertas[0].nombre}".`);
    }

    return ofertas[0];
}

// Hacer las funciones disponibles globalmente
window.productosModulo = {
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductosDestacados,
    obtenerProductoPorId,
    obtenerProductoOferta
};
