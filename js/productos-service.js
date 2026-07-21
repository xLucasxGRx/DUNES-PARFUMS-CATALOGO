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

    function normalizarCabecera(cabecera) {
        return String(cabecera ?? "")
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase();
    }

    function parseNumber(val) {
        if (val === undefined || val === null || String(val).trim() === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    }

    function parseBoolean(val) {
        if (val === true) return true;
        if (val === false) return false;
        if (val === undefined || val === null) return false;
        const s = String(val).replace(/^\uFEFF/, "").trim().toLowerCase();
        if (['true', 'verdadero', '1', 'si', 'sí', 'yes'].includes(s)) return true;
        if (['false', 'falso', '0', 'no'].includes(s)) return false;
        return false;
    }

    function getTipoFromCategoria(cat) {
        const c = String(cat).trim().toLowerCase();
        if (c === 'arabe') return 'ARABE';
        if (c === 'disenador') return 'DISENADOR';
        if (c === 'nicho') return 'NICHO';
        return 'ARABE'; // Default fallback
    }

    async function cargarDesdeRespaldo() {
        const fallbackUrl = (typeof CONFIG !== 'undefined' && CONFIG.PRODUCTOS_RESPALDO_URL)
            ? CONFIG.PRODUCTOS_RESPALDO_URL
            : "data/productos.json";
        
        const response = await fetch(fallbackUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP al cargar el respaldo! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Normalizar categorías y booleanos del respaldo
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
            return p;
        });

        console.log("Google Sheets no disponible. Productos cargados desde respaldo local.");
        return {
            productos: dataNormalizada,
            origen: "json-respaldo"
        };
    }

    async function cargarProductos() {
        if (typeof CONFIG === 'undefined' || !CONFIG.GOOGLE_SHEETS_CSV_URL) {
            return await cargarDesdeRespaldo();
        }

        try {
            // Evitar caché de fetch usando timestamp
            const urlConTimestamp = CONFIG.GOOGLE_SHEETS_CSV_URL + (CONFIG.GOOGLE_SHEETS_CSV_URL.includes('?') ? '&' : '?') + 'v=' + Date.now();
            const response = await fetch(urlConTimestamp, { cache: "no-store" });
            
            if (!response.ok) {
                throw new Error(`Error HTTP en Google Sheets! status: ${response.status}`);
            }

            const text = await response.text();
            if (!text || text.trim() === '' || text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
                throw new Error("Formato de respuesta inválido o vacío de Google Sheets (posiblemente HTML de error).");
            }

            const rows = parseCSV(text);
            if (rows.length < 2) {
                throw new Error("El CSV no contiene datos suficientes.");
            }

            const headers = rows[0].map(normalizarCabecera);
            const requiredHeaders = ['id', 'nombre', 'marca', 'categoria', 'formato', 'imagen', 'visible'];
            const hasRequiredHeaders = requiredHeaders.every(req => headers.includes(req));
            if (!hasRequiredHeaders) {
                throw new Error("El CSV no contiene los encabezados mínimos requeridos.");
            }

            const listado = [];
            const idsVistos = new Set();

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0 || (row.length === 1 && row[0] === '')) {
                    continue; // Ignorar filas vacías al final o intermedias
                }

                const rawObj = {};
                headers.forEach((header, index) => {
                    rawObj[header] = row[index] !== undefined ? row[index] : "";
                });

                // Validaciones básicas de campos mínimos
                const idStr = rawObj.id ? String(rawObj.id).trim() : "";
                if (!idStr) {
                    console.warn(`Producto ignorado por ID vacío en la fila ${i + 1}.`);
                    continue;
                }

                if (idsVistos.has(idStr)) {
                    console.warn(`Producto ignorado por ID duplicado: ${idStr}.`);
                    continue;
                }

                const nombre = rawObj.nombre ? rawObj.nombre.trim() : "";
                const marca = rawObj.marca ? rawObj.marca.trim() : "";
                const imagen = rawObj.imagen ? rawObj.imagen.trim() : "";
                const visible = parseBoolean(rawObj.visible);

                if (!nombre || !marca || !imagen || visible === false) {
                    console.warn(`Producto ignorado por datos no visibles o inválidos en la fila ${i + 1}.`);
                    continue;
                }

                // Validar categoría y formato
                const categoriaOriginal = rawObj.categoria ? rawObj.categoria.trim().toLowerCase() : "";
                const formatoOriginal = rawObj.formato ? rawObj.formato.trim().toLowerCase() : "";

                const categoriasPermitidas = ['arabe', 'disenador', 'nicho', 'decants'];
                const formatosPermitidos = ['sellado', 'decant'];

                if (!categoriasPermitidas.includes(categoriaOriginal) || !formatosPermitidos.includes(formatoOriginal)) {
                    console.warn(`Producto ignorado por categoría/formato inválido en la fila ${i + 1}.`);
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
                    disponible: parseBoolean(rawObj.disponible),
                    visible: visible,
                    imagen: imagen,
                    descripcion: rawObj.descripcion ? rawObj.descripcion.trim() : '',
                    destacado: parseBoolean(rawObj.destacado),
                    oferta: parseBoolean(rawObj.oferta),
                    precioAnterior: parseNumber(rawObj.precio_anterior),
                    orden: parseNumber(rawObj.orden)
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
                        console.warn(`Producto ignorado por presentaciones vacías en la fila ${i + 1}.`);
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
                        console.warn(`Producto ignorado por datos inválidos de sellado en la fila ${i + 1}.`);
                        continue;
                    }

                    prod.precio = precio;
                    prod.stock = stock;
                    prod.presentacion = presentacion;
                    prod.formato = "Sellado";
                }

                idsVistos.add(idStr);
                listado.push(prod);
            }

            if (listado.length === 0) {
                throw new Error("No se encontraron productos válidos en el CSV.");
            }

            // Ordenar por el campo "orden" si está definido
            listado.sort((a, b) => {
                const ordenA = a.orden !== null && a.orden !== undefined ? a.orden : 9999;
                const ordenB = b.orden !== null && b.orden !== undefined ? b.orden : 9999;
                return ordenA - ordenB;
            });

            console.log("Productos cargados desde Google Sheets.");
            return {
                productos: listado,
                origen: "google-sheets"
            };

        } catch (error) {
            console.error("Error al cargar desde Google Sheets (usando respaldo):", error.message);
            return await cargarDesdeRespaldo();
        }
    }

    return {
        cargarProductos: cargarProductos,
        // Exponer parsers para facilitar pruebas unitarias/scripts
        _parseCSV: parseCSV,
        _parseNumber: parseNumber,
        _parseBoolean: parseBoolean
    };
})();
