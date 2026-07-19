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
        // En GitHub Pages, la ruta absoluta /data/productos.json puede fallar si está en subdirectorio.
        // Usamos una ruta relativa desde el HTML o la raíz del sitio
        const response = await fetch('./data/productos.json');
        if (!response.ok) {
            throw new Error(`Error HTTP! status: ${response.status}`);
        }
        cacheProductos = await response.json();
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
    return todos.filter(p => p.destacado === true);
}

/**
 * Busca un producto por su identificador único
 * @param {string} id - ID del producto
 * @returns {Promise<Object|null>}
 */
async function obtenerProductoPorId(id) {
    const todos = await obtenerProductos();
    return todos.find(p => p.id === id) || null;
}

// Hacer las funciones disponibles globalmente
window.productosModulo = {
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductosDestacados,
    obtenerProductoPorId
};
