/**
 * Dunes Parfums - módulo de catálogo (Diseño Completo Aprobado & Filtro por Género)
 * Maneja los filtros, búsquedas, ordenación y renderizado de la página catalogo.html.
 */

const WHATSAPP_NUMERO = "51986510573";

const COTIZACION_TEXTOS = {
    arabe: {
        sinStockMensaje: "Actualmente no tenemos perfumes árabes disponibles en esta categoría.",
        cotizarTitulo: "¿No encuentras el perfume árabe que buscas?",
        cotizarDescripcion: "Cotízalo con nosotros y te ayudamos a conseguirlo.",
        whatsappTexto: "Hola, visité su catálogo, pero no encontré el perfume árabe que busco.\n\nDeseo cotizar un perfume.\n\nNombre del perfume:\nMarca:\nPresentación:",
        ariaLabel: "Cotizar perfume árabe por WhatsApp",
        botonTexto: "Cotiza aquí tu perfume árabe"
    },
    disenador: {
        sinStockMensaje: "Actualmente no tenemos perfumes de diseñador disponibles.",
        cotizarTitulo: "¿No encuentras el perfume de diseñador que buscas?",
        cotizarDescripcion: "Cotízalo con nosotros y te ayudamos a conseguirlo.",
        whatsappTexto: "Hola, visité su catálogo, pero no encontré el perfume de diseñador que busco.\n\nDeseo cotizar un perfume.\n\nNombre del perfume:\nMarca:\nPresentación:",
        ariaLabel: "Cotizar perfume de diseñador por WhatsApp",
        botonTexto: "Cotiza aquí tu perfume"
    },
    nicho: {
        sinStockMensaje: "Actualmente no tenemos perfumes nicho disponibles.",
        cotizarTitulo: "¿No encuentras el perfume nicho que buscas?",
        cotizarDescripcion: "Cotízalo con nosotros y te ayudamos a conseguirlo.",
        whatsappTexto: "Hola, visité su catálogo, pero no encontré el perfume nicho que busco.\n\nDeseo cotizar un perfume.\n\nNombre del perfume:\nMarca:\nPresentación:",
        ariaLabel: "Cotizar perfume nicho por WhatsApp",
        botonTexto: "Cotiza aquí tu perfume nicho"
    },
    decants: {
        sinStockMensaje: "Actualmente no tenemos decants disponibles.",
        cotizarTitulo: "¿No encuentras la fragancia que buscas en decant?",
        cotizarDescripcion: "Consúltanos y revisamos si podemos prepararla.",
        whatsappTexto: "Hola, visité su catálogo, pero no encontré la fragancia que busco en decant.\n\nDeseo consultar disponibilidad.\n\nNombre del perfume:\nPresentación deseada: 3 ml / 5 ml / 10 ml",
        ariaLabel: "Consultar disponibilidad de decant por WhatsApp",
        botonTexto: "Consultar decant por WhatsApp"
    },
    todos: {
        sinStockMensaje: "Actualmente no tenemos perfumes disponibles en el catálogo.",
        cotizarTitulo: "¿No encuentras el perfume que buscas?",
        cotizarDescripcion: "Cotízalo con nosotros y te ayudamos a conseguirlo.",
        whatsappTexto: "Hola, visité su catálogo, pero no encontré el perfume que busco.\n\nDeseo cotizar un perfume.\n\nNombre del perfume:\nMarca:\nPresentación:",
        ariaLabel: "Cotizar perfume por WhatsApp",
        botonTexto: "Cotiza aquí tu perfume"
    }
};

const CATEGORIA_INFO = {
    todos: {
        titulo: "Nuestro catálogo",
        subtitulo: "Exclusividad",
        descripcion: "Explora todos nuestros perfumes y decants disponibles."
    },
    arabe: {
        titulo: "Perfumes árabes",
        subtitulo: "Colección Árabe",
        descripcion: "Descubre nuestro stock disponible de fragancias árabes."
    },
    disenador: {
        titulo: "Perfumes de diseñador",
        subtitulo: "Grandes Marcas",
        descripcion: "Explora nuestros perfumes de diseñador disponibles."
    },
    nicho: {
        titulo: "Perfumes nicho",
        subtitulo: "Exclusividad de Autor",
        descripcion: "Descubre fragancias nicho seleccionadas."
    },
    decants: {
        titulo: "Decants de 3, 5 y 10 ml",
        subtitulo: "Muestras Selectas",
        descripcion: "Prueba tus fragancias favoritas en presentaciones de 3, 5 y 10 ml."
    }
};

const CATALOG_STORAGE_KEY = 'dunes_catalog_state';
const CATALOG_STATE_TTL = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Guarda el estado actual del catálogo en sessionStorage
 */
function guardarEstadoCatalogo(filtroEstado) {
    if (!filtroEstado) return;
    try {
        const catCompat = filtroEstado.categoria ||
            (filtroEstado.tipo && filtroEstado.tipo !== 'todos'
                ? filtroEstado.tipo
                : (filtroEstado.formato === 'decant' ? 'decants' : 'todos'));
        const payload = {
            categoria: catCompat,
            formato: filtroEstado.formato || (catCompat === 'decants' ? 'decant' : 'todos'),
            tipo: filtroEstado.tipo || (['arabe', 'disenador', 'nicho'].includes(catCompat) ? catCompat : 'todos'),
            genero: filtroEstado.genero || 'todos',
            ocasion: filtroEstado.ocasion || 'todas',
            busqueda: filtroEstado.busqueda || '',
            orden: filtroEstado.orden || 'relevancia',
            soloDisponibles: !!filtroEstado.soloDisponibles,
            scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
            timestamp: Date.now()
        };
        sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        // Tolerancia si sessionStorage está bloqueado o deshabilitado
    }
}

/**
 * Recupera el estado guardado del catálogo desde sessionStorage si no ha expirado
 */
function obtenerEstadoCatalogoGuardado() {
    try {
        const raw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') {
            limpiarEstadoCatalogoGuardado();
            return null;
        }
        if (Date.now() - (data.timestamp || 0) > CATALOG_STATE_TTL) {
            limpiarEstadoCatalogoGuardado();
            return null;
        }
        return data;
    } catch (e) {
        limpiarEstadoCatalogoGuardado();
        return null;
    }
}

/**
 * Elimina la clave de estado guardada del catálogo en sessionStorage
 */
function limpiarEstadoCatalogoGuardado() {
    try {
        sessionStorage.removeItem(CATALOG_STORAGE_KEY);
    } catch (e) {}
}

