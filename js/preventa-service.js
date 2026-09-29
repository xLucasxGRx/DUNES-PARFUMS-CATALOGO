/**
 * Dunes Parfums - Servicio Independiente de Preventa (FASE P1)
 * Módulo desacoplado para la gestión y carga de productos de Preventa desde Google Sheets
 * con fallback automático a JSON local y control estricto de visibilidad y disponibilidad.
 */

const PreventaService = (function () {
    let productosCache = null;
    let configPreventaCache = null;
    let promesaCarga = null;
    let promesaCargaConfig = null;
    let origenDatos = 'desconocido';

    const CONFIG_DEFAULT = {
        sheetsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=1833078058&single=true&output=csv",
        configSheetsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=297886514&single=true&output=csv",
        respaldoJsonUrl: null, // Desactivado para producción: Google Sheets es la única fuente oficial
        permitirFallback: false,
        timeoutMs: 8000
    };

    /**
     * Obtiene la configuración activa, priorizando window.CONFIG_PREVENTA si existe.
     */
    function obtenerConfig() {
        const globalConfig = (typeof window !== 'undefined' && window.CONFIG_PREVENTA) ? window.CONFIG_PREVENTA : {};
        return {
            ...CONFIG_DEFAULT,
            ...globalConfig
        };
    }

    /**
     * Resuelve la ruta relativa hacia el archivo de respaldo según la ubicación de la página.
     */
    function resolverRutaRespaldo(urlRespaldo) {
        if (!urlRespaldo) return "data/preventa.json";
        if (urlRespaldo.startsWith('http') || urlRespaldo.startsWith('/')) {
            return urlRespaldo;
        }
        if (typeof window !== 'undefined' && window.location && window.location.pathname) {
            const path = window.location.pathname.toLowerCase();
            if (path.includes('/preventa/') || path.endsWith('/preventa')) {
                return "../" + urlRespaldo;
            }
        }
        return urlRespaldo;
    }

    /**
     * Parser CSV robusto compatible con comillas escapadas, comas y saltos de línea CRLF/LF.
     */
    function parseCSV(csvText) {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuote = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (insideQuote) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentCell += '"';
                        i++;
                    } else {
                        insideQuote = false;
                    }
                } else {
                    currentCell += char;
                }
            } else {
                if (char === '"') {
                    insideQuote = true;
                } else if (char === ',') {
                    currentRow.push(currentCell.trim());
                    currentCell = '';
                } else if (char === '\r' || char === '\n') {
                    if (char === '\r' && nextChar === '\n') {
                        i++;
                    }
                    currentRow.push(currentCell.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
        }
        return rows;
    }

    function limpiarValor(valor) {
        return String(valor ?? '')
            .replace(/^\uFEFF/, '')
            .trim();
    }

    function normalizarCabecera(cabecera) {
        return limpiarValor(cabecera)
            .toLowerCase()
            .replace(/[\r\n\t]+/g, '')
            .replace(/\s+/g, '_');
    }

    function normalizarTexto(txt) {
        if (txt === null || txt === undefined) return '';
        return String(txt).trim();
    }

    function normalizarBooleano(valor) {
        if (typeof valor === 'boolean') return valor;
        const str = limpiarValor(valor).toLowerCase();
        return str === 'true' || str === '1' || str === 'si' || str === 'sí' || str === 'verdadero';
    }

    function normalizarNumero(valor, fallback = 0) {
        if (valor === undefined || valor === null) return fallback;
        const str = limpiarValor(valor).replace(',', '.');
        if (str === '') return fallback;
        const num = Number(str);
        return Number.isFinite(num) ? num : fallback;
    }

    /**
     * Normaliza el campo ocasión preservando múltiples valores separados por coma
     * para total compatibilidad con la lógica de filtros multi-tag del catálogo principal.
     * No reemplaza comas por guiones, no convierte a texto plano destructivo y
     * conserva íntegros todos los valores (ej: "Citas,Noche" o "Versátil,Diario,Citas").
     */
    function normalizarOcasion(valor) {
        if (valor === undefined || valor === null) return '';
        if (Array.isArray(valor)) {
            return valor
                .map(v => String(v ?? '').replace(/^\uFEFF/, '').trim())
                .filter(Boolean)
                .join(',');
        }
        return String(valor)
            .replace(/^\uFEFF/, '')
            .trim();
    }

    /**
     * Mapea y normaliza una fila cruda de datos a la estructura del objeto de Preventa.
     * Mantiene las 12 columnas exactas de Google Sheets:
     * nombre, marca, categoria, genero, formato_presentacion, precio_regular,
     * precio_preventa, stock, disponible, visible, imagen, ocasion
     */
    function transformarFilaAProducto(filaObj, index) {
        return {
            id: filaObj.id || `prev-${index + 1}`,
            nombre: normalizarTexto(filaObj.nombre),
            marca: normalizarTexto(filaObj.marca),
            categoria: normalizarTexto(filaObj.categoria),
            genero: normalizarTexto(filaObj.genero),
            formato_presentacion: normalizarTexto(filaObj.formato_presentacion),
            precio_regular: normalizarNumero(filaObj.precio_regular, 0),
            precio_preventa: normalizarNumero(filaObj.precio_preventa, 0),
            stock: Math.max(0, Math.floor(normalizarNumero(filaObj.stock, 0))),
            disponible: normalizarBooleano(filaObj.disponible),
            visible: normalizarBooleano(filaObj.visible),
            imagen: normalizarTexto(filaObj.imagen),
            ocasion: normalizarOcasion(filaObj.ocasion)
        };
    }

    /**
     * Carga el archivo local de respaldo JSON en caso de fallo de conexión con Google Sheets.
     */
    async function cargarRespaldoLocal(urlRespaldo) {
        const rutaFinal = resolverRutaRespaldo(urlRespaldo);
        console.warn(`[PreventaService] Cargando datos desde respaldo local: ${rutaFinal}`);
        const response = await fetch(rutaFinal);
        if (!response.ok) {
            throw new Error(`Error HTTP al cargar respaldo JSON: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('El respaldo JSON no contiene un array de productos');
        }
        return data.map((item, idx) => transformarFilaAProducto(item, idx));
    }

    /**
     * Carga y procesa los productos de Preventa desde Google Sheets (CSV) con fallback a JSON.
     * @param {boolean} forzarRecarga
     * @returns {Promise<Array>} Lista completa de productos parseados
     */
    async function cargarProductos(forzarRecarga = false) {
        if (!forzarRecarga && productosCache !== null) {
            return productosCache;
        }

        if (promesaCarga && !forzarRecarga) {
            return promesaCarga;
        }

        const config = obtenerConfig();

        promesaCarga = (async () => {
            try {
                if (!config.sheetsCsvUrl) {
                    if (config.permitirFallback && config.respaldoJsonUrl) {
                        const fallbackData = await cargarRespaldoLocal(config.respaldoJsonUrl);
                        productosCache = fallbackData;
                        origenDatos = 'json-pruebas';
                        return productosCache;
                    }
                    throw new Error('No se ha configurado la URL de Google Sheets PREVENTA');
                }

                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = controller ? setTimeout(() => controller.abort(), config.timeoutMs) : null;

                const response = await fetch(config.sheetsCsvUrl, {
                    signal: controller ? controller.signal : undefined
                });

                if (timeoutId) clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Google Sheets devolvió status ${response.status}`);
                }

                const csvText = await response.text();
                const rows = parseCSV(csvText);

                if (rows.length <= 1) {
                    // Solo cabecera o vacío
                    productosCache = [];
                    origenDatos = 'google-sheets';
                    return productosCache;
                }

                const rawHeaders = rows[0].map(h => normalizarCabecera(h));
                const dataRows = rows.slice(1);

                const productos = [];
                dataRows.forEach((row, rowIndex) => {
                    if (row.length === 0 || (row.length === 1 && !row[0])) {
                        return; // Fila vacía
                    }
                    const filaObj = {};
                    rawHeaders.forEach((header, colIndex) => {
                        filaObj[header] = row[colIndex] ?? '';
                    });

                    // Validar que al menos tenga nombre
                    if (!limpiarValor(filaObj.nombre)) {
                        return;
                    }

                    productos.push(transformarFilaAProducto(filaObj, rowIndex));
                });

                productosCache = productos;
                origenDatos = 'google-sheets';
                console.log(`[PreventaService] Éxito: ${productosCache.length} producto(s) cargado(s) directamente desde Google Sheets PREVENTA.`);
                return productosCache;
            } catch (error) {
                console.error('[PreventaService] Error al conectar con Google Sheets PREVENTA:', error.message);
                if (config.permitirFallback && config.respaldoJsonUrl) {
                    console.warn('[PreventaService] Modo pruebas unitarias: Activando fallback local:', config.respaldoJsonUrl);
                    try {
                        const fallbackData = await cargarRespaldoLocal(config.respaldoJsonUrl);
                        productosCache = fallbackData;
                        origenDatos = 'json-pruebas';
                        return productosCache;
                    } catch (fallbackError) {
                        console.error('[PreventaService] Falló también el respaldo de pruebas:', fallbackError.message);
                        productosCache = [];
                        origenDatos = 'error';
                        return productosCache;
                    }
                }
                productosCache = [];
                origenDatos = 'error';
                throw error;
            } finally {
                promesaCarga = null;
            }
        })();

        return promesaCarga;
    }

    /**
     * Retorna todos los productos cargados en memoria.
     */
    function obtenerProductos() {
        return productosCache ? [...productosCache] : [];
    }

    /**
     * Retorna únicamente los productos marcados como visibles (visible === true).
     */
    function obtenerProductosVisibles() {
        if (!productosCache) return [];
        return productosCache.filter(p => p.visible === true);
    }

    /**
     * Retorna únicamente los productos listos para reserva: visibles, con disponible = true y stock > 0.
     */
    function obtenerProductosDisponibles() {
        if (!productosCache) return [];
        return productosCache.filter(p => p.visible === true && p.disponible === true && p.stock > 0);
    }

    /**
     * Limpia la caché en memoria.
     */
    function limpiarCache() {
        productosCache = null;
        configPreventaCache = null;
        promesaCarga = null;
        promesaCargaConfig = null;
        origenDatos = 'desconocido';
    }

    /**
     * Procesa el campo fecha_llegada como TEXTO LIBRE (FASE P5.1).
     * Acepta cualquier contenido desde Google Sheets sin conversiones automáticas,
     * formatos calendario, cálculos ni validaciones de fecha.
     * @param {string} fechaStr
     * @returns {string}
     */
    function formatearFechaLlegada(fechaStr) {
        if (fechaStr === null || fechaStr === undefined) return '';
        return String(fechaStr).trim();
    }

    /**
     * Carga y parsea la configuración de preventa (CONFIG_PREVENTA) desde Google Sheets (FASE P5.1).
     * @param {Object} [options]
     * @param {boolean} [options.forzarRecarga=false]
     * @returns {Promise<{ fecha_llegada: string, fecha_llegada_formateada: string, mensaje: string, activo: boolean }>}
     */
    async function cargarConfiguracionPreventa(options = {}) {
        const { forzarRecarga = false } = options;

        if (!forzarRecarga && configPreventaCache) {
            return configPreventaCache;
        }

        if (promesaCargaConfig && !forzarRecarga) {
            return promesaCargaConfig;
        }

        promesaCargaConfig = (async () => {
            const config = obtenerConfig();
            const configUrl = config.configSheetsCsvUrl || CONFIG_DEFAULT.configSheetsCsvUrl;

            try {
                const sep = configUrl.includes('?') ? '&' : '?';
                const urlConTimestamp = `${configUrl}${sep}_t=${Date.now()}`;
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = controller ? setTimeout(() => controller.abort(), config.timeoutMs || 8000) : null;

                const response = await fetch(urlConTimestamp, {
                    cache: 'no-store',
                    headers: { 'Accept': 'text/csv,text/plain,*/*' },
                    signal: controller ? controller.signal : undefined
                });

                if (timeoutId) clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} al cargar CONFIG_PREVENTA`);
                }

                const csvText = await response.text();
                const rows = parseCSV(csvText);

                if (!rows || rows.length < 2) {
                    throw new Error('CSV de CONFIG_PREVENTA vacío o sin datos');
                }

                const headerRow = rows[0].map(h => normalizarCabecera(h));
                const dataRow = rows[1];

                const findVal = (colNames) => {
                    for (const name of colNames) {
                        const idx = headerRow.findIndex(h => h === name || h.replace(/\s+/g, '_') === name);
                        if (idx !== -1 && dataRow[idx] !== undefined) {
                            return limpiarValor(dataRow[idx]);
                        }
                    }
                    return '';
                };

                const rawFecha = findVal(['fecha_llegada', 'fecha', 'llegada']);
                const rawMensaje = findVal(['mensaje', 'mensaje_llegada', 'texto']);
                const rawActivo = findVal(['activo', 'habilitado', 'estado']);

                const activo = normalizarBooleano(rawActivo);
                const fechaFormateada = formatearFechaLlegada(rawFecha);
                const mensaje = rawMensaje || 'Reserva tu fragancia y asegura tu precio especial de preventa.';

                configPreventaCache = {
                    fecha_llegada: rawFecha,
                    fecha_llegada_formateada: fechaFormateada,
                    mensaje: mensaje,
                    activo: activo
                };

                return configPreventaCache;
            } catch (err) {
                console.warn('[PreventaService] No se pudo cargar CONFIG_PREVENTA de Google Sheets:', err.message);
                return {
                    fecha_llegada: '',
                    fecha_llegada_formateada: '',
                    mensaje: 'Reserva tu fragancia y asegura tu precio especial de preventa.',
                    activo: false
                };
            } finally {
                promesaCargaConfig = null;
            }
        })();

        return promesaCargaConfig;
    }

    /**
     * Retorna la configuración de preventa actualmente en memoria o null si aún no se cargó.
     */
    function obtenerConfiguracionPreventa() {
        return configPreventaCache;
    }

    /**
     * Obtiene el stock disponible de un producto por ID o Nombre (FASE P4.5).
     * @param {string} idONombre
     * @returns {number|null}
     */
    function obtenerStockProducto(idONombre) {
        if (!productosCache || !idONombre) return null;
        const buscado = String(idONombre).toLowerCase().trim();
        const prod = productosCache.find(p => 
            String(p.id).toLowerCase() === buscado || 
            String(p.nombre).toLowerCase().trim() === buscado
        );
        return prod ? Math.max(0, parseInt(prod.stock, 10) || 0) : null;
    }

    /**
     * Valida si un producto está disponible y si una cantidad deseada no supera el stock (FASE P4.5).
     * @param {string} idONombre
     * @param {number} cantidadDeseada
     * @returns {{ disponible: boolean, stock: number, permitido: boolean, motivo?: string }}
     */
    function validarDisponibilidad(idONombre, cantidadDeseada = 1) {
        if (!productosCache || !idONombre) {
            return { disponible: false, stock: 0, permitido: false, motivo: 'sin_datos' };
        }
        const buscado = String(idONombre).toLowerCase().trim();
        const prod = productosCache.find(p => 
            String(p.id).toLowerCase() === buscado || 
            String(p.nombre).toLowerCase().trim() === buscado
        );
        if (!prod) {
            return { disponible: false, stock: 0, permitido: false, motivo: 'no_encontrado' };
        }
        const stockActual = Math.max(0, parseInt(prod.stock, 10) || 0);
        if (!prod.disponible || stockActual <= 0) {
            return { disponible: false, stock: stockActual, permitido: false, motivo: 'agotado' };
        }
        const cant = Math.max(1, parseInt(cantidadDeseada, 10) || 1);
        if (cant > stockActual) {
            return { disponible: true, stock: stockActual, permitido: false, motivo: 'stock_superado' };
        }
        return { disponible: true, stock: stockActual, permitido: true };
    }

    function obtenerOrigen() {
        return origenDatos;
    }

    return {
        cargarProductos,
        obtenerProductos,
        obtenerProductosVisibles,
        obtenerProductosDisponibles,
        obtenerStockProducto,
        validarDisponibilidad,
        obtenerOrigen,
        limpiarCache,
        cargarConfiguracionPreventa,
        obtenerConfiguracionPreventa,
        formatearFechaLlegada
    };
})();

if (typeof window !== 'undefined') {
    window.PreventaService = PreventaService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreventaService;
}
