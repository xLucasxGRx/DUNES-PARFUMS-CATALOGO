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
        const payload = {
            categoria: filtroEstado.categoria || 'todos',
            genero: filtroEstado.genero || 'todos',
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
    let catParam = null;
    let genParam = null;

    try {
        const params = new URLSearchParams(window.location.search);
        hasCatParam = params.has('categoria');
        hasGenParam = params.has('genero');
        catParam = params.get('categoria');
        genParam = params.get('genero');
    } catch (e) {}

    const catValidas = ['arabe', 'disenador', 'nicho', 'decants'];
    const genValidos = ['hombre', 'mujer', 'unisex'];

    const savedState = obtenerEstadoCatalogoGuardado();

    let finalCat = 'todos';
    if (hasCatParam) {
        finalCat = catValidas.includes(catParam) ? catParam : 'todos';
    } else if (savedState && catValidas.includes(savedState.categoria)) {
        finalCat = savedState.categoria;
    }

    let finalGen = 'todos';
    if (hasGenParam) {
        finalGen = genValidos.includes(genParam) ? genParam : 'todos';
    } else if (savedState && genValidos.includes(savedState.genero)) {
        finalGen = savedState.genero;
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

    return {
        filtroEstado: {
            categoria: finalCat,
            genero: finalGen,
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

    // 1. Mostrar skeletons de inmediato (no 0 productos)
    mostrarSkeletonsCatalogo(grid);

    // 2. Resolver estado inicial con prioridad de URL sobre sessionStorage
    const { filtroEstado, savedScrollY } = resolverEstadoInicial();

    // 3. Cargar productos desde productosModulo
    let productos = null;
    try {
        productos = await window.productosModulo.obtenerProductos();
    } catch (e) {
        console.error("[Catálogo] Error al consultar ProductosService:", e);
    }

    // 4. Si fallaron todas las fuentes
    if (!productos || productos.length === 0) {
        mostrarErrorCargaCatalogo(grid, () => {
            iniciarCargaCatalogo(grid);
        });
        return;
    }

    grid.classList.remove('is-loading');

    // 5. Actualizar visualmente la interfaz
    sincronizarBotonesCategoria(filtroEstado.categoria);
    sincronizarBotonesGenero(filtroEstado.genero);
    actualizarCabeceraCategoria(filtroEstado.categoria);

    inicializarFiltrosInterfaz(productos, filtroEstado, grid);

    window.addEventListener('popstate', () => {
        const cat = obtenerCategoriaDesdeURL();
        const gen = obtenerGeneroDesdeURL();
        filtroEstado.categoria = cat;
        filtroEstado.genero = gen;

        sincronizarBotonesCategoria(cat);
        sincronizarBotonesGenero(gen);
        actualizarCabeceraCategoria(cat);

        const searchInput = document.getElementById('search-perfume');
        if (searchInput) searchInput.value = filtroEstado.busqueda;
        const availableCheckbox = document.getElementById('filter-available');
        if (availableCheckbox) availableCheckbox.checked = filtroEstado.soloDisponibles;
        const sortSelect = document.getElementById('sort-price');
        if (sortSelect) sortSelect.value = filtroEstado.orden;

        filtrarYRenderizar(productos, filtroEstado, grid);
    });

    window.addEventListener('beforeunload', () => {
        guardarEstadoCatalogo(filtroEstado);
    });

    // 6. Renderizar productos reales
    filtrarYRenderizar(productos, filtroEstado, grid);

    // 7. Restaurar scroll
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
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('catalogo-productos-grid');
    if (!grid) return;
    iniciarCargaCatalogo(grid);
});

/**
 * Obtiene el valor de la categoría desde los parámetros de la URL
 */
function obtenerCategoriaDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    const validas = ['arabe', 'disenador', 'nicho', 'decants'];
    return validas.includes(cat) ? cat : 'todos';
}

/**
 * Obtiene el valor del género desde los parámetros de la URL
 */
function obtenerGeneroDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const gen = params.get('genero');
    const validos = ['hombre', 'mujer', 'unisex'];
    return validos.includes(gen) ? gen : 'todos';
}