/**
 * Resuelve el estado inicial combinando la prioridad de la URL y el estado guardado
 */
function resolverEstadoInicial() {
    let hasCatParam = false;
    let hasGenParam = false;
    let hasOcasionParam = false;
    let catParam = null;
    let genParam = null;
    let ocasionParam = null;

    try {
        const params = new URLSearchParams(window.location.search);
        hasCatParam = params.has('categoria');
        hasGenParam = params.has('genero');
        hasOcasionParam = params.has('ocasion');
        catParam = params.get('categoria');
        genParam = params.get('genero');
        ocasionParam = params.get('ocasion');
    } catch (e) {}

    const savedState = obtenerEstadoCatalogoGuardado();

    let finalFormato = 'todos';
    let finalTipo = 'todos';

    if (hasCatParam) {
        if (catParam === 'decants') {
            finalFormato = 'decant';
            finalTipo = 'todos';
        } else if (['arabe', 'disenador', 'nicho'].includes(catParam)) {
            finalTipo = catParam;
            finalFormato = 'todos';
        }
    } else if (savedState) {
        if (['sellado', 'decant'].includes(savedState.formato)) finalFormato = savedState.formato;
        if (['arabe', 'disenador', 'nicho'].includes(savedState.tipo)) finalTipo = savedState.tipo;
        // Compatibilidad retroactiva
        if (savedState.categoria === 'decants') finalFormato = 'decant';
        else if (['arabe', 'disenador', 'nicho'].includes(savedState.categoria)) finalTipo = savedState.categoria;
    }

    const genValidos = ['hombre', 'mujer', 'unisex'];
    let finalGen = 'todos';
    if (hasGenParam) {
        finalGen = genValidos.includes(genParam) ? genParam : 'todos';
    } else if (savedState && genValidos.includes(savedState.genero)) {
        finalGen = savedState.genero;
    }

    const ocasionValidos = ['versatil', 'diario', 'citas', 'noche', 'formal', 'todas'];
    let finalOcasion = 'todas';
    if (hasOcasionParam) {
        finalOcasion = ocasionValidos.includes(ocasionParam) ? ocasionParam : 'todas';
    } else if (savedState && ocasionValidos.includes(savedState.ocasion)) {
        finalOcasion = savedState.ocasion;
    }

    let finalSearch = '';
    let finalOrden = 'relevancia';
    let finalSoloDisp = false;
    let savedScrollY = 0;

    if (savedState) {
        if (typeof savedState.busqueda === 'string') finalSearch = savedState.busqueda;
        if (['relevancia', 'price-asc', 'price-desc', 'default'].includes(savedState.orden)) finalOrden = savedState.orden;
        if (typeof savedState.soloDisponibles === 'boolean') finalSoloDisp = savedState.soloDisponibles;
        if (typeof savedState.scrollY === 'number' && savedState.scrollY > 0) savedScrollY = savedState.scrollY;
    }

    const finalCat = finalTipo !== 'todos' ? finalTipo : (finalFormato === 'decant' ? 'decants' : 'todos');

    return {
        filtroEstado: {
            categoria: finalCat,
            formato: finalFormato,
            tipo: finalTipo,
            genero: finalGen,
            ocasion: finalOcasion,
            busqueda: finalSearch,
            orden: finalOrden,
            soloDisponibles: finalSoloDisp
        },
        savedScrollY: savedScrollY
    };
}

/**
 * Obtiene la cantidad de skeletons según el breakpoint real
 */
function obtenerCantidadSkeletons() {
    const width = (window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0)) || 1024;
    if (width <= 480) return 3;
    if (width <= 768) return 6;
    return 8;
}

/**
 * Muestra las tarjetas skeleton en el grid del catálogo durante la carga
 */
function mostrarSkeletonsCatalogo(grid) {
    if (!grid) return;
    const cantidad = obtenerCantidadSkeletons();
    grid.style.display = 'grid';
    grid.classList.add('is-loading');

    const width = (window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0)) || 1024;
    const isMobile = width <= 768;

    let html = '';
    for (let i = 0; i < cantidad; i++) {
        if (isMobile) {
            html += `
                <div class="product-card-skeleton" aria-hidden="true">
                    <div class="skeleton-info" style="grid-area: info; display: flex; flex-direction: column; gap: 8px;">
                        <div class="skeleton-pulse" style="width: 45%; height: 12px;"></div>
                        <div class="skeleton-pulse" style="width: 85%; height: 18px;"></div>
                        <div class="skeleton-pulse" style="width: 40%; height: 14px;"></div>
                        <div class="skeleton-pulse" style="width: 60%; height: 20px; margin-top: 4px;"></div>
                    </div>
                    <div class="skeleton-image-wrap" style="grid-area: image; width: 105px; height: 110px;">
                        <div class="skeleton-pulse" style="width: 100%; height: 100%; border-radius: 8px;"></div>
                    </div>
                    <div class="skeleton-actions" style="grid-area: actions; display: flex; gap: 8px; margin-top: 4px;">
                        <div class="skeleton-pulse" style="flex: 1; height: 36px; border-radius: 6px;"></div>
                        <div class="skeleton-pulse" style="flex: 1; height: 36px; border-radius: 6px;"></div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="product-card-skeleton" aria-hidden="true">
                    <div class="skeleton-image-wrap" style="width: 100%; height: 270px; padding: 18px; box-sizing: border-box;">
                        <div class="skeleton-pulse" style="width: 100%; height: 100%; border-radius: 12px;"></div>
                    </div>
                    <div class="skeleton-info" style="padding: 18px; display: flex; flex-direction: column; gap: 10px; flex: 1;">
                        <div class="skeleton-pulse" style="width: 40%; height: 14px;"></div>
                        <div class="skeleton-pulse" style="width: 85%; height: 22px;"></div>
                        <div class="skeleton-pulse" style="width: 50%; height: 16px;"></div>
                        <div class="skeleton-pulse" style="width: 65%; height: 24px; margin-top: auto;"></div>
                    </div>
                    <div class="skeleton-actions" style="padding: 0 18px 18px 18px; display: flex; gap: 10px;">
                        <div class="skeleton-pulse" style="flex: 1; height: 42px; border-radius: 8px;"></div>
                        <div class="skeleton-pulse" style="flex: 1; height: 42px; border-radius: 8px;"></div>
                    </div>
                </div>
            `;
        }
    }
    grid.innerHTML = html;

    const counterEl = document.getElementById('results-count');
    if (counterEl) {
        counterEl.textContent = 'Cargando productos...';
    }

    const estadoEl = document.getElementById('estado-catalogo');
    if (estadoEl) {
        estadoEl.style.display = 'none';
    }
}

