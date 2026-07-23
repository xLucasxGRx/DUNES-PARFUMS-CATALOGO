/**
 * Dunes Parfums - Servicio de Carga y Gestión de Cupones desde Google Sheets
 * 
 * SEGURIDAD Y LIMITACIONES DE ARQUITECTURA:
 * 1. La hoja de Google Sheets es pública y el CSV es accesible vía HTTP.
 * 2. Los códigos de cupones y sus condiciones son visibles en el cliente (Frontend).
 * 3. La validación se ejecuta en el navegador del cliente; usuarios avanzados podrían manipular el estado o reloj local.
 * 4. En el modelo comercial de Dunes Parfums, la venta NO es automática por pasarela.
 *    El pedido se confirma manualmente por un asesor en WhatsApp, quien verifica los códigos y montos antes de autorizar el pago.
 * 5. Sin un backend con base de datos, no es posible garantizar cupones estrictos de un solo uso.
 */

const CuponesService = (function () {
    let cuponesCache = null;
    let promesaCarga = null;

    /**
     * Parser CSV robusto que soporta comillas, comas internas, saltos de línea y comillas escapadas
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

    function normalizarTexto(txt) {
        if (txt === null || txt === undefined) return '';
        return String(txt)
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function normalizarBooleano(valor) {
        if (typeof valor === 'boolean') return valor;
        const str = limpiarValor(valor).toLowerCase();
        return str === 'true' || str === '1' || str === 'si' || str === 'sí';
    }

    function normalizarNumero(valor, fallback = null) {
        if (valor === undefined || valor === null) return fallback;
        const str = limpiarValor(valor).replace(',', '.');
        if (str === '') return fallback;
        const num = Number(str);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizarLista(val) {
        const str = limpiarValor(val);
        if (!str) return [];
        const items = str.split('|').map(s => normalizarTexto(s)).filter(Boolean);
        return [...new Set(items)];
    }
    const normalizarListaPipe = normalizarLista;

    function normalizarFecha(valor) {
        const str = limpiarValor(valor);
        if (!str) return null;
        const match = str.match(/^\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : str;
    }

    /**
     * Procesa y normaliza el CSV de cupones proveniente de Google Sheets
     */
    function procesarCSVCupones(csvText) {
        const filas = parseCSV(csvText);
        if (filas.length < 2) {
            console.warn('[CuponesService] CSV recibido está vacío o no contiene filas de datos.');
            return [];
        }

        const cabeceras = filas[0].map(c => limpiarValor(c).toLowerCase());

        // Validar columnas indispensables
        const columnasIndispensables = ['codigo', 'tipo', 'valor', 'activo', 'alcance'];
        const faltantes = columnasIndispensables.filter(col => !cabeceras.includes(col));

        if (faltantes.length > 0) {
            console.error(`[CuponesService] Estructura de CSV inválida. Faltan columnas indispensables: ${faltantes.join(', ')}`);
            return [];
        }

        const mapaIndex = {};
        cabeceras.forEach((col, idx) => {
            mapaIndex[col] = idx;
        });

        const cupones = [];
        const codigosProcesados = new Set();

        for (let i = 1; i < filas.length; i++) {
            const fila = filas[i];
            if (!fila || fila.length === 0 || (fila.length === 1 && !fila[0])) continue;

            const getVal = (colName) => {
                const idx = mapaIndex[colName];
                return idx !== undefined && idx < fila.length ? fila[idx] : '';
            };

            const codigoRaw = getVal('codigo');
            const codigo = limpiarValor(codigoRaw).toUpperCase();
            if (!codigo) continue;

            if (codigosProcesados.has(codigo)) {
                console.warn(`[CuponesService] Código duplicado omitido: "${codigo}" en fila ${i + 1}`);
                continue;
            }

            const tipo = limpiarValor(getVal('tipo')).toLowerCase();
            if (tipo !== 'porcentaje' && tipo !== 'monto_fijo') {
                console.warn(`[CuponesService] Cupón "${codigo}" omitido por tipo no permitido: "${tipo}"`);
                continue;
            }

            const valor = normalizarNumero(getVal('valor'), null);
            if (valor === null || valor <= 0) {
                console.warn(`[CuponesService] Cupón "${codigo}" omitido por valor inválido: ${getVal('valor')}`);
                continue;
            }

            if (tipo === 'porcentaje' && valor > 100) {
                console.warn(`[CuponesService] Cupón "${codigo}" omitido por porcentaje mayor a 100%: ${valor}`);
                continue;
            }

            const alcance = limpiarValor(getVal('alcance')).toLowerCase();
            if (alcance !== 'todos' && alcance !== 'categorias' && alcance !== 'productos') {
                console.warn(`[CuponesService] Cupón "${codigo}" omitido por alcance no permitido: "${alcance}"`);
                continue;
            }

            const montoMinimo = normalizarNumero(getVal('monto_minimo'), 0);
            const descuentoMaximo = normalizarNumero(getVal('descuento_maximo'), null);
            const fechaInicio = normalizarFecha(getVal('fecha_inicio'));
            const fechaVencimiento = normalizarFecha(getVal('fecha_vencimiento'));
            const activo = normalizarBooleano(getVal('activo'));
            const categoriasPermitidas = normalizarListaPipe(getVal('categorias_permitidas'));
            const productosPermitidos = normalizarListaPipe(getVal('productos_permitidos'));
            const descripcion = limpiarValor(getVal('descripcion'));
            const orden = normalizarNumero(getVal('orden'), 999);

            codigosProcesados.add(codigo);
            cupones.push({
                codigo,
                tipo,
                valor,
                montoMinimo: montoMinimo < 0 ? 0 : montoMinimo,
                descuentoMaximo: (descuentoMaximo !== null && descuentoMaximo > 0) ? descuentoMaximo : null,
                fechaInicio,
                fechaVencimiento,
                activo,
                alcance,
                categoriasPermitidas,
                productosPermitidos,
                descripcion,
                orden: Math.round(orden)
            });
        }

        cupones.sort((a, b) => a.orden - b.orden);
        return cupones;
    }

    /**
     * Consulta la hoja de Google Sheets y retorna la lista normalizada de cupones
     */
    async function cargarCupones() {
        if (cuponesCache !== null) {
            return cuponesCache;
        }

        if (promesaCarga !== null) {
            return promesaCarga;
        }

        promesaCarga = (async () => {
            const urlConfig = (typeof CONFIG_CUPONES !== 'undefined' && CONFIG_CUPONES.sheetsCsvUrl)
                ? CONFIG_CUPONES.sheetsCsvUrl
                : ((typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_SHEETS_CUPONES_CSV_URL)
                    ? CONFIG.GOOGLE_SHEETS_CUPONES_CSV_URL
                    : "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=716279816&single=true&output=csv");

            const timeoutMs = (typeof CONFIG_CUPONES !== 'undefined' && CONFIG_CUPONES.timeoutMs)
                ? CONFIG_CUPONES.timeoutMs
                : 8000;

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const resp = await fetch(urlConfig, {
                    signal: controller.signal,
                    cache: 'no-cache'
                });
                clearTimeout(timer);

                if (!resp.ok) {
                    throw new Error(`Respuesta HTTP con error: ${resp.status} ${resp.statusText}`);
                }

                const csvText = await resp.text();
                cuponesCache = procesarCSVCupones(csvText);
                return cuponesCache;
            } catch (err) {
                clearTimeout(timer);
                console.error('[CuponesService] Fallo al consultar cupones desde Google Sheets:', err.message || err);
                cuponesCache = [];
                return [];
            } finally {
                promesaCarga = null;
            }
        })();

        return promesaCarga;
    }

    /**
     * Retorna los cupones cargados en memoria o realiza la carga si no están disponibles
     */
    async function obtenerCupones() {
        if (cuponesCache !== null) {
            return cuponesCache;
        }
        return await cargarCupones();
    }

    /**
     * Busca un cupón normalizado por su código (sin validar montos ni fechas todavía)
     * @param {string} codigo 
     */
    async function buscarCuponPorCodigo(codigo) {
        if (!codigo || typeof codigo !== 'string') return null;
        const codigoLimpio = codigo.trim().toUpperCase();
        const lista = await obtenerCupones();
        return lista.find(c => c.codigo === codigoLimpio) || null;
    }

    /**
     * Limpia la caché en memoria para forzar una nueva consulta
     */
    function limpiarCache() {
        cuponesCache = null;
        promesaCarga = null;
    }

    return {
        cargarCupones,
        obtenerCupones,
        buscarCuponPorCodigo,
        limpiarCache
    };
})();

window.cuponesService = CuponesService;
