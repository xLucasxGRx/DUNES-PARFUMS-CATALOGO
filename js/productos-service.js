/**
 * Dunes Parfums - Servicio de Carga de Productos
 * Centraliza la carga y normalización de productos desde Google Sheets (CSV)
 * con fallback automático al archivo JSON local en caso de error.
 */

const ProductosService = (function() {
    // Parser CSV robusto que soporta comillas, comas internas, saltos de línea y comillas escapadas
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
                        i++; // Saltar la siguiente comilla
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
                        i++; // Saltar LF si es CRLF
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
        return String(valor ?? "")
            .replace(/^\uFEFF/, "")
            .trim()
            .replace(/^['’]+/, "")
            .trim();
    }

    function normalizarCabecera(cabecera) {
        return limpiarValorImportado(cabecera)
            .toLowerCase()
            .replace(/[\r\n]+/g, "")
            .replace(/\s+/g, "_");
    }

    function normalizarNumero(valor, respaldo = null) {
        if (valor === undefined || valor === null) return respaldo;
        const limpio = limpiarValorImportado(valor).replace(",", ".");
        if (limpio === '') return respaldo;
        const numero = Number(limpio);
        return Number.isFinite(numero) ? numero : respaldo;
    }

    function parseNumber(val) {
        return normalizarNumero(val, null);
    }

    function normalizarBooleano(valor) {
        if (valor === true) return true;
        if (valor === false) return false;
        const limpio = limpiarValorImportado(valor).toLowerCase();
        if (["true", "1", "si", "sí", "yes", "verdadero"].includes(limpio)) return true;
        if (["false", "0", "no", "falso"].includes(limpio)) return false;
        return false;
    }

    function parseBoolean(val) {
        return normalizarBooleano(val);
    }

    function normalizarGenero(valor) {
        if (valor === undefined || valor === null) return 'sin_clasificar';
        const str = limpiarValorImportado(valor)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (['hombre', 'masculino', 'varon', 'man', 'men'].includes(str)) return 'hombre';
        if (['mujer', 'femenino', 'dama', 'woman', 'women'].includes(str)) return 'mujer';
        if (['unisex', 'ambos', 'universal'].includes(str)) return 'unisex';
        return 'sin_clasificar';
    }

    function getTipoFromCategoria(cat) {
        const c = limpiarValorImportado(cat).toLowerCase();
        if (c === 'arabe') return 'ARABE';
        if (c === 'disenador') return 'DISENADOR';
        if (c === 'nicho') return 'NICHO';
        return 'ARABE'; // Default fallback
    }

    function normalizarImagenNotas(valor) {
        if (valor === undefined || valor === null) return '';
        const limpio = limpiarValorImportado(valor);
        if (!limpio) return '';
        try {
            const u = new URL(limpio);
            if (u.protocol === 'https:') {
                return limpio;
            }
        } catch (e) {
            return '';
        }
        return '';
    }

    async function cargarDesdeRespaldo(errorGoogleSheets = null) {
        const fallbackUrl = (typeof CONFIG !== 'undefined' && CONFIG.PRODUCTOS_RESPALDO_URL)
            ? CONFIG.PRODUCTOS_RESPALDO_URL
            : "data/productos.json";
        
        try {
            let data;
            if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
                const fs = require('fs');
                const path = require('path');
                const filePath = path.resolve(process.cwd(), fallbackUrl);
                const content = fs.readFileSync(filePath, 'utf8');
                data = JSON.parse(content);
            } else {
                const response = await fetch(fallbackUrl);
                if (!response.ok) {
                    throw new Error(`Error HTTP al cargar el respaldo! status: ${response.status}`);
                }
                data = await response.json();
            }

            // Normalizar categorías, booleanos y género del respaldo
            const dataNormalizada = data.map(p => {
                if (p.categoria === 'sellados' || p.categoria !== 'decants') {
                    let cat = 'arabe';
                    if (p.tipo) {
                        const t = String(p.tipo).trim().toLowerCase();
                        if (t === 'arabe') cat = 'arabe';
                        else if (t === 'disenador' || t === 'diseñador') cat = 'disenador';
                        else if (t === 'nicho') cat = 'nicho';
                    }
                    p.categoria = cat;
                }
                p.visible = parseBoolean(p.visible);
                p.disponible = parseBoolean(p.disponible);
                p.destacado = parseBoolean(p.destacado);
                p.oferta = parseBoolean(p.oferta);
                const precioOfertaVal = parseNumber(p.precio_oferta ?? p.precioOferta);
                p.precio_oferta = precioOfertaVal;
                p.precioOferta = precioOfertaVal;
                p.genero = normalizarGenero(p.genero);
                p.imagen_notas = normalizarImagenNotas(p.imagen_notas ?? p.imagenNotas);
                return p;
            });

            if (errorGoogleSheets) {
                console.warn(`[ProductosService] Falló Google Sheets (${errorGoogleSheets.message}). Usando respaldo local: ${fallbackUrl}`);
            } else {
                console.log(`[ProductosService] Productos cargados desde respaldo local: ${fallbackUrl}`);
            }

            return {
                productos: dataNormalizada,
                origen: "json-respaldo"
            };
        } catch (errorFallback) {
            console.error("[ProductosService] Error al cargar desde Google Sheets:", errorGoogleSheets ? errorGoogleSheets.message : 'N/A');
            console.error("[ProductosService] Error crítico: Falló también el respaldo local:", errorFallback.message);
            throw new Error(`Error fatal en ProductosService: GS (${errorGoogleSheets ? errorGoogleSheets.message : 'N/A'}), JSON (${errorFallback.message})`);
        }
    }

    async function cargarProductos() {
        if (typeof CONFIG === 'undefined' || !CONFIG.GOOGLE_SHEETS_CSV_URL) {
            return await cargarDesdeRespaldo(new Error("CONFIG.GOOGLE_SHEETS_CSV_URL no está configurado"));
        }

        try {
            // Evitar caché de fetch usando timestamp
            const urlConTimestamp = CONFIG.GOOGLE_SHEETS_CSV_URL + (CONFIG.GOOGLE_SHEETS_CSV_URL.includes('?') ? '&' : '?') + 'v=' + Date.now();
            const response = await fetch(urlConTimestamp, { cache: "no-store" });
            
            if (!response.ok) {
                throw new Error(`Respuesta HTTP con error: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            if (!text || text.trim() === '' || text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
                throw new Error("Formato de respuesta inválido o vacío de Google Sheets (posiblemente HTML de error).");
            }

            const rows = parseCSV(text);
            if (rows.length < 2) {
                throw new Error("El CSV de Google Sheets no contiene datos suficientes.");
            }

            const headers = rows[0].map(normalizarCabecera);
            const requiredHeaders = ['id', 'nombre', 'marca', 'categoria', 'formato', 'imagen', 'visible'];
            const hasRequiredHeaders = requiredHeaders.every(req => headers.includes(req));
            if (!hasRequiredHeaders) {
                throw new Error(`El CSV no contiene los encabezados mínimos requeridos (${requiredHeaders.join(', ')}).`);
            }

            const listado = [];
            const idsVistos = new Set();
            const filasTotales = rows.length - 1;
            let filasDescartadas = 0;

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0 || (row.length === 1 && row[0] === '')) {
                    filasDescartadas++;
                    continue; // Ignorar filas vacías al final o intermedias
                }

                try {
                    const rawObj = {};
                    headers.forEach((header, index) => {
                        rawObj[header] = row[index] !== undefined ? row[index] : "";
                    });

                    // Validaciones básicas de campos mínimos
                    const idStr = rawObj.id ? String(rawObj.id).trim() : "";
                    if (!idStr) {
                        console.warn(`[ProductosService] Fila ${i + 1} descartada: ID de producto vacío.`);
                        filasDescartadas++;
                        continue;
                    }

                    if (idsVistos.has(idStr)) {
                        console.warn(`[ProductosService] Fila ${i + 1} descartada: ID duplicado (${idStr}).`);
                        filasDescartadas++;
                        continue;
                    }

                    const nombre = rawObj.nombre ? rawObj.nombre.trim() : "";
                    const marca = rawObj.marca ? rawObj.marca.trim() : "";
                    const imagen = rawObj.imagen ? rawObj.imagen.trim() : "";
                    const visible = parseBoolean(rawObj.visible);

                    if (!nombre || !marca || !imagen || visible === false) {
                        console.warn(`[ProductosService] Fila ${i + 1} descartada (ID ${idStr}): Datos requeridos vacíos o visible=false.`);
                        filasDescartadas++;
                        continue;
                    }

                    // Validar categoría y formato
                    const categoriaOriginal = rawObj.categoria ? rawObj.categoria.trim().toLowerCase() : "";
                    const formatoOriginal = rawObj.formato ? rawObj.formato.trim().toLowerCase() : "";

                    const categoriasPermitidas = ['arabe', 'disenador', 'nicho', 'decants'];
                    const formatosPermitidos = ['sellado', 'decant'];

                    if (!categoriasPermitidas.includes(categoriaOriginal) || !formatosPermitidos.includes(formatoOriginal)) {
                        console.warn(`[ProductosService] Fila ${i + 1} descartada (ID ${idStr}): Categoría '${categoriaOriginal}' o formato '${formatoOriginal}' inválido.`);
                        filasDescartadas++;
                        continue;
                    }

                    const esDecant = formatoOriginal === 'decant';

                    // Normalización de objeto producto
                    const prod = {
                        id: idStr,
                        nombre: nombre,
                        marca: marca,
                        tipo: getTipoFromCategoria(categoriaOriginal),
                        categoria: categoriaOriginal,
                        genero: normalizarGenero(rawObj.genero),
                        disponible: parseBoolean(rawObj.disponible),
                        visible: visible,
                        imagen: imagen,
                        imagen_notas: normalizarImagenNotas(rawObj.imagen_notas),
                        descripcion: rawObj.descripcion ? limpiarValorImportado(rawObj.descripcion) : '',
                        destacado: parseBoolean(rawObj.destacado),
                        oferta: parseBoolean(rawObj.oferta),
                        precio_oferta: parseNumber(rawObj.precio_oferta),
                        precioOferta: parseNumber(rawObj.precio_oferta),
                        orden: parseNumber(rawObj.orden),
                        ofertaTitulo: rawObj.oferta_titulo ? limpiarValorImportado(rawObj.oferta_titulo) : '',
                        ofertaSubtitulo: rawObj.oferta_subtitulo ? limpiarValorImportado(rawObj.oferta_subtitulo) : '',
                        ofertaTextoStock: rawObj.oferta_texto_stock ? limpiarValorImportado(rawObj.oferta_texto_stock) : '',
                        ofertaVigencia: rawObj.oferta_vigencia ? limpiarValorImportado(rawObj.oferta_vigencia) : '',
                        ofertaTextoBoton: rawObj.oferta_texto_boton ? limpiarValorImportado(rawObj.oferta_texto_boton) : ''
                    };

                    if (esDecant) {
                        // Cargar presentaciones
                        const presentaciones = [];
                        const p3 = parseNumber(rawObj.precio_3ml);
                        if (p3 !== null && p3 > 0) {
                            presentaciones.push({ ml: 3, nombre: "Decant 3 ml", precio: p3, disponible: true });
                        }
                        const p5 = parseNumber(rawObj.precio_5ml);
                        if (p5 !== null && p5 > 0) {
                            presentaciones.push({ ml: 5, nombre: "Decant 5 ml", precio: p5, disponible: true });
                        }
                        const p10 = parseNumber(rawObj.precio_10ml);
                        if (p10 !== null && p10 > 0) {
                            presentaciones.push({ ml: 10, nombre: "Decant 10 ml", precio: p10, disponible: true });
                        }

                        if (presentaciones.length === 0) {
                            console.warn(`[ProductosService] Fila ${i + 1} descartada (ID ${idStr}): Decant sin precios válidos.`);
                            filasDescartadas++;
                            continue;
                        }

                        prod.presentacion = rawObj.presentacion ? rawObj.presentacion.trim() : "Decants de 3, 5 y 10 ml";
                        prod.formato = "Decants de 3, 5 y 10 ml";
                        prod.presentaciones = presentaciones;
                        prod.mililitrosDisponibles = parseNumber(rawObj.mililitros_disponibles) ?? 0;
                    } else {
                        // Validar sellado
                        const precio = parseNumber(rawObj.precio);
                        const stock = parseNumber(rawObj.stock);
                        const presentacion = rawObj.presentacion ? rawObj.presentacion.trim() : "";

                        if (precio === null || precio <= 0 || stock === null || stock < 0 || !presentacion) {
                            console.warn(`[ProductosService] Fila ${i + 1} descartada (ID ${idStr}): Datos inválidos de precio (${precio}), stock (${stock}) o presentación (${presentacion}).`);
                            filasDescartadas++;
                            continue;
                        }

                        prod.precio = precio;
                        prod.stock = stock;
                        prod.presentacion = presentacion;
                        prod.formato = "Sellado";
                    }

                    idsVistos.add(idStr);
                    listado.push(prod);
                } catch (errFila) {
                    console.warn(`[ProductosService] Fila ${i + 1} descartada por excepción inesperada:`, errFila.message);
                    filasDescartadas++;
                }
            }

            if (listado.length === 0) {
                throw new Error("No se encontraron productos válidos en el CSV de Google Sheets.");
            }

            // Ordenar por el campo "orden" si está definido
            listado.sort((a, b) => {
                const ordenA = a.orden !== null && a.orden !== undefined ? a.orden : 9999;
                const ordenB = b.orden !== null && b.orden !== undefined ? b.orden : 9999;
                return ordenA - ordenB;
            });

            console.log(`[ProductosService] Éxito: ${listado.length} productos válidos cargados desde Google Sheets (${filasTotales} recibidas, ${filasDescartadas} descartadas).`);
            return {
                productos: listado,
                origen: "google-sheets"
            };

        } catch (error) {
            return await cargarDesdeRespaldo(error);
        }
    }

    return {
        cargarProductos: cargarProductos,
        // Exponer parsers para facilitar pruebas unitarias/scripts
        _parseCSV: parseCSV,
        _parseNumber: parseNumber,
        _parseBoolean: parseBoolean,
        _normalizarGenero: normalizarGenero,
        _normalizarCabecera: normalizarCabecera,
        _normalizarImagenNotas: normalizarImagenNotas
    };
})();