/**
 * Muestra el estado de error real si fallan todas las fuentes de datos
 */
function mostrarErrorCargaCatalogo(grid, callbackReintentar) {
    if (!grid) return;
    grid.classList.remove('is-loading');
    grid.style.display = 'block';
    grid.innerHTML = `
        <div class="catalog-error-state" style="text-align: center; padding: 36px 20px; background-color: var(--surface-card, #FFFEFC); border: 1px solid var(--catalog-gold-border, #E7D3A5); border-radius: 14px; max-width: 480px; margin: 30px auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);">
            <div style="margin-bottom: 12px; color: #A83232; display: flex; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #171717; margin-bottom: 8px;">
                No fue posible cargar el catálogo en este momento.
            </h3>
            <p style="font-size: 0.88rem; color: #6F6F6F; margin-bottom: 18px;">
                Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <button id="btn-reintentar-catalogo" class="btn btn-primary" style="padding: 10px 24px; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin: 0 auto;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Reintentar
            </button>
        </div>
    `;

    const counterEl = document.getElementById('results-count');
    if (counterEl) counterEl.textContent = '';

    const btn = document.getElementById('btn-reintentar-catalogo');
    if (btn && typeof callbackReintentar === 'function') {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = 'Reintentando...';
            callbackReintentar();
        });
    }
}

/**
 * Función principal para iniciar la carga, mostrar skeletons y resolver la vista final del catálogo
 */
async function iniciarCargaCatalogo(grid) {
    if (!grid) return;
    console.log("[CATALOGO] Inicializando");

    const { filtroEstado, savedScrollY } = resolverEstadoInicial();
    let productos = null;

    try {
        mostrarSkeletonsCatalogo(grid);
        console.log("[CATALOGO] ProductosService iniciado");
        productos = await window.productosModulo.obtenerProductos();
        console.log("[CATALOGO] Productos recibidos:", productos ? productos.length : 0);

        if (!productos || productos.length === 0) {
            mostrarErrorCargaCatalogo(grid, () => {
                iniciarCargaCatalogo(grid);
            });
            return;
        }

        grid.classList.remove('is-loading');
        console.log("[CATALOGO] Loader ocultado");

        sincronizarControlesInterfaz(filtroEstado);
        inicializarFiltrosInterfaz(productos, filtroEstado, grid);

        window.addEventListener('popstate', () => {
            const { filtroEstado: nuevoEstado } = resolverEstadoInicial();
            Object.assign(filtroEstado, nuevoEstado);
            sincronizarControlesInterfaz(filtroEstado);
            filtrarYRenderizar(productos, filtroEstado, grid);
        });

        window.addEventListener('beforeunload', () => {
            guardarEstadoCatalogo(filtroEstado);
        });

        filtrarYRenderizar(productos, filtroEstado, grid);

        if (savedScrollY > 0) {
            const restaurarScroll = () => {
                const maxScroll = Math.max(0, (document.documentElement ? document.documentElement.scrollHeight : 0) - window.innerHeight);
                const targetY = Math.min(savedScrollY, maxScroll);
                if (typeof window.scrollTo === 'function') {
                    window.scrollTo(0, targetY);
                }
            };
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => {
                    requestAnimationFrame(restaurarScroll);
                });
            } else {
                setTimeout(restaurarScroll, 50);
            }
        }
    } catch (error) {
        console.error("[CATALOGO] Error crítico durante la carga inicial:", error);
        mostrarErrorCargaCatalogo(grid, () => {
            iniciarCargaCatalogo(grid);
        });
    } finally {
        grid.classList.remove('is-loading');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('catalogo-productos-grid');
    if (!grid) return;
    iniciarCargaCatalogo(grid);
});

/**
 * Normaliza una cadena removiendo acentos y convirtiendo a minúsculas
 */
