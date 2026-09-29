/**
 * Dunes Parfums - Módulo de Búsqueda y Filtros de PREVENTA (FASE P3.2)
 * Proporciona el motor de filtrado, búsqueda, ordenación y opciones dinámicas
 * exclusivo para la sección de preventa de alta perfumería.
 */
(function (global) {
    'use strict';

    function normalizarTexto(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    /**
     * Extrae de forma dinámica todas las ocasiones únicas presentes en los productos cargados
     * respetando múltiples valores separados por coma (ej. "Citas,Noche" -> ["Citas", "Noche"]).
     */
    function extraerOcasionesDisponibles(productos) {
        if (!Array.isArray(productos)) return [];
        const ocasionesSet = new Set();

        productos.forEach(prod => {
            if (prod && typeof prod.ocasion === 'string' && prod.ocasion.trim() !== '') {
                const tags = prod.ocasion.split(',');
                tags.forEach(tag => {
                    const limpio = tag.trim();
                    if (limpio) {
                        ocasionesSet.add(limpio);
                    }
                });
            }
        });

        return Array.from(ocasionesSet).sort((a, b) => a.localeCompare(b, 'es'));
    }

    /**
     * Comprueba si un producto coincide con una ocasión seleccionada
     */
    function coincideOcasion(ocasionProducto, ocasionFiltro) {
        const filtroNorm = normalizarTexto(ocasionFiltro);
        if (!filtroNorm || filtroNorm === 'todos' || filtroNorm === 'todas') {
            return true;
        }
        if (!ocasionProducto || typeof ocasionProducto !== 'string') {
            return false;
        }
        const tags = ocasionProducto.split(',').map(tag => normalizarTexto(tag));
        return tags.includes(filtroNorm);
    }

    /**
     * Comprueba si el tipo (categoría) del producto coincide con el filtro activo
     * Fuente: columna 'categoria' de Google Sheets (Árabe, Diseñador, Nicho)
     */
    function coincideTipo(prod, tipoFiltro) {
        const filtroNorm = normalizarTexto(tipoFiltro);
        if (!filtroNorm || filtroNorm === 'todos') {
            return true;
        }
        const catProd = normalizarTexto(prod.categoria);
        if (filtroNorm === 'arabe' || filtroNorm === 'arabes') {
            return catProd.includes('arab');
        }
        if (filtroNorm === 'disenador' || filtroNorm === 'disenadores') {
            return catProd.includes('disen');
        }
        if (filtroNorm === 'nicho') {
            return catProd.includes('nicho');
        }
        return catProd === filtroNorm;
    }

    /**
     * Comprueba si el género del producto coincide con el filtro activo
     * Fuente: columna 'genero' de Google Sheets (Hombre, Mujer, Unisex)
     */
    function coincideGenero(prod, generoFiltro) {
        const filtroNorm = normalizarTexto(generoFiltro);
        if (!filtroNorm || filtroNorm === 'todos') {
            return true;
        }
        const genProd = normalizarTexto(prod.genero);
        return genProd === filtroNorm;
    }

    /**
     * Comprueba si el producto coincide con la búsqueda por nombre o marca
     */
    function coincideBusqueda(prod, query) {
        const queryNorm = normalizarTexto(query);
        if (!queryNorm) {
            return true;
        }
        const nombreNorm = normalizarTexto(prod.nombre);
        const marcaNorm = normalizarTexto(prod.marca);
        return nombreNorm.includes(queryNorm) || marcaNorm.includes(queryNorm);
    }

    /**
     * Comprueba el filtro de solo disponibles (stock > 0 y disponible === true)
     */
    function coincideSoloDisponibles(prod, soloDisponibles) {
        if (!soloDisponibles) return true;
        return prod.disponible === true && Number(prod.stock) > 0;
    }

    /**
     * Ordena una lista de productos de preventa según el criterio especificado:
     * - 'relevancia': orden original de la hoja de Google Sheets
     * - 'precio-menor': precio preventa ascendente
     * - 'precio-mayor': precio preventa descendente
     * - 'mas-reservas': productos con mayor demanda / menor stock restante > 0
     */
    function ordenarProductos(productos, criterio) {
        const copia = [...productos];
        switch (criterio) {
            case 'precio-menor':
                return copia.sort((a, b) => (Number(a.precio_preventa) || 0) - (Number(b.precio_preventa) || 0));
            case 'precio-mayor':
                return copia.sort((a, b) => (Number(b.precio_preventa) || 0) - (Number(a.precio_preventa) || 0));
            case 'mas-reservas':
                return copia.sort((a, b) => {
                    const stockA = Number(a.stock) || 0;
                    const stockB = Number(b.stock) || 0;
                    if (stockA > 0 && stockB > 0) return stockA - stockB;
                    if (stockA > 0) return -1;
                    if (stockB > 0) return 1;
                    return 0;
                });
            case 'relevancia':
            default:
                return copia;
        }
    }

    /**
     * Aplica el conjunto completo de filtros y ordenamiento a una lista de productos
     */
    function filtrarYOrdenarProductos(productos, opciones = {}) {
        if (!Array.isArray(productos)) return [];

        const {
            busqueda = '',
            tipo = 'todos',
            genero = 'todos',
            ocasion = 'todos',
            soloDisponibles = false,
            ordenar = 'relevancia'
        } = opciones;

        const filtrados = productos.filter(prod => {
            if (!prod) return false;
            return (
                coincideBusqueda(prod, busqueda) &&
                coincideTipo(prod, tipo) &&
                coincideGenero(prod, genero) &&
                coincideOcasion(prod.ocasion, ocasion) &&
                coincideSoloDisponibles(prod, soloDisponibles)
            );
        });

        return ordenarProductos(filtrados, ordenar);
    }

    const PreventaFilters = {
        normalizarTexto,
        extraerOcasionesDisponibles,
        coincideOcasion,
        coincideTipo,
        coincideGenero,
        coincideBusqueda,
        coincideSoloDisponibles,
        ordenarProductos,
        filtrarYOrdenarProductos
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PreventaFilters;
    } else {
        global.PreventaFilters = PreventaFilters;
    }
})(typeof window !== 'undefined' ? window : globalThis);
