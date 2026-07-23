/**
 * Dunes Parfums - módulo de catálogo (Lógica Avanzada)
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

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('catalogo-productos-grid');
    if (!grid) return; // No estamos en catalogo.html

    // Cargar productos
    const productos = await window.productosModulo.obtenerProductos();

    if (!productos || productos.length === 0) {
        grid.innerHTML = '<p class="no-products-msg">No fue posible cargar el catálogo en este momento.</p>';
        return;
    }

    // Estado de filtros
    let filtroEstado = {
        busqueda: '',
        categoria: 'todos',
        orden: 'default',
        soloDisponibles: false
    };

    // Comprobar parámetros de la URL (?categoria=arabe)
    const initialCat = obtenerCategoriaDesdeURL();
    filtroEstado.categoria = initialCat;

    // Actualizar visualmente los botones de categoría e iniciar aria-pressed
    sincronizarBotonesCategoria(initialCat);

    // Actualizar cabecera con el título dinámico
    actualizarCabeceraCategoria(initialCat);

    // Inicializar controles de la interfaz
    inicializarFiltrosInterfaz(productos, filtroEstado, grid);

    // Escuchar el evento popstate para la navegación atrás/adelante
    window.addEventListener('popstate', (e) => {
        const cat = obtenerCategoriaDesdeURL();
        filtroEstado.categoria = cat;
        
        // Sincronizar UI de filtros de categoría
        sincronizarBotonesCategoria(cat);
        actualizarCabeceraCategoria(cat);

        // Sincronizar controles (buscador y disponibles checkbox si cambiaron)
        const searchInput = document.getElementById('search-perfume');
        if (searchInput) searchInput.value = filtroEstado.busqueda;
        const availableCheckbox = document.getElementById('filter-available');
        if (availableCheckbox) availableCheckbox.checked = filtroEstado.soloDisponibles;

        filtrarYRenderizar(productos, filtroEstado, grid);
    });

    // Renderizado inicial
    filtrarYRenderizar(productos, filtroEstado, grid);
});

/**
 * Obtiene el valor de la categoría desde los parámetros de búsqueda de la URL
 */
function obtenerCategoriaDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    const validas = ['arabe', 'disenador', 'nicho', 'decants'];
    return validas.includes(cat) ? cat : 'todos';
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
function actualizarURL(categoria) {
    const url = new URL(window.location.href);
    if (categoria === 'todos') {
        url.searchParams.delete('categoria');
    } else {
        url.searchParams.set('categoria', categoria);
    }
    const currentParams = window.location.search;
    const newParams = url.search;
    if (currentParams !== newParams) {
        history.pushState({ categoria }, '', url.pathname + url.search);
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
    const sortSelect = document.getElementById('sort-price');
    const availableCheckbox = document.getElementById('filter-available');

    // Búsqueda por texto (Nombre / Marca)
    if (searchInput) {
        searchInput.value = estado.busqueda;
        searchInput.addEventListener('input', (e) => {
            estado.busqueda = e.target.value.toLowerCase().trim();
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
            actualizarURL(selectedCat);
            
            filtrarYRenderizar(productos, estado, grid);
        });
    });

    // Ordenamiento por precio
    if (sortSelect) {
        sortSelect.value = estado.orden;
        sortSelect.addEventListener('change', (e) => {
            estado.orden = e.target.value;
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Checkbox de Disponibles
    if (availableCheckbox) {
        availableCheckbox.checked = estado.soloDisponibles;
        availableCheckbox.addEventListener('change', (e) => {
            estado.soloDisponibles = e.target.checked;
            filtrarYRenderizar(productos, estado, grid);
        });
    }
}

/**
 * Filtra la lista de productos y la renderiza en el grid del DOM
 */
function filtrarYRenderizar(productos, estado, grid) {
    grid.innerHTML = '<div class="loading-spinner">Filtrando fragancias...</div>';

    // 1. Filtrar visible y categoría comercial
    const productosEnCategoria = productos.filter(prod => {
        return prod.visible !== false && (estado.categoria === 'todos' || prod.categoria === estado.categoria);
    });

    const estadoEl = document.getElementById('estado-catalogo');
    const mensajeEl = document.getElementById('estado-catalogo-mensaje');
    const secContainer = document.getElementById('cotizacion-secundaria-container');

    // CONFIGURACIÓN DE WHATSAPP PARA LA CATEGORÍA ACTIVA
    const config = obtenerConfiguracionCotizacion(estado.categoria);
    const waUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(config.whatsappTexto)}`;

    // CASO A — No existen productos en la categoría
    if (productosEnCategoria.length === 0) {
        grid.style.display = 'none';
        if (secContainer) {
            secContainer.style.display = 'none';
            secContainer.innerHTML = '';
        }

        if (estadoEl && mensajeEl) {
            const iconContainer = document.getElementById('estado-catalogo-icon');
            if (iconContainer) iconContainer.innerHTML = '<i data-lucide="shopping-bag" class="icon-xl" style="color: var(--catalog-gold, #B18225);"></i>';
            document.getElementById('estado-catalogo-titulo').textContent = 'Sin stock disponible';
            mensajeEl.textContent = config.sinStockMensaje;
            
            // Sección de Cotizar
            document.getElementById('estado-catalogo-cotizar-bloque').style.display = 'block';
            document.getElementById('estado-catalogo-cotizar-titulo').textContent = config.cotizarTitulo;
            document.getElementById('estado-catalogo-cotizar-texto').textContent = config.cotizarDescripcion;
            
            // Configurar botón principal de WhatsApp
            const waBtn = document.getElementById('estado-catalogo-btn-wa');
            if (waBtn) {
                waBtn.href = waUrl;
                waBtn.setAttribute('aria-label', config.ariaLabel);
                document.getElementById('estado-catalogo-btn-wa-texto').textContent = config.botonTexto;
            }
            
            // Ocultar botón secundario
            const secBtn = document.getElementById('estado-catalogo-btn-secundario');
            if (secBtn) secBtn.style.display = 'none';

            estadoEl.style.display = 'block';
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
        actualizarContador(0, estado.categoria);
        return;
    }

    // 2. Aplicar el resto de los filtros (búsqueda y disponibilidad)
    let filtrados = productosEnCategoria.filter(prod => {
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

    // MANEJO DE CASOS DE FILTROS VACÍOS (B y C)
    if (filtrados.length === 0) {
        grid.style.display = 'none';
        if (secContainer) {
            secContainer.style.display = 'none';
            secContainer.innerHTML = '';
        }

        if (estadoEl && mensajeEl) {
            // Configurar bloque de cotización base
            document.getElementById('estado-catalogo-cotizar-bloque').style.display = 'block';
            document.getElementById('estado-catalogo-cotizar-titulo').textContent = config.cotizarTitulo;
            document.getElementById('estado-catalogo-cotizar-texto').textContent = config.cotizarDescripcion;
            
            const waBtn = document.getElementById('estado-catalogo-btn-wa');
            if (waBtn) {
                waBtn.href = waUrl;
                waBtn.setAttribute('aria-label', config.ariaLabel);
                document.getElementById('estado-catalogo-btn-wa-texto').textContent = config.botonTexto;
            }

            const secBtn = document.getElementById('estado-catalogo-btn-secundario');
            const newSecBtn = secBtn.cloneNode(true);
            secBtn.parentNode.replaceChild(newSecBtn, secBtn);

            const iconContainer = document.getElementById('estado-catalogo-icon');

            // CASO C — La búsqueda no encuentra coincidencias
            if (estado.busqueda) {
                if (iconContainer) iconContainer.innerHTML = '<i data-lucide="search" class="icon-xl" style="color: var(--catalog-gold, #B18225);"></i>';
                document.getElementById('estado-catalogo-titulo').textContent = 'No encontramos resultados';
                mensajeEl.textContent = 'No encontramos productos que coincidan con tu búsqueda.';
                
                newSecBtn.textContent = 'Limpiar búsqueda';
                newSecBtn.style.display = 'inline-block';
                newSecBtn.addEventListener('click', () => {
                    const searchInput = document.getElementById('search-perfume');
                    if (searchInput) searchInput.value = '';
                    estado.busqueda = '';
                    filtrarYRenderizar(productos, estado, grid);
                });
            }
            // CASO B — Filtro “Solo disponibles” excluyó todos
            else if (estado.soloDisponibles) {
                if (iconContainer) iconContainer.innerHTML = '<i data-lucide="package-x" class="icon-xl" style="color: var(--catalog-gold, #B18225);"></i>';
                document.getElementById('estado-catalogo-titulo').textContent = 'Sin stock disponible';
                mensajeEl.textContent = 'No hay productos disponibles con los filtros seleccionados.';
                
                newSecBtn.textContent = 'Ver también productos agotados';
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

    // 4. Renderizar
    if (estadoEl) estadoEl.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    filtrados.forEach(prod => {
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

        const precioActual = esDecant ? `Desde S/ ${precioMinDecant.toFixed(2)}` : 'S/ ' + prod.precio.toFixed(2);
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

        const presentacionFormateada = esDecant ? prod.presentacion : `Sellado · ${prod.presentacion}`;

        const stockHtml = esDecant
            ? (prod.disponible && prod.mililitrosDisponibles >= 3
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${prod.mililitrosDisponibles} ml)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`)
            : (prod.disponible && prod.stock > 0
                ? `<span class="product-stock-status in-stock"><span class="stock-dot"></span>Disponible (${prod.stock} unid.)</span>`
                : `<span class="product-stock-status out"><span class="stock-dot"></span>Agotado</span>`);

        let actionBtnHtml = '';
        const detailsBtnHtml = `
            <a href="producto.html?id=${prod.id}" class="btn btn-outline btn-details-compact" aria-label="Ver detalles de ${prod.nombre}">
                <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Detalles
            </a>
        `;

        if (esDecant) {
            if (prod.disponible && prod.mililitrosDisponibles >= 3) {
                actionBtnHtml = `
                    <div class="card-buttons-flex">
                        ${detailsBtnHtml}
                        <a href="producto.html?id=${prod.id}" class="btn btn-primary btn-select-option">
                            Opciones
                        </a>
                    </div>
                `;
            } else {
                actionBtnHtml = `
                    <div class="card-buttons-flex">
                        ${detailsBtnHtml}
                        <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                            <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Consultar
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
                        <svg class="btn-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Consultar
                    </button>
                </div>
            `;
        }

        const divContainer = document.createElement('div');
        divContainer.className = 'product-image-container';
        divContainer.innerHTML = `
            ${tagHtml}
            <span class="product-category-badge">${categoryBadgeText}</span>
            <a href="producto.html?id=${prod.id}" class="product-img-link" aria-label="Ver detalles de ${prod.nombre}">
                <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="lazy">
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
    vincularEventosGridCatalogo(grid);

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

        // Ajustes para "Ver Todos"
        if (estado.categoria === 'todos') {
            subtituloTexto = "¿No encuentras el perfume que buscas?";
            descTexto = "Cotízalo con nosotros y te ayudamos a conseguirlo.";
        }

        secContainer.innerHTML = `
            <div class="secondary-quote-block" style="text-align: center; padding: 40px 20px; background-color: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: var(--border-radius-md); max-width: 600px; margin: 40px auto; box-shadow: var(--box-shadow-sm);">
                <h3 style="font-family: var(--font-title); font-size: 1.25rem; color: var(--color-text); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;"></h3>
                <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;"></p>
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;" aria-label="${config.ariaLabel}">
                    <i data-lucide="message-square" class="icon-sm" aria-hidden="true" style="margin-right: 4px;"></i>
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
 * Agrega eventos a los botones de comprar y agregar
 */
function vincularEventosGridCatalogo(grid) {
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