function normalizarTextoCat(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Comprueba si el tipo (categoría) de un producto coincide con el filtro activo
 * Soporta prod.tipo ("ARABE", "DISEÑADOR", "NICHO") y prod.categoria ("arabe", "disenador", "nicho")
 */
function coincideTipo(prod, estadoTipo) {
    if (!estadoTipo || estadoTipo === 'todos') return true;

    const tipoFiltro = normalizarTextoCat(estadoTipo);
    const tipoProd = normalizarTextoCat(prod.tipo);
    const catProd = normalizarTextoCat(prod.categoria);

    if (tipoFiltro === 'arabe' || tipoFiltro === 'arabes') {
        return tipoProd.includes('arabe') || catProd.includes('arabe');
    }
    if (tipoFiltro === 'disenador' || tipoFiltro === 'disenadores') {
        return tipoProd.includes('disenador') || catProd.includes('disenador');
    }
    if (tipoFiltro === 'nicho' || tipoFiltro === 'nichos') {
        return tipoProd.includes('nicho') || catProd.includes('nicho');
    }

    return tipoProd === tipoFiltro || catProd === tipoFiltro;
}

/**
 * Comprueba si el formato de un producto coincide con el filtro activo (TODOS / SELLADOS / DECANTS)
 */
function coincideFormato(prod, estadoFormato) {
    if (!estadoFormato || estadoFormato === 'todos') return true;

    const catNorm = normalizarTextoCat(prod.categoria);
    const formNorm = normalizarTextoCat(prod.formato);
    const esDecant = catNorm.includes('decant') || formNorm.includes('decant');

    if (estadoFormato === 'sellado' || estadoFormato === 'sellados') {
        return !esDecant;
    }
    if (estadoFormato === 'decant' || estadoFormato === 'decants') {
        return esDecant;
    }
    return true;
}

/**
 * Comprueba si el género de un producto coincide con el género seleccionado
 * Tolerante a mayúsculas, acentos y espacios (Hombre, HOMBRE, Mujer, Unisex)
 */
function coincideGenero(generoProducto, generoFiltro) {
    if (!generoFiltro || generoFiltro === 'todos') return true;
    const gProd = normalizarTextoCat(generoProducto || 'sin_clasificar');
    const gFiltro = normalizarTextoCat(generoFiltro);

    if (gFiltro === 'hombre') {
        return gProd === 'hombre' || gProd === 'unisex';
    }
    if (gFiltro === 'mujer') {
        return gProd === 'mujer' || gProd === 'unisex';
    }
    if (gFiltro === 'unisex') {
        return gProd === 'unisex';
    }
    return false;
}

/**
 * Normaliza una cadena de ocasión para comparación (limpia tildes, espacios y convierte a minúsculas)
 */
function normalizarTextoOcasion(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Comprueba si la ocasión de un producto coincide con el filtro de ocasión seleccionado.
 * Soporta etiquetas múltiples separadas por comas (multi-tag).
 * Ocasiones oficiales: Versátil, Diario, Citas, Noche, Formal
 */
function coincideOcasion(ocasionProducto, ocasionFiltro) {
    const filtroNorm = normalizarTextoOcasion(ocasionFiltro);
    if (!filtroNorm || filtroNorm === 'todas' || filtroNorm === 'todos') {
        return true;
    }
    if (!ocasionProducto || typeof ocasionProducto !== 'string') {
        return false;
    }
    const tagsProducto = ocasionProducto.split(',').map(tag => normalizarTextoOcasion(tag));
    return tagsProducto.includes(filtroNorm);
}

/**
 * Obtiene la configuración de cotización según el tipo
 */
function obtenerConfiguracionCotizacion(tipo) {
    return COTIZACION_TEXTOS[tipo] || COTIZACION_TEXTOS.todos;
}

/**
 * Sincroniza visualmente los botones de Formato (TODOS / SELLADOS / DECANTS)
 */
function sincronizarBotonesFormato(formatoActivo) {
    const formatoBtns = document.querySelectorAll('.filter-group--formato .filter-tab-btn');
    formatoBtns.forEach(btn => {
        const isCurrent = (btn.dataset.formato || 'todos') === (formatoActivo || 'todos');
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });
}

/**
 * Sincroniza visualmente los botones de Tipo (TODOS / ÁRABES / DISEÑADOR / NICHO)
 */
function sincronizarBotonesTipo(tipoActivo) {
    const tipoBtns = document.querySelectorAll('.filter-group--tipo .filter-tab-btn');
    tipoBtns.forEach(btn => {
        const isCurrent = (btn.dataset.tipo || 'todos') === (tipoActivo || 'todos');
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });
}

/**
 * Sincroniza visualmente los dropdowns personalizados (Género y Ordenar por)
 */
function sincronizarDropdownsPersonalizados(estado) {
    // 1. Género
    const genderSelect = document.getElementById('filter-gender-select');
    if (genderSelect) genderSelect.value = estado.genero || 'todos';

    const genderLabel = document.getElementById('gender-dropdown-label');
    const genderMap = {
        todos: 'Género: Todos',
        hombre: 'Género: Hombre',
        mujer: 'Género: Mujer',
        unisex: 'Género: Unisex'
    };
    if (genderLabel) {
        genderLabel.textContent = genderMap[estado.genero] || 'Género: Todos';
    }

            const genderMenu = document.getElementById('gender-dropdown-menu');
    if (genderMenu) {
        genderMenu.querySelectorAll('.dunes-dropdown-option').forEach(opt => {
            const isCurrent = opt.dataset.value === (estado.genero || 'todos');
            opt.classList.toggle('active', isCurrent);
            opt.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        });
    }

    // 2. Ocasión
    const ocasionSelect = document.getElementById('filter-ocasion-select');
    if (ocasionSelect) ocasionSelect.value = estado.ocasion || 'todas';

    const ocasionLabel = document.getElementById('ocasion-dropdown-label');
    const ocasionMap = {
        todas: 'Ocasión: Todos',
        versatil: 'Ocasión: Versátil',
        diario: 'Ocasión: Diario / Oficina',
        citas: 'Ocasión: Citas',
        noche: 'Ocasión: Noche / Fiesta',
        formal: 'Ocasión: Formal'
    };
    if (ocasionLabel) {
        ocasionLabel.textContent = ocasionMap[estado.ocasion] || 'Ocasión: Todos';
    }

    const ocasionMenu = document.getElementById('ocasion-dropdown-menu');
    if (ocasionMenu) {
        ocasionMenu.querySelectorAll('.dunes-dropdown-option').forEach(opt => {
            const isCurrent = opt.dataset.value === (estado.ocasion || 'todas');
            opt.classList.toggle('active', isCurrent);
            opt.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        });
    }

    // 3. Ordenar por
    const sortSelect = document.getElementById('sort-price');
    if (sortSelect) sortSelect.value = estado.orden || 'relevancia';

    const sortLabel = document.getElementById('sort-dropdown-label');
    const sortMap = {
        relevancia: 'Ordenar: Relevancia',
        'price-asc': 'Precio: menor a mayor',
        'price-desc': 'Precio: mayor a menor'
    };
    if (sortLabel) {
        sortLabel.textContent = sortMap[estado.orden] || 'Ordenar: Relevancia';
    }

    const sortMenu = document.getElementById('sort-dropdown-menu');
    if (sortMenu) {
        sortMenu.querySelectorAll('.dunes-dropdown-option').forEach(opt => {
            const isCurrent = opt.dataset.value === (estado.orden || 'relevancia');
            opt.classList.toggle('active', isCurrent);
            opt.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        });
    }
}

/**
 * Muestra u oculta el botón 'Limpiar filtros' según si hay algún filtro activo diferente al estado inicial
 */
function actualizarBotonLimpiarFiltros(estado) {
    const btnClear = document.getElementById('btn-clear-filters');
    if (!btnClear) return;

    const tieneBusqueda = !!(estado.busqueda && estado.busqueda.trim());
    const tieneFormato = estado.formato && estado.formato !== 'todos';
    const tieneTipo = estado.tipo && estado.tipo !== 'todos';
    const tieneGenero = estado.genero && estado.genero !== 'todos';
    const tieneOcasion = estado.ocasion && estado.ocasion !== 'todas' && estado.ocasion !== 'todos';
    const tieneSoloDisp = !!estado.soloDisponibles;
    const tieneOrden = estado.orden && estado.orden !== 'relevancia';

    const hayFiltrosActivos = tieneBusqueda || tieneFormato || tieneTipo || tieneGenero || tieneOcasion || tieneSoloDisp || tieneOrden;

    if (hayFiltrosActivos) {
        btnClear.hidden = false;
        btnClear.classList.add('is-visible');
    } else {
        btnClear.hidden = true;
        btnClear.classList.remove('is-visible');
    }
}

/**
 * Sincroniza todos los controles visuales de la interfaz con el estado actual
 */
function sincronizarControlesInterfaz(estado) {
    sincronizarBotonesFormato(estado.formato);
    sincronizarBotonesTipo(estado.tipo);
    sincronizarDropdownsPersonalizados(estado);

    const availableCheckbox = document.getElementById('filter-available');
    if (availableCheckbox) availableCheckbox.checked = !!estado.soloDisponibles;

    const searchInput = document.getElementById('search-perfume');
    if (searchInput) searchInput.value = estado.busqueda || '';

    actualizarBotonLimpiarFiltros(estado);
}

/**
 * Cierra todos los menús desplegables abiertos y restaura el z-index de sus contenedores
 */
function cerrarTodosLosDropdowns() {
    document.querySelectorAll('.dunes-dropdown-trigger').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.dunes-dropdown-menu').forEach(menu => {
        menu.hidden = true;
        menu.classList.remove('is-open');
    });
    document.querySelectorAll('.filter-dropdown-wrapper').forEach(wrap => {
        wrap.classList.remove('is-open');
        wrap.style.zIndex = '';
    });
    document.querySelectorAll('.catalog-filters-bar').forEach(bar => {
        bar.classList.remove('has-open-dropdown');
        bar.style.zIndex = '';
    });
}

