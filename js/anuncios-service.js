/**
 * Dunes Parfums - Servicio de Carga de Anuncios y Barra Superior
 * FASE M23.2 - Fuente única de datos: Google Sheets.
 * Si todos los anuncios están en FALSE, la hoja no responde o está vacía, retorna un array vacío []
 * para ocultar la barra por completo sin utilizar fallbacks comerciales hardcodeados.
 */

const AnunciosService = (function() {
    let anunciosCache = null;
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

    function limpiarValorImportado(valor) {
        return String(valor ?? '')
            .replace(/^\uFEFF/, '')
            .trim();
    }

    function normalizarCabecera(cabecera) {
        return limpiarValorImportado(cabecera)
            .toLowerCase()
            .replace(/[\r\n]+/g, '')
            .replace(/\s+/g, '_');
    }

    function normalizarBooleano(valor) {
        if (valor === true) return true;
        if (valor === false) return false;
        const limpio = limpiarValorImportado(valor).toLowerCase();
        return ['true', '1', 'si', 'sí', 'yes', 'verdadero'].includes(limpio);
    }

    function normalizarNumero(valor, respaldo = 9999) {
        if (valor === undefined || valor === null) return respaldo;
        const limpio = limpiarValorImportado(valor).replace(',', '.');
        if (limpio === '') return respaldo;
        const numero = Number(limpio);
        return Number.isFinite(numero) ? numero : respaldo;
    }

    function procesarCSVAnuncios(csvText) {
        const rows = parseCSV(csvText);
        if (rows.length < 1) {
            return [];
        }

        const headers = rows[0].map(normalizarCabecera);
        const hasRequired = headers.includes('texto') || headers.includes('anuncio') || headers.includes('mensaje');
        if (!hasRequired) {
            console.warn('[AnunciosService] Encabezados requeridos (texto/anuncio) no encontrados.');
            return [];
        }

        if (rows.length < 2) {
            return [];
        }

        const lista = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

            const rawObj = {};
            headers.forEach((h, idx) => {
                rawObj[h] = row[idx] !== undefined ? row[idx] : '';
            });

            const textoRaw = rawObj.texto || rawObj.anuncio || rawObj.mensaje || '';
            const texto = limpiarValorImportado(textoRaw);
            if (!texto) continue;

            const activoRaw = rawObj.activo !== undefined ? rawObj.activo : false;
            const activo = normalizarBooleano(activoRaw);
            if (!activo) continue;

            const orden = normalizarNumero(rawObj.orden, i);

            lista.push({
                activo: true,
                texto: texto,
                orden: orden
            });
        }

        lista.sort((a, b) => a.orden - b.orden);
        return lista;
    }

    async function cargarAnuncios() {
        if (anunciosCache !== null) {
            return anunciosCache;
        }

        if (promesaCarga) {
            return promesaCarga;
        }

        promesaCarga = (async () => {
            const url = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_SHEETS_ANUNCIOS_CSV_URL)
                ? CONFIG.GOOGLE_SHEETS_ANUNCIOS_CSV_URL
                : (typeof CONFIG_ANUNCIOS !== 'undefined' && CONFIG_ANUNCIOS.sheetsCsvUrl)
                    ? CONFIG_ANUNCIOS.sheetsCsvUrl
                    : '';

            if (!url) {
                anunciosCache = [];
                return anunciosCache;
            }

            try {
                const urlConTimestamp = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
                const response = await fetch(urlConTimestamp, { cache: "no-store", redirect: "follow" });

                if (!response.ok) {
                    throw new Error(`Respuesta HTTP ${response.status} en Google Sheets Anuncios`);
                }

                const text = await response.text();
                if (!text || text.trim() === '' || text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
                    throw new Error("Respuesta de redirección HTML o vacía de Google Sheets Anuncios");
                }

                const resultado = procesarCSVAnuncios(text);
                anunciosCache = resultado;
                return anunciosCache;
            } catch (err) {
                console.warn('[AnunciosService] No se pudieron cargar anuncios desde Google Sheets:', err.message);
                anunciosCache = [];
                return anunciosCache;
            } finally {
                promesaCarga = null;
            }
        })();

        return promesaCarga;
    }

    function limpiarCache() {
        anunciosCache = null;
        promesaCarga = null;
    }

    const serviceObj = {
        cargarAnuncios: cargarAnuncios,
        limpiarCache: limpiarCache,
        _parseCSV: parseCSV,
        _procesarCSVAnuncios: procesarCSVAnuncios,
        _normalizarBooleano: normalizarBooleano,
        _normalizarNumero: normalizarNumero
    };

    if (typeof window !== 'undefined') {
        window.AnunciosService = serviceObj;
    }
    if (typeof global !== 'undefined') {
        global.AnunciosService = serviceObj;
    }

    return serviceObj;
})();
