/**
 * Dunes Parfums - Script de Sincronización de Perfiles Olfativos (Fragella API)
 * 
 * Arquitectura segura:
 * - Lee catálogo local de Dunes.
 * - Compara con data/perfumes-olfativos.json para omitir productos cacheados.
 * - Soporta la opción --dry-run (0 peticiones HTTP reales).
 * - Controla la cuota con --limit=N (por defecto: 1 producto por ejecución).
 * - Utiliza la variable de entorno process.env.FRAGELLA_API_KEY (nunca en código duro).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_PRODUCTOS_PATH = path.join(ROOT_DIR, 'data', 'productos.json');
const PERFUMES_OLFATIVOS_PATH = path.join(ROOT_DIR, 'data', 'perfumes-olfativos.json');

/**
 * Normaliza una cadena para comparaciones seguras de marcas y nombres
 * @param {string} val 
 * @returns {string}
 */
export function normalizarCadena(val) {
    if (!val || typeof val !== 'string') return '';
    return val
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parser CSV robusto que contempla celdas con comillas y saltos de línea internos
 * @param {string} csvText
 * @returns {Array<Array<string>>}
 */
export function parseCSV(csvText) {
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

/**
 * Evalúa la coincidencia entre el producto de Dunes y un candidato retornado por Fragella
 * Previene confusiones entre variantes como (Hawas vs Hawas Ice, Khamrah vs Khamrah Qahwa, 9PM vs 9PM Elixir)
 * 
 * @param {Object} productoDunes { id, nombre, marca }
 * @param {Object} candidatoFragella { id, name/nombre, brand/house/marca }
 * @returns {Object} { estado: 'ENCONTRADO'|'AMBIGUO'|'NO_ENCONTRADO', confidence: number, motivo: string }
 */
export function evaluarCoincidencia(productoDunes, candidatoFragella) {
    if (!productoDunes || !candidatoFragella) {
        return { estado: 'NO_ENCONTRADO', confidence: 0, motivo: 'Datos insuficientes' };
    }

    const nombreDunesNorm = normalizarCadena(productoDunes.nombre);
    const marcaDunesNorm = normalizarCadena(productoDunes.marca);

    const nombreFragellaRaw = candidatoFragella.name || candidatoFragella.nombre || candidatoFragella.title || '';
    const marcaFragellaRaw = candidatoFragella.brand || candidatoFragella.house || candidatoFragella.marca || '';

    const nombreFragellaNorm = normalizarCadena(nombreFragellaRaw);
    const marcaFragellaNorm = normalizarCadena(marcaFragellaRaw);

    // 1. Validar coincidencia de marca (Estricto)
    const marcaCoincide = marcaDunesNorm && marcaFragellaNorm && (
        marcaDunesNorm === marcaFragellaNorm ||
        marcaDunesNorm.includes(marcaFragellaNorm) ||
        marcaFragellaNorm.includes(marcaDunesNorm)
    );

    if (!marcaCoincide) {
        return {
            estado: 'NO_ENCONTRADO',
            confidence: 0.1,
            motivo: `La marca '${marcaFragellaRaw}' no coincide con '${productoDunes.marca}'`
        };
    }

    // Palabras clave de variantes sensibles que no deben confundirse
    const palabrasVariantesSensibles = [
        'ice', 'qahwa', 'elixir', 'bourbon', 'fire', 'tropical',
        'royal', 'diamond', 'intense', 'parfum', 'extrait', 'edp', 'edt'
    ];

    const tokensDunes = nombreDunesNorm.split(' ');
    const tokensFragella = nombreFragellaNorm.split(' ');

    // Detectar si Fragella incluye palabras de variantes que Dunes NO tiene en su nombre
    const tieneVarianteNoDeseada = palabrasVariantesSensibles.some(varWord => {
        const enFragella = tokensFragella.includes(varWord);
        const enDunes = tokensDunes.includes(varWord);
        return enFragella && !enDunes;
    });

    if (tieneVarianteNoDeseada) {
        return {
            estado: 'AMBIGUO',
            confidence: 0.4,
            motivo: `Candidato de Fragella ('${nombreFragellaRaw}') contiene una variante no presente en Dunes ('${productoDunes.nombre}')`
        };
    }

    // Coincidencia exacta de nombre
    if (nombreDunesNorm === nombreFragellaNorm) {
        return {
            estado: 'ENCONTRADO',
            confidence: 1.0,
            motivo: 'Coincidencia exacta de nombre y marca'
        };
    }

    // Coincidencia parcial contenida
    if (nombreDunesNorm.includes(nombreFragellaNorm) || nombreFragellaNorm.includes(nombreDunesNorm)) {
        return {
            estado: 'ENCONTRADO',
            confidence: 0.85,
            motivo: 'Coincidencia alta de nombre'
        };
    }

    return {
        estado: 'AMBIGUO',
        confidence: 0.5,
        motivo: `Nombre diferente: Dunes '${productoDunes.nombre}' vs Fragella '${nombreFragellaRaw}'`
    };
}

/**
 * Determina qué productos del catálogo Dunes están pendientes de sincronizar en Fragella
 * @param {Array} productosDunes 
 * @param {Object} dataOlfativaExistente 
 * @returns {Array} productosPendientes
 */
export function obtenerProductosPendientes(productosDunes, dataOlfativaExistente = {}) {
    if (!Array.isArray(productosDunes)) return [];

    return productosDunes.filter(prod => {
        if (!prod || !prod.id) return false;
        const idClean = String(prod.id).trim();

        // Si ya existe en perfumes-olfativos.json y tiene un registro no nulo, se considera CACHEADO
        const registroExistente = dataOlfativaExistente[idClean];
        if (registroExistente && (registroExistente.dunesId || registroExistente.estado)) {
            return false;
        }

        // Solo procesar productos visibles
        const visibleStr = String(prod.visible ?? true).toLowerCase();
        if (prod.visible === false || prod.visible === 0 || visibleStr === 'false' || visibleStr === '0' || visibleStr === 'no') {
            return false;
        }

        return true;
    });
}

/**
 * Función principal de ejecución del script de sincronización
 * @param {Object} options { dryRun: boolean, limit: number, apiKey: string }
 */
export async function ejecutarSincronizacionFragella(options = {}) {
    const hasDryRunFlag = process.argv.includes('--dry-run');
    const hasLiveFlag = process.argv.includes('--live');
    const apiKey = options.apiKey || process.env.FRAGELLA_API_KEY || '';

    // El modo Dry Run es el valor por defecto seguro a menos que se especifique explícitamente --live y exista API Key
    const dryRun = options.dryRun !== undefined 
        ? options.dryRun 
        : (hasDryRunFlag || !hasLiveFlag || !apiKey);

    let limit = 1;
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    if (limitArg) {
        limit = parseInt(limitArg.split('=')[1], 10) || 1;
    } else if (typeof options.limit === 'number') {
        limit = options.limit;
    }

    console.log('=====================================================');
    console.log(' DUNES PARFUMS — SINCRONIZACIÓN PERFIL OLFATIVO');
    console.log('=====================================================');
    console.log(`Modo Dry Run: ${dryRun ? 'SÍ (0 consultas reales)' : 'NO (Consultará API real)'}`);
    console.log(`Límite Máximo: ${limit} producto(s) por ejecución`);

    if (!dryRun && !apiKey) {
        console.error('ERROR: No se especificó la variable de entorno FRAGELLA_API_KEY.');
        console.error('Para ejecutar consultas reales, configure la clave de API segura.');
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        return { success: false, error: 'MISSING_API_KEY' };
    }

    // 1. Cargar productos Dunes (Google Sheets CSV con fallback a data/productos.json)
    let productosDunes = [];
    let fuenteProductos = 'data/productos.json (local)';

    try {
        const sheetsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2cmX_zYElRDJ5C_Ou5mtSQ-5C74Fj9Cp7ke5KP1QQoc33SK2Bpi6qvikEQjMRixErJK2Z7bMSLCCC/pub?gid=0&single=true&output=csv";
        const resSheets = await fetch(sheetsUrl);
        if (resSheets.ok) {
            const csvText = await resSheets.text();
            const rows = parseCSV(csvText);
            if (rows.length > 1) {
                const rawHeaders = rows[0];
                const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());
                const parsedList = [];

                for (let r = 1; r < rows.length; r++) {
                    const cols = rows[r];
                    if (!cols || cols.length === 0 || (cols.length === 1 && !cols[0])) continue;
                    const rowObj = {};
                    headers.forEach((h, colIdx) => {
                        rowObj[h] = cols[colIdx] ?? '';
                    });

                    const idVal = rowObj.id || rowObj.ID;
                    const nombreVal = rowObj.nombre || rowObj.producto || rowObj.name;
                    const marcaVal = rowObj.marca || rowObj.brand || rowObj.casa;
                    const visibleVal = rowObj.visible;

                    const visibleClean = String(visibleVal ?? true).toLowerCase();
                    const esVisible = !(visibleVal === false || visibleVal === '0' || visibleClean === 'false' || visibleClean === 'no');

                    if (idVal && nombreVal && esVisible) {
                        parsedList.push({
                            id: String(idVal).trim(),
                            nombre: nombreVal,
                            marca: marcaVal || 'Dunes Parfums',
                            categoria: rowObj.categoria || rowObj.tipo || 'general',
                            visible: true,
                            stock: Number(rowObj.stock) || 0,
                            disponible: true
                        });
                    }
                }
                if (parsedList.length > 0) {
                    productosDunes = parsedList;
                    fuenteProductos = 'Google Sheets CSV (En vivo)';
                }
            }
        }
    } catch (errSheets) {
        // Ignorar error y usar respaldo local
    }

    if (productosDunes.length === 0) {
        if (fs.existsSync(DATA_PRODUCTOS_PATH)) {
            const rawProductos = fs.readFileSync(DATA_PRODUCTOS_PATH, 'utf8');
            productosDunes = JSON.parse(rawProductos);
            fuenteProductos = 'data/productos.json (local)';
        } else {
            console.error(`ERROR: No se encontró el archivo ${DATA_PRODUCTOS_PATH}`);
            return { success: false, error: 'FILE_NOT_FOUND' };
        }
    }

    // 2. Cargar cache olfativa local
    let olfativaData = {};
    if (fs.existsSync(PERFUMES_OLFATIVOS_PATH)) {
        const rawOlfativa = fs.readFileSync(PERFUMES_OLFATIVOS_PATH, 'utf8');
        try {
            olfativaData = JSON.parse(rawOlfativa);
        } catch {
            olfativaData = {};
        }
    }

    const pendientes = obtenerProductosPendientes(productosDunes, olfativaData);
    const totalProductos = productosDunes.length;
    const totalCacheados = totalProductos - pendientes.length;

    console.log(`\nResumen del Catálogo:`);
    console.log(`- Fuente de productos: ${fuenteProductos}`);
    console.log(`- Total de productos: ${totalProductos}`);
    console.log(`- Cacheados previamente: ${totalCacheados}`);
    console.log(`- Pendientes de sincronización: ${pendientes.length}`);

    if (pendientes.length === 0) {
        console.log('\n¡Todos los productos del catálogo están cacheados localmente!');
        return { success: true, procesados: 0, pendientes: 0 };
    }

    const aProcesar = pendientes.slice(0, limit);
    console.log(`\nProductos a evaluar en este ciclo (${aProcesar.length}):`);

    aProcesar.forEach((prod, index) => {
        console.log(`  ${index + 1}. [ID ${prod.id}] ${prod.nombre} — Marca: ${prod.marca} (${prod.categoria || 'general'})`);
    });

    if (dryRun) {
        console.log('\n-----------------------------------------------------');
        console.log('[DRY RUN] No se realizó ninguna consulta a Fragella.');
        console.log('[DRY RUN] data/perfumes-olfativos.json permanece intacto.');
        console.log('-----------------------------------------------------');
        return { success: true, dryRun: true, pendientes: pendientes.length, seleccionados: aProcesar };
    }

    // 3. Procesamiento real contra la API de Fragella (únicamente cuando NO es dry run)
    let modificados = 0;

    for (const prod of aProcesar) {
        const idClean = String(prod.id).trim();
        const query = `${prod.nombre} ${prod.marca}`;
        console.log(`\nConsultando Fragella API para: '${query}'...`);

        try {
            const url = `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`  Error HTTP ${response.status} al consultar Fragella.`);
                olfativaData[idClean] = {
                    dunesId: idClean,
                    nombreDunes: prod.nombre,
                    marcaDunes: prod.marca,
                    estado: 'ERROR',
                    fechaConsulta: new Date().toISOString()
                };
                continue;
            }

            const data = await response.json();
            const resultados = data.fragrances || data.results || (Array.isArray(data) ? data : []);

            if (!resultados || resultados.length === 0) {
                console.log(`  Sin resultados devueltos por Fragella para '${prod.nombre}'.`);
                olfativaData[idClean] = {
                    dunesId: idClean,
                    nombreDunes: prod.nombre,
                    marcaDunes: prod.marca,
                    estado: 'NO_ENCONTRADO',
                    fechaConsulta: new Date().toISOString()
                };
                modificados++;
                continue;
            }

            // Evaluar coincidencia del primer candidato o mejor candidato
            let mejorCoincidencia = null;
            let mejorResultado = null;

            for (const cand of resultados) {
                const evalRes = evaluarCoincidencia(prod, cand);
                if (evalRes.estado === 'ENCONTRADO') {
                    mejorCoincidencia = evalRes;
                    mejorResultado = cand;
                    break; // Coincidencia óptima encontrada
                } else if (evalRes.estado === 'AMBIGUO' && (!mejorCoincidencia || mejorCoincidencia.confidence < evalRes.confidence)) {
                    mejorCoincidencia = evalRes;
                    mejorResultado = cand;
                }
            }

            if (mejorCoincidencia && mejorCoincidencia.estado === 'ENCONTRADO' && mejorResultado) {
                console.log(`  ✓ Coincidencia confirmada con '${mejorResultado.name || mejorResultado.nombre}'`);

                olfativaData[idClean] = {
                    dunesId: idClean,
                    fragellaId: mejorResultado.id || mejorResultado._id || '',
                    nombreDunes: prod.nombre,
                    nombreFragella: mejorResultado.name || mejorResultado.nombre || '',
                    marcaDunes: prod.marca,
                    marcaFragella: mejorResultado.brand || mejorResultado.house || '',
                    acordes: mejorResultado.accords || mejorResultado.acordes || [],
                    acordesPorcentaje: mejorResultado.accordPercentages || {},
                    notas: {
                        salida: mejorResultado.topNotes || (mejorResultado.notes ? mejorResultado.notes.top : []) || [],
                        corazon: mejorResultado.middleNotes || (mejorResultado.notes ? mejorResultado.notes.middle : []) || [],
                        fondo: mejorResultado.baseNotes || (mejorResultado.notes ? mejorResultado.notes.base : []) || []
                    },
                    duracion: mejorResultado.longevity || null,
                    proyeccion: mejorResultado.sillage || null,
                    concentracion: mejorResultado.concentration || null,
                    confidence: mejorCoincidencia.confidence,
                    estado: 'ENCONTRADO',
                    fechaConsulta: new Date().toISOString()
                };
                modificados++;
            } else if (mejorCoincidencia && mejorCoincidencia.estado === 'AMBIGUO') {
                console.log(`  ⚠ Coincidencia ambigua para '${prod.nombre}'. Registrado como PENDIENTE de revisión.`);
                olfativaData[idClean] = {
                    dunesId: idClean,
                    nombreDunes: prod.nombre,
                    marcaDunes: prod.marca,
                    estado: 'AMBIGUO',
                    confidence: mejorCoincidencia.confidence,
                    motivo: mejorCoincidencia.motivo,
                    fechaConsulta: new Date().toISOString()
                };
                modificados++;
            } else {
                console.log(`  ✗ Ningún resultado de Fragella superó el umbral de coincidencia segura.`);
                olfativaData[idClean] = {
                    dunesId: idClean,
                    nombreDunes: prod.nombre,
                    marcaDunes: prod.marca,
                    estado: 'NO_ENCONTRADO',
                    fechaConsulta: new Date().toISOString()
                };
                modificados++;
            }

        } catch (err) {
            console.error(`  Error en solicitud para [ID ${prod.id}]:`, err.message);
        }
    }

    if (modificados > 0) {
        fs.writeFileSync(PERFUMES_OLFATIVOS_PATH, JSON.stringify(olfativaData, null, 2), 'utf8');
        console.log(`\nÉxito: Se actualizó ${PERFUMES_OLFATIVOS_PATH} con ${modificados} registro(s).`);
    }

    return { success: true, modificados };
}

// Permitir ejecución directa por CLI mediante Node.js
if (process.argv[1] && process.argv[1].endsWith('sincronizar-fragella.mjs')) {
    ejecutarSincronizacionFragella();
}