/**
 * Comprueba si el género de un producto coincide con el género seleccionado
 * Regla:
 * - Hombre: productos 'hombre' y productos 'unisex'
 * - Mujer: productos 'mujer' y productos 'unisex'
 * - Unisex: únicamente productos 'unisex'
 * - Todos: todos los productos
 */
function coincideGenero(generoProducto, generoFiltro) {
    if (!generoFiltro || generoFiltro === 'todos') return true;
    const gProd = (generoProducto || 'sin_clasificar').toLowerCase();
    if (generoFiltro === 'hombre') {
        return gProd === 'hombre' || gProd === 'unisex';
    }
    if (generoFiltro === 'mujer') {
        return gProd === 'mujer' || gProd === 'unisex';
    }
    if (generoFiltro === 'unisex') {
        return gProd === 'unisex';
    }
    return false;
}

/**
 * Obtiene la configuración de cotización según la categoría
 */
function obtenerConfiguracionCotizacion(categoria) {
    return COTIZACION_TEXTOS[categoria] || COTIZACION_TEXTOS.todos;
}

/**
 * Actualiza la URL del navegador usando la History API sin recargar
 */
function actualizarURL(categoria, genero) {
    const url = new URL(window.location.href);

    if (!categoria || categoria === 'todos') {
        url.searchParams.delete('categoria');
    } else {
        url.searchParams.set('categoria', categoria);
    }

    if (!genero || genero === 'todos') {
        url.searchParams.delete('genero');
    } else {
        url.searchParams.set('genero', genero);
    }

    const currentSearch = window.location.search;
    const newSearch = url.search;
    if (currentSearch !== newSearch) {
        history.pushState({ categoria, genero }, '', url.pathname + (url.search || ''));
    }
}

/**
 * Sincroniza visualmente los botones de categoría y actualiza aria-pressed
 */
function sincronizarBotonesCategoria(categoriaActiva) {
    const categoryFilters = document.querySelectorAll('.filter-category-btn');
    categoryFilters.forEach(btn => {
        const isCurrent = btn.dataset.categoria === categoriaActiva;
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });
}

/**
 * Sincroniza visualmente los botones de género y actualiza aria-pressed
 */
function sincronizarBotonesGenero(generoActivo) {
    const genderFilters = document.querySelectorAll('.filter-gender-btn');
    genderFilters.forEach(btn => {
        const isCurrent = btn.dataset.genero === generoActivo;
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });
}

/**
 * Actualiza el título, subtítulo y descripción del catálogo dinámicamente
 */
function actualizarCabeceraCategoria(categoria) {
    const info = CATEGORIA_INFO[categoria] || CATEGORIA_INFO.todos;
    const titleEl = document.getElementById('catalogo-titulo');
    const descEl = document.getElementById('catalogo-descripcion');
    const subEl = document.getElementById('catalogo-subtitulo');
    
    if (titleEl) titleEl.textContent = info.titulo;
    if (descEl) descEl.textContent = info.descripcion;
    if (subEl) subEl.textContent = info.subtitulo;
}

/**
 * Actualiza dinámicamente el contador de resultados
 */
function actualizarContador(cantidad, categoria) {
    const counterEl = document.getElementById('results-count');
    if (!counterEl) return;
    
    let tipoTexto = 'productos';
    if (categoria === 'decants') {
        tipoTexto = cantidad === 1 ? 'decant' : 'decants';
    } else {
        tipoTexto = cantidad === 1 ? 'producto' : 'productos';
    }
    
    counterEl.textContent = `${cantidad} ${tipoTexto} encontrado${cantidad === 1 ? '' : 's'}`;
}

/**
 * Inicializa y asocia los eventos a los inputs de filtrado
 */