/**
 * Configura un componente de dropdown personalizado Dunes con control de elevación y clicks
 */
function configurarDropdownPersonalizado(triggerId, menuId, callbackSeleccion) {
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);
    if (!trigger || !menu) return;

    const wrapper = trigger.closest('.filter-dropdown-wrapper');
    const filterBar = trigger.closest('.catalog-filters-bar');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        cerrarTodosLosDropdowns();
        if (!isOpen) {
            trigger.setAttribute('aria-expanded', 'true');
            menu.hidden = false;
            menu.classList.add('is-open');
            if (wrapper) {
                wrapper.classList.add('is-open');
                wrapper.style.zIndex = '500';
            }
            if (filterBar) {
                filterBar.classList.add('has-open-dropdown');
                filterBar.style.zIndex = '500';
            }
        }
    });

    menu.querySelectorAll('.dunes-dropdown-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            if (opt.classList.contains('disabled') || opt.getAttribute('aria-disabled') === 'true') {
                cerrarTodosLosDropdowns();
                return;
            }
            const value = e.currentTarget.dataset.value;
            cerrarTodosLosDropdowns();
            if (value !== undefined) {
                callbackSeleccion(value);
            }
        });
    });
}

let eventosGlobalesDropdownIniciados = false;
function inicializarEventosGlobalesDropdowns() {
    if (eventosGlobalesDropdownIniciados) return;
    eventosGlobalesDropdownIniciados = true;

    document.addEventListener('click', () => {
        cerrarTodosLosDropdowns();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarTodosLosDropdowns();
        }
    });
}

/**
 * Actualiza dinámicamente el contador de resultados (ej: "56 productos")
 */
function actualizarContador(cantidad) {
    const counterEl = document.getElementById('results-count');
    if (!counterEl) return;
    const texto = cantidad === 1 ? 'producto' : 'productos';
    counterEl.textContent = `${cantidad} ${texto}`;
}

/**
 * Reinicia todos los filtros al estado por defecto
 */
function limpiarTodosLosFiltros(productos, estado, grid) {
    estado.formato = 'todos';
    estado.tipo = 'todos';
    estado.genero = 'todos';
    estado.ocasion = 'todas';
    estado.busqueda = '';
    estado.soloDisponibles = false;
    estado.orden = 'relevancia';

    sincronizarControlesInterfaz(estado);
    guardarEstadoCatalogo(estado);
    filtrarYRenderizar(productos, estado, grid);
}

/**
 * Inicializa y asocia los eventos a los inputs de filtrado
 */
function inicializarFiltrosInterfaz(productos, estado, grid) {
    const searchInput = document.getElementById('search-perfume');
    const formatoBtns = document.querySelectorAll('.filter-group--formato .filter-tab-btn');
    const tipoBtns = document.querySelectorAll('.filter-group--tipo .filter-tab-btn');
    const genderSelect = document.getElementById('filter-gender-select');
    const ocasionSelect = document.getElementById('filter-ocasion-select');
    const sortSelect = document.getElementById('sort-price');
    const availableCheckbox = document.getElementById('filter-available');

    inicializarEventosGlobalesDropdowns();

    // Búsqueda por texto (Nombre / Marca) con debounce de 180ms
    let searchDebounceTimer = null;
    if (searchInput) {
        searchInput.value = estado.busqueda || '';
        searchInput.addEventListener('input', (e) => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            const val = e.target.value;
            searchDebounceTimer = setTimeout(() => {
                estado.busqueda = val.toLowerCase().trim();
                guardarEstadoCatalogo(estado);
                filtrarYRenderizar(productos, estado, grid);

                if (estado.busqueda.length >= 2 && typeof window !== 'undefined' && window.Analytics) {
                    const count = grid ? grid.querySelectorAll('.product-card, .catalog-card').length : 0;
                    window.Analytics.trackCatalogSearch(count);
                }
            }, 180);
        });
    }

    // Filtro por Formato (TODOS / SELLADOS / DECANTS)
    formatoBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedFormato = e.currentTarget.dataset.formato;
            estado.formato = selectedFormato;
            sincronizarBotonesFormato(selectedFormato);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    });

    // Filtro por Tipo (TODOS / ÁRABES / DISEÑADOR / NICHO)
    tipoBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedTipo = e.currentTarget.dataset.tipo;
            estado.tipo = selectedTipo;
            sincronizarBotonesTipo(selectedTipo);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    });

    // Configuración Dropdown Personalizado Género
    configurarDropdownPersonalizado('gender-dropdown-trigger', 'gender-dropdown-menu', (val) => {
        estado.genero = val;
        sincronizarDropdownsPersonalizados(estado);
        guardarEstadoCatalogo(estado);
        filtrarYRenderizar(productos, estado, grid);
    });

    // Configuración Dropdown Personalizado Ocasión
    configurarDropdownPersonalizado('ocasion-dropdown-trigger', 'ocasion-dropdown-menu', (val) => {
        estado.ocasion = val;
        sincronizarDropdownsPersonalizados(estado);
        guardarEstadoCatalogo(estado);
        filtrarYRenderizar(productos, estado, grid);
    });

    // Configuración Dropdown Personalizado Ordenar
    configurarDropdownPersonalizado('sort-dropdown-trigger', 'sort-dropdown-menu', (val) => {
        estado.orden = val;
        sincronizarDropdownsPersonalizados(estado);
        guardarEstadoCatalogo(estado);
        filtrarYRenderizar(productos, estado, grid);
    });

    // Mantenimiento de eventos para select nativo si es modificado directamente en pruebas
    if (genderSelect) {
        genderSelect.addEventListener('change', (e) => {
            estado.genero = e.target.value;
            sincronizarDropdownsPersonalizados(estado);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    if (ocasionSelect) {
        ocasionSelect.addEventListener('change', (e) => {
            estado.ocasion = e.target.value;
            sincronizarDropdownsPersonalizados(estado);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            estado.orden = e.target.value;
            sincronizarDropdownsPersonalizados(estado);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Checkbox de Disponibles
    if (availableCheckbox) {
        availableCheckbox.checked = !!estado.soloDisponibles;
        availableCheckbox.addEventListener('change', (e) => {
            estado.soloDisponibles = e.target.checked;
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Botón Limpiar Filtros
    const clearBtn = document.getElementById('btn-clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            limpiarTodosLosFiltros(productos, estado, grid);
        });
    }
}

/**
 * Filtra la lista de productos mediante el pipeline único centralizado y la renderiza en el grid
 */
function filtrarYRenderizar(productos, estado, grid) {
    if (!grid) return;
    if (Array.isArray(productos)) window._productosCacheGrid = productos;
    console.log("[CATALOGO] Estado filtros:", estado);

    actualizarBotonLimpiarFiltros(estado);

    // Limpiar SIEMPRE el contenedor antes de procesar o renderizar
    grid.innerHTML = '';

    // 1. Pipeline Central de Filtrado (en memoria)
    const filtrados = productos.filter(prod => {
        // A. Visibilidad global (Obligatorio)
        if (prod.visible === false) return false;

        // B. Búsqueda en tiempo real (Nombre o Marca, acentos y mayúsculas ignorados)
        if (estado.busqueda) {
            const queryNorm = normalizarTextoCat(estado.busqueda);
            const nombreNorm = normalizarTextoCat(prod.nombre);
            const marcaNorm = normalizarTextoCat(prod.marca);
            if (!nombreNorm.includes(queryNorm) && !marcaNorm.includes(queryNorm)) {
                return false;
            }
        }

        // C. Filtro por Formato (TODOS / SELLADOS / DECANTS)
        if (!coincideFormato(prod, estado.formato)) {
            return false;
        }

        // D. Filtro por Tipo (TODOS / ÁRABES / DISEÑADOR / NICHO)
        if (!coincideTipo(prod, estado.tipo)) {
            return false;
        }

        // E. Filtro por Género (TODOS / HOMBRE / MUJER / UNISEX)
        if (!coincideGenero(prod.genero, estado.genero)) {
            return false;
        }

        // F. Filtro por Ocasión (MULTIETIQUETA: Versátil, Diario, Citas, Noche, Formal)
        if (!coincideOcasion(prod.ocasion, estado.ocasion)) {
            return false;
        }

        // G. Filtro por Disponibilidad (Solo disponibles)
        if (estado.soloDisponibles) {
            const catNorm = normalizarTextoCat(prod.categoria);
            const formNorm = normalizarTextoCat(prod.formato);
            const esDecant = catNorm.includes('decant') || formNorm.includes('decant');
            const mlDisp = prod.mililitrosDisponibles ?? prod.mililitros_disponibles ?? 0;
            const estaAgotado = esDecant
                ? (!prod.disponible || mlDisp <= 0)
                : (!prod.disponible || (prod.stock ?? 0) <= 0);
            if (estaAgotado) return false;
        }

        return true;
    });

    const estadoEl = document.getElementById('estado-catalogo');
    const mensajeEl = document.getElementById('estado-catalogo-mensaje');
    const secContainer = document.getElementById('cotizacion-secundaria-container');

    const config = obtenerConfiguracionCotizacion(estado.tipo);
    const waUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(config.whatsappTexto)}`;

    // CASO ESTADO VACÍO (Sin productos coincidentes)
    if (filtrados.length === 0) {
        grid.style.display = 'none';
        grid.innerHTML = ''; // Garantizar que el grid no conserve tarjetas anteriores
        if (secContainer) {
            secContainer.style.display = 'none';
            secContainer.innerHTML = '';
        }

        if (estadoEl && mensajeEl) {
            const iconContainer = document.getElementById('estado-catalogo-icon');
            if (estado.busqueda && iconContainer) {
                iconContainer.innerHTML = '<i data-lucide="search" class="icon-lg" style="color: var(--catalog-gold, #B18225);"></i>';
            } else if (iconContainer) {
                iconContainer.innerHTML = '<i data-lucide="shopping-bag" class="icon-lg" style="color: var(--catalog-gold, #B18225);"></i>';
            }

            document.getElementById('estado-catalogo-titulo').textContent = '¿NO VES TU PERFUME AQUÍ?';
            mensajeEl.textContent = 'Cotiza tu perfume con nosotros y te ayudamos a conseguirlo.';
            document.getElementById('estado-catalogo-cotizar-bloque').style.display = 'none';

            const waBtn = document.getElementById('estado-catalogo-btn-wa');
            if (waBtn) {
                waBtn.href = waUrl;
                waBtn.setAttribute('aria-label', config.ariaLabel);
                document.getElementById('estado-catalogo-btn-wa-texto').textContent = 'COTIZA TU PERFUME';
            }

            const secBtn = document.getElementById('estado-catalogo-btn-secundario');
            if (secBtn) {
                const newSecBtn = secBtn.cloneNode(true);
                secBtn.parentNode.replaceChild(newSecBtn, secBtn);
                newSecBtn.textContent = 'Limpiar filtros';
                newSecBtn.style.display = 'inline-block';
                newSecBtn.addEventListener('click', () => {
                    limpiarTodosLosFiltros(productos, estado, grid);
                });
            }

            estadoEl.style.display = 'block';
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
        actualizarContador(0);
        return;
    }

    // 2. Copia inmutable para ordenamiento sin mutar array original
    let resultadoFinal = [...filtrados];

    if (estado.orden === 'price-asc' || estado.orden === 'price-desc') {
        const getPrecioEfectivo = (prod) => {
            const catNorm = normalizarTextoCat(prod.categoria);
            const formNorm = normalizarTextoCat(prod.formato);
            const esDecant = catNorm.includes('decant') || formNorm.includes('decant');
            if (esDecant) {
                if (prod.presentaciones && prod.presentaciones.length > 0) {
                    const validos = prod.presentaciones.map(p => p.precio).filter(p => typeof p === 'number' && p > 0);
                    if (validos.length > 0) return Math.min(...validos);
                }
                const p3 = typeof prod.precio_3ml === 'number' && prod.precio_3ml > 0 ? prod.precio_3ml : null;
                const p5 = typeof prod.precio_5ml === 'number' && prod.precio_5ml > 0 ? prod.precio_5ml : null;
                const p10 = typeof prod.precio_10ml === 'number' && prod.precio_10ml > 0 ? prod.precio_10ml : null;
                const validos = [p3, p5, p10].filter(p => p !== null);
                if (validos.length > 0) return Math.min(...validos);
                return prod.precio || 15;
            }
            if (prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number')) {
                return prod.precio_oferta ?? prod.precioOferta;
            }
            return prod.precio || 0;
        };

        if (estado.orden === 'price-asc') {
            resultadoFinal.sort((a, b) => getPrecioEfectivo(a) - getPrecioEfectivo(b));
        } else {
            resultadoFinal.sort((a, b) => getPrecioEfectivo(b) - getPrecioEfectivo(a));
        }
    }

    // 4. Renderizar tarjetas con el diseño completo aprobado
    if (estadoEl) estadoEl.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    resultadoFinal.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const catNorm = normalizarTextoCat(prod.categoria);
        const formNorm = normalizarTextoCat(prod.formato);
        const esDecant = catNorm.includes('decant') || formNorm.includes('decant');
        const mlDisp = prod.mililitrosDisponibles ?? prod.mililitros_disponibles ?? 0;
        const estaAgotado = esDecant
            ? (!prod.disponible || mlDisp <= 0)
            : (!prod.disponible || (prod.stock ?? 0) <= 0);

        if (estaAgotado) {
            card.classList.add('out-of-stock', 'is-soldout');
        }

        const tieneOferta = !esDecant && prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number');
        const precioOfertaVal = tieneOferta ? (prod.precio_oferta ?? prod.precioOferta) : null;

        let tagHtml = '';
        if (!esDecant && prod.oferta && prod.disponible && prod.stock > 0) {
            let promoText = 'OFERTA';
            if (tieneOferta && typeof prod.precio === 'number' && prod.precio > precioOfertaVal) {
                const pct = Math.round(((prod.precio - precioOfertaVal) / prod.precio) * 100);
                if (pct > 0) {
                    promoText = `OFERTA • ${pct}% OFF`;
                }
            }
            tagHtml = `<span class="product-tag promo-tag">${promoText}</span>`;
        } else if (estaAgotado) {
            tagHtml = `<span class="product-tag out-tag">AGOTADO</span>`;
        }

        let categoryBadgeText = 'CATÁLOGO';
        let categoryBadgeShort = 'CATÁLOGO';
        if (catNorm === 'arabe') {
            categoryBadgeText = esDecant ? 'DECANT ÁRABE' : 'PERFUME ÁRABE';
            categoryBadgeShort = esDecant ? 'DECANT' : 'ÁRABE';
        } else if (catNorm === 'disenador') {
            categoryBadgeText = esDecant ? 'DECANT DISEÑADOR' : 'DISEÑADOR';
            categoryBadgeShort = esDecant ? 'DECANT' : 'DISEÑADOR';
        } else if (catNorm === 'nicho') {
            categoryBadgeText = esDecant ? 'DECANT NICHO' : 'NICHO';
            categoryBadgeShort = esDecant ? 'DECANT' : 'NICHO';
        } else if (esDecant) {
            categoryBadgeText = 'DECANT';
            categoryBadgeShort = 'DECANT';
        }

        let precioMinDecant = 15;
        if (esDecant) {
            if (prod.presentaciones && prod.presentaciones.length > 0) {
                const precios = prod.presentaciones.map(p => p.precio).filter(p => typeof p === 'number' && p > 0);
                if (precios.length > 0) precioMinDecant = Math.min(...precios);
            } else {
                const p3 = typeof prod.precio_3ml === 'number' && prod.precio_3ml > 0 ? prod.precio_3ml : null;
                const p5 = typeof prod.precio_5ml === 'number' && prod.precio_5ml > 0 ? prod.precio_5ml : null;
                const p10 = typeof prod.precio_10ml === 'number' && prod.precio_10ml > 0 ? prod.precio_10ml : null;
                const validos = [p3, p5, p10].filter(p => p !== null);
                if (validos.length > 0) precioMinDecant = Math.min(...validos);
                else if (typeof prod.precio === 'number' && prod.precio > 0) precioMinDecant = prod.precio;
            }
        }

        const precioActual = esDecant ? `Desde S/ ${precioMinDecant.toFixed(2)}` : 'S/ ' + (tieneOferta ? precioOfertaVal : (prod.precio || 0)).toFixed(2);
        const precioAnteriorHtml = (tieneOferta && typeof prod.precio === 'number')
            ? `<span class="price-old">S/ ${prod.precio.toFixed(2)}</span>`
            : '';

        const presentacionFormateada = esDecant ? prod.presentacion : `Sellado · ${prod.presentacion || '100 ml'}`;

        const stockHtml = esDecant
            ? (!estaAgotado
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${mlDisp} ml)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`)
            : (!estaAgotado
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${prod.stock} unid.)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`);

        let actionBtnHtml = '';
        const detailsBtnHtml = `
            <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="btn btn-outline btn-details-compact" aria-label="Ver detalles de ${prod.nombre}">
                <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Detalles
            </a>
        `;

        if (esDecant) {
            if (!estaAgotado) {
                actionBtnHtml = `
                    <div class="card-buttons-flex">
                        ${detailsBtnHtml}
                        <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="btn btn-primary btn-select-option">
                            Opciones
                        </a>
                    </div>
                `;
            } else {
                actionBtnHtml = `
                    <div class="card-buttons-flex out-of-stock-buttons">
                        <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                            <svg class="icon-whatsapp whatsapp-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Consultar
                        </button>
                    </div>
                `;
            }
        } else if (prod.disponible && prod.stock > 0) {
            actionBtnHtml = `
                <div class="card-buttons-flex">
                    ${detailsBtnHtml}
                    <button class="btn btn-primary btn-add-cart" data-id="${prod.id}" data-nombre="${prod.nombre}">
                        <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> Agregar
                    </button>
                </div>
            `;
        } else {
            actionBtnHtml = `
                <div class="card-buttons-flex out-of-stock-buttons">
                    <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                        <svg class="icon-whatsapp whatsapp-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Consultar
                    </button>
                </div>
            `;
        }

        const loadingAttr = index < 4 ? 'eager' : 'lazy';

        const esFav = (typeof window !== 'undefined' && window.FavoritosService) ? window.FavoritosService.esFavorito(prod.id) : false;
        const favBtnHtml = `
            <button type="button" class="favorite-toggle-btn ${esFav ? 'is-active' : ''}" data-id="${prod.id}" data-nombre="${prod.nombre}" aria-label="${esFav ? 'Quitar ' + prod.nombre + ' de favoritos' : 'Agregar ' + prod.nombre + ' a favoritos'}" aria-pressed="${esFav ? 'true' : 'false'}">
                <svg class="favorite-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="${esFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
            </button>
        `;

        const divContainer = document.createElement('div');
        divContainer.className = 'product-image-container';
        divContainer.innerHTML = `
            ${tagHtml}
            ${favBtnHtml}
            <span class="product-category-badge">${categoryBadgeText}</span>
            <a href="producto.html?id=${prod.id}" class="product-img-link" aria-label="Ver detalles de ${prod.nombre}">
                <img src="${typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="${loadingAttr}" decoding="async" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png'; console.warn('[Catálogo] Imagen no disponible para producto:', '${prod.id}');">
            </a>
            <div class="product-actions-overlay">
                <a href="producto.html?id=${prod.id}" class="btn btn-light-glass btn-view-details">Ver Detalles</a>
            </div>
        `;

        const divInfo = document.createElement('div');
        divInfo.className = 'product-info';
        divInfo.innerHTML = `
            <span class="product-category-mobile">${categoryBadgeShort}</span>
            <span class="product-brand"></span>
            <h3 class="product-title"><a href="producto.html?id=${prod.id}" class="product-title-link"></a></h3>
            <span class="product-volume">${presentacionFormateada}</span>
            <div class="product-stock-row">
                ${stockHtml}
            </div>
            <div class="product-price-row">
                <div class="prices">
                    ${precioAnteriorHtml}
                    <span class="price-current">${precioActual}</span>
                </div>
            </div>
        `;
        divInfo.querySelector('.product-brand').textContent = prod.marca;
        divInfo.querySelector('.product-title-link').textContent = prod.nombre;

        const divFooter = document.createElement('div');
        divFooter.className = 'product-card-footer';
        divFooter.innerHTML = actionBtnHtml;

        card.appendChild(divContainer);
        card.appendChild(divInfo);
        card.appendChild(divFooter);
        grid.appendChild(card);
    });

    // Vincular eventos de adición y WhatsApp en las tarjetas del grid
    vincularEventosGridCatalogo(grid, estado);

    // RENDERIZAR BLOQUE SECUNDARIO DE COTIZACIÓN AL FINAL DEL LISTADO EXITOSO
    if (secContainer) {
        let secBotonTexto = "Cotiza aquí tu perfume";
        if (estado.categoria === 'decants') {
            secBotonTexto = "Consultar decant por WhatsApp";
        } else if (estado.categoria === 'arabe') {
            secBotonTexto = "Cotiza aquí tu perfume árabe";
        } else if (estado.categoria === 'nicho') {
            secBotonTexto = "Cotiza aquí tu perfume nicho";
        }

        let descTexto = "Tenemos más opciones disponibles por pedido.";
        let subtituloTexto = "¿No encuentras lo que buscas?";

        if (estado.categoria === 'todos') {
            subtituloTexto = "¿No encuentras el perfume que buscas?";
            descTexto = "Cotízalo con nosotros y te ayudamos a conseguirlo.";
        }

        secContainer.innerHTML = `
            <div class="secondary-quote-block" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 20px; background-color: var(--surface-card, #FFFEFC); border: 1px solid var(--catalog-gold-border, #E7D3A5); border-radius: var(--radius-card, 16px); max-width: 600px; margin: 36px auto; box-shadow: var(--shadow-sm, 0 4px 12px rgba(31, 24, 12, 0.05));">
                <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; color: #171717; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;"></h3>
                <p style="font-family: 'Montserrat', sans-serif; color: #6F6F6F; font-size: 0.92rem; line-height: 1.5; margin-bottom: 18px; text-align: center; max-width: 480px;"></p>
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; margin: 0 auto;" aria-label="${config.ariaLabel}">
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="flex-shrink: 0;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    <span></span>
                </a>
            </div>
        `;
        secContainer.querySelector('h3').textContent = subtituloTexto;
        secContainer.querySelector('p').textContent = descTexto;
        secContainer.querySelector('a span:last-child').textContent = secBotonTexto;
        secContainer.style.display = 'block';
    }

    actualizarContador(resultadoFinal.length);
    console.log("[CATALOGO] Render finalizado");

    if (typeof window !== 'undefined' && window.Analytics && resultadoFinal.length > 0) {
        if (!window._viewItemListSent) {
            window._viewItemListSent = true;
            const items = resultadoFinal.slice(0, 20).map(p => window.Analytics.formatItem(p, 1));
            window.Analytics.trackEcommerce('view_item_list', {
                item_list_id: 'catalogo',
                item_list_name: 'Catálogo',
                items: items
            });
        }
    }
}

/**
 * Agrega eventos a los botones de comprar, agregar y links a detalles
 */
function vincularEventosGridCatalogo(grid, estado) {
    grid.querySelectorAll('a[href*="producto.html"], .btn-details-compact, .btn-select-option, .btn-view-details').forEach(link => {
        link.addEventListener('click', (e) => {
            if (estado) {
                guardarEstadoCatalogo(estado);
            }
            if (typeof window !== 'undefined' && window.Analytics) {
                const card = link.closest('.product-card, .catalog-card');
                const id = card ? card.dataset.id : null;
                if (id && Array.isArray(window._productosCacheGrid)) {
                    const prod = window._productosCacheGrid.find(p => String(p.id) === String(id));
                    if (prod) {
                        const item = window.Analytics.formatItem(prod, 1);
                        window.Analytics.trackEcommerce('select_item', {
                            item_list_id: 'catalogo',
                            item_list_name: 'Catálogo',
                            items: [item]
                        });
                    }
                }
            }
        });
    });

    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            window.carritoModulo.agregarAlCarrito(id, 1, null);
        });
    });

    grid.querySelectorAll('.btn-query-wa').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const nombre = e.currentTarget.dataset.nombre;
            const marca = e.currentTarget.dataset.marca;
            window.whatsappConfig.consultarDisponibilidad(nombre, marca, 'Presentación estándar');
        });
    });
}