function inicializarFiltrosInterfaz(productos, estado, grid) {
    const searchInput = document.getElementById('search-perfume');
    const categoryFilters = document.querySelectorAll('.filter-category-btn');
    const genderFilters = document.querySelectorAll('.filter-gender-btn');
    const sortSelect = document.getElementById('sort-price');
    const availableCheckbox = document.getElementById('filter-available');

    // Búsqueda por texto (Nombre / Marca)
    if (searchInput) {
        searchInput.value = estado.busqueda;
        searchInput.addEventListener('input', (e) => {
            estado.busqueda = e.target.value.toLowerCase().trim();
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Filtros de Categoría (Ver Todos, Árabes, Diseñador, Nicho, Decants)
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedCat = e.currentTarget.dataset.categoria;
            estado.categoria = selectedCat;
            sincronizarBotonesCategoria(selectedCat);
            actualizarCabeceraCategoria(selectedCat);
            actualizarURL(selectedCat, estado.genero);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    });

    // Filtros de Género (Todos, Hombre, Mujer, Unisex)
    genderFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedGen = e.currentTarget.dataset.genero;
            estado.genero = selectedGen;
            sincronizarBotonesGenero(selectedGen);
            actualizarURL(estado.categoria, selectedGen);
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    });

    // Ordenamiento por precio
    if (sortSelect) {
        sortSelect.value = estado.orden;
        sortSelect.addEventListener('change', (e) => {
            estado.orden = e.target.value;
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Checkbox de Disponibles
    if (availableCheckbox) {
        availableCheckbox.checked = estado.soloDisponibles;
        availableCheckbox.addEventListener('change', (e) => {
            estado.soloDisponibles = e.target.checked;
            guardarEstadoCatalogo(estado);
            filtrarYRenderizar(productos, estado, grid);
        });
    }
}

/**
 * Filtra la lista de productos y la renderiza en el grid del DOM
 */
function filtrarYRenderizar(productos, estado, grid) {
    grid.innerHTML = '<div class="loading-spinner">Filtrando fragancias...</div>';

    // 1. Filtrar visible, categoría comercial y género
    const productosFiltradosBase = productos.filter(prod => {
        if (prod.visible === false) return false;
        if (estado.categoria !== 'todos' && prod.categoria !== estado.categoria) return false;
        if (!coincideGenero(prod.genero, estado.genero)) return false;
        return true;
    });

    const estadoEl = document.getElementById('estado-catalogo');
    const mensajeEl = document.getElementById('estado-catalogo-mensaje');
    const secContainer = document.getElementById('cotizacion-secundaria-container');

    // CONFIGURACIÓN DE WHATSAPP PARA LA CATEGORÍA ACTIVA
    const config = obtenerConfiguracionCotizacion(estado.categoria);
    const waUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(config.whatsappTexto)}`;

    // CASO A — No existen productos con los filtros principales activos
    if (productosFiltradosBase.length === 0) {
        grid.style.display = 'none';
        if (secContainer) {
            secContainer.style.display = 'none';
            secContainer.innerHTML = '';
        }

        if (estadoEl && mensajeEl) {
            const iconContainer = document.getElementById('estado-catalogo-icon');
            if (iconContainer) iconContainer.innerHTML = '<i data-lucide="shopping-bag" class="icon-lg" style="color: var(--catalog-gold, #B18225);"></i>';
            
            document.getElementById('estado-catalogo-titulo').textContent = '¿NO VES TU PERFUME AQUÍ?';
            mensajeEl.textContent = 'Cotiza tu perfume con nosotros y te ayudamos a conseguirlo.';

            // Sección de Cotizar
            document.getElementById('estado-catalogo-cotizar-bloque').style.display = 'none';
            
            // Configurar botón principal de WhatsApp
            const waBtn = document.getElementById('estado-catalogo-btn-wa');
            if (waBtn) {
                waBtn.href = waUrl;
                waBtn.setAttribute('aria-label', config.ariaLabel);
                document.getElementById('estado-catalogo-btn-wa-texto').textContent = 'COTIZA TU PERFUME';
            }
            
            // Botón secundario para Limpiar Filtros
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
        actualizarContador(0, estado.categoria);
        return;
    }

    // 2. Aplicar el resto de los filtros (búsqueda por texto y disponibilidad de stock)
    let filtrados = productosFiltradosBase.filter(prod => {
        if (estado.busqueda) {
            const nombreMatches = prod.nombre.toLowerCase().includes(estado.busqueda);
            const marcaMatches = prod.marca.toLowerCase().includes(estado.busqueda);
            if (!nombreMatches && !marcaMatches) {
                return false;
            }
        }

        if (estado.soloDisponibles) {
            const esDecant = prod.categoria === 'decants';
            const estaAgotado = esDecant
                ? (!prod.disponible || prod.mililitrosDisponibles < 3)
                : (!prod.disponible || prod.stock <= 0);
            if (estaAgotado) {
                return false;
            }
        }

        return true;
    });

    // MANEJO DE CASOS DE FILTROS VACÍOS (Búsqueda o Solo Disponibles)
    if (filtrados.length === 0) {
        grid.style.display = 'none';
        if (secContainer) {
            secContainer.style.display = 'none';
            secContainer.innerHTML = '';
        }

        if (estadoEl && mensajeEl) {
            document.getElementById('estado-catalogo-cotizar-bloque').style.display = 'none';
            
            const waBtn = document.getElementById('estado-catalogo-btn-wa');
            if (waBtn) {
                waBtn.href = waUrl;
                waBtn.setAttribute('aria-label', config.ariaLabel);
                document.getElementById('estado-catalogo-btn-wa-texto').textContent = 'COTIZA TU PERFUME';
            }

            const secBtn = document.getElementById('estado-catalogo-btn-secundario');
            const newSecBtn = secBtn.cloneNode(true);
            secBtn.parentNode.replaceChild(newSecBtn, secBtn);

            const iconContainer = document.getElementById('estado-catalogo-icon');

            if (estado.busqueda) {
                if (iconContainer) iconContainer.innerHTML = '<i data-lucide="search" class="icon-lg" style="color: var(--catalog-gold, #B18225);"></i>';
                document.getElementById('estado-catalogo-titulo').textContent = '¿NO VES TU PERFUME AQUÍ?';
                mensajeEl.textContent = 'Cotiza tu perfume con nosotros y te ayudamos a conseguirlo.';
                
                newSecBtn.textContent = 'Limpiar filtros';
                newSecBtn.style.display = 'inline-block';
                newSecBtn.addEventListener('click', () => {
                    limpiarTodosLosFiltros(productos, estado, grid);
                });
            } else if (estado.soloDisponibles) {
                if (iconContainer) iconContainer.innerHTML = '<i data-lucide="package-x" class="icon-lg" style="color: var(--catalog-gold, #B18225);"></i>';
                document.getElementById('estado-catalogo-titulo').textContent = '¿NO VES TU PERFUME AQUÍ?';
                mensajeEl.textContent = 'Cotiza tu perfume con nosotros y te ayudamos a conseguirlo.';
                
                newSecBtn.textContent = 'Ver productos agotados';
                newSecBtn.style.display = 'inline-block';
                newSecBtn.addEventListener('click', () => {
                    const availableCheckbox = document.getElementById('filter-available');
                    if (availableCheckbox) availableCheckbox.checked = false;
                    estado.soloDisponibles = false;
                    filtrarYRenderizar(productos, estado, grid);
                });
            } else {
                newSecBtn.style.display = 'none';
            }

            estadoEl.style.display = 'block';
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
        actualizarContador(0, estado.categoria);
        return;
    }

    // 3. Ordenar
    if (estado.orden === 'price-asc') {
        const getPrecioParaOrdenar = (prod) => {
            if (prod.categoria === 'decants') {
                return prod.presentaciones && prod.presentaciones.length > 0 
                    ? prod.presentaciones[0].precio 
                    : 15;
            }
            return prod.precio || 0;
        };
        filtrados.sort((a, b) => getPrecioParaOrdenar(a) - getPrecioParaOrdenar(b));
    } else if (estado.orden === 'price-desc') {
        const getPrecioParaOrdenar = (prod) => {
            if (prod.categoria === 'decants') {
                return prod.presentaciones && prod.presentaciones.length > 0 
                    ? prod.presentaciones[0].precio 
                    : 15;
            }
            return prod.precio || 0;
        };
        filtrados.sort((a, b) => getPrecioParaOrdenar(b) - getPrecioParaOrdenar(a));
    }

    // 4. Renderizar tarjetas con el diseño completo aprobado
    if (estadoEl) estadoEl.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    filtrados.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const esDecant = prod.categoria === 'decants';
        const estaAgotado = esDecant
            ? (!prod.disponible || prod.mililitrosDisponibles < 3)
            : (!prod.disponible || prod.stock <= 0);

        if (estaAgotado) {
            card.classList.add('out-of-stock', 'is-soldout');
        }

        let tagHtml = '';
        if (!esDecant && prod.oferta && prod.disponible && prod.stock > 0) {
            tagHtml = `<span class="product-tag promo-tag">OFERTA</span>`;
        } else if (estaAgotado) {
            tagHtml = `<span class="product-tag out-tag">AGOTADO</span>`;
        }

        let categoryBadgeText = 'CATÁLOGO';
        let categoryBadgeShort = 'CATÁLOGO';
        if (prod.categoria === 'arabe') {
            categoryBadgeText = 'PERFUME ÁRABE';
            categoryBadgeShort = 'ÁRABE';
        } else if (prod.categoria === 'disenador') {
            categoryBadgeText = 'DISEÑADOR';
            categoryBadgeShort = 'DISEÑADOR';
        } else if (prod.categoria === 'nicho') {
            categoryBadgeText = 'NICHO';
            categoryBadgeShort = 'NICHO';
        } else if (prod.categoria === 'decants') {
            categoryBadgeText = 'DECANT';
            categoryBadgeShort = 'DECANT';
        }

        const precioMinDecant = (esDecant && prod.presentaciones && prod.presentaciones.length > 0)
            ? prod.presentaciones[0].precio 
            : 15;

        const precioActual = esDecant ? `Desde S/ ${precioMinDecant.toFixed(2)}` : 'S/ ' + (prod.precio || 0).toFixed(2);
        const precioAnteriorHtml = (!esDecant && prod.precioAnterior)
            ? `<span class="price-old">S/ ${prod.precioAnterior.toFixed(2)}</span>`
            : '';

        let discountBadgeHtml = '';
        if (!esDecant && prod.precioAnterior && prod.precioAnterior > prod.precio) {
            const pct = Math.round(((prod.precioAnterior - prod.precio) / prod.precioAnterior) * 100);
            if (pct > 0) {
                discountBadgeHtml = `<span class="discount-badge">${pct}% OFF</span>`;
            }
        }

        const presentacionFormateada = esDecant ? prod.presentacion : `Sellado · ${prod.presentacion || '100 ml'}`;

        const stockHtml = esDecant
            ? (prod.disponible && prod.mililitrosDisponibles >= 3
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${prod.mililitrosDisponibles} ml)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`)
            : (prod.disponible && prod.stock > 0
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${prod.stock} unid.)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`);

        let actionBtnHtml = '';
        const detailsBtnHtml = `
            <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="btn btn-outline btn-details-compact" aria-label="Ver detalles de ${prod.nombre}">
                <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Detalles
            </a>
        `;

        if (esDecant) {
            if (prod.disponible && prod.mililitrosDisponibles >= 3) {
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
                    <div class="card-buttons-flex">
                        ${detailsBtnHtml}
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
                <div class="card-buttons-flex">
                    ${detailsBtnHtml}
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
                <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="${loadingAttr}" decoding="async" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png'; console.warn('[Catálogo] Imagen no disponible para producto:', '${prod.id}');">
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
                    ${discountBadgeHtml}
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

    // Actualizar contador
    actualizarContador(filtrados.length, estado.categoria);
}

/**
 * Agrega eventos a los botones de comprar, agregar y links a detalles
 */
function vincularEventosGridCatalogo(grid, estado) {
    grid.querySelectorAll('a[href*="producto.html"], .btn-details-compact, .btn-select-option, .btn-view-details').forEach(link => {
        link.addEventListener('click', () => {
            if (estado) {
                guardarEstadoCatalogo(estado);
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

/**
 * Restablece todos los filtros del catálogo al estado inicial
 */
function limpiarTodosLosFiltros(productos, estado, grid) {
    estado.busqueda = '';
    estado.categoria = 'todos';
    estado.genero = 'todos';
    estado.orden = 'relevancia';
    estado.soloDisponibles = false;

    limpiarEstadoCatalogoGuardado();

    const searchInput = document.getElementById('search-perfume');
    if (searchInput) searchInput.value = '';

    const availableCheckbox = document.getElementById('filter-available');
    if (availableCheckbox) availableCheckbox.checked = false;

    const sortSelect = document.getElementById('sort-price');
    if (sortSelect) sortSelect.value = 'relevancia';

    sincronizarBotonesCategoria('todos');
    sincronizarBotonesGenero('todos');
    actualizarCabeceraCategoria('todos');
    actualizarURL('todos', 'todos');

    filtrarYRenderizar(productos, estado, grid);
}
