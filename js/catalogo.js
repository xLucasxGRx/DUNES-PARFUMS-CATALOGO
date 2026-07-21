/**
 * Dunes Parfums - módulo de catálogo (Lógica Avanzada)
 * Maneja los filtros, búsquedas, ordenación y renderizado de la página catalogo.html.
 */

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

    // Comprobar parámetros de la URL (?cat=decants)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam === 'decants' || catParam === 'sellados') {
        filtroEstado.categoria = catParam;

        // Actualizar visualmente los botones de categoría
        const categoryFilters = document.querySelectorAll('.filter-category-btn');
        categoryFilters.forEach(btn => {
            if (btn.dataset.categoria === catParam) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Inicializar controles de la interfaz
    inicializarFiltrosInterfaz(productos, filtroEstado, grid);

    // Renderizado inicial
    filtrarYRenderizar(productos, filtroEstado, grid);
});

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
        // Restaurar si hubiera valor previo
        searchInput.value = estado.busqueda;
        searchInput.addEventListener('input', (e) => {
            estado.busqueda = e.target.value.toLowerCase().trim();
            filtrarYRenderizar(productos, estado, grid);
        });
    }

    // Filtros de Categoría (Ver Todos, Sellados, Decants)
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            estado.categoria = e.currentTarget.dataset.categoria;
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

    // 1. Filtrar
    let filtrados = productos.filter(prod => {
        // Filtro de categoría
        if (estado.categoria !== 'todos' && prod.categoria !== estado.categoria) {
            return false;
        }

        // Filtro de texto (nombre o marca)
        if (estado.busqueda) {
            const nombreMatches = prod.nombre.toLowerCase().includes(estado.busqueda);
            const marcaMatches = prod.marca.toLowerCase().includes(estado.busqueda);
            if (!nombreMatches && !marcaMatches) {
                return false;
            }
        }

        // Filtro de sólo disponibles
        if (estado.soloDisponibles && (!prod.disponible || prod.stock <= 0)) {
            return false;
        }

        return true;
    });

    // 2. Ordenar
    if (estado.orden === 'price-asc') {
        filtrados.sort((a, b) => a.precio - b.precio);
    } else if (estado.orden === 'price-desc') {
        filtrados.sort((a, b) => b.precio - a.precio);
    }

    // 3. Renderizar
    grid.innerHTML = '';

    if (filtrados.length === 0) {
        grid.innerHTML = '<p class="no-products-msg">No se encontraron perfumes que coincidan con tu búsqueda.</p>';
        return;
    }

    filtrados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const esDecant = prod.categoria === 'decants';
        const estaAgotado = esDecant
            ? (!prod.disponible || prod.mililitrosDisponibles < 3)
            : (!prod.disponible || prod.stock <= 0);

        if (estaAgotado) {
            card.classList.add('out-of-stock');
        }

        // Etiquetas de oferta o agotado
        let tagHtml = '';
        if (!esDecant && prod.oferta && prod.disponible && prod.stock > 0) {
            tagHtml = `<span class="product-tag promo-tag">Oferta</span>`;
        } else if (estaAgotado) {
            tagHtml = `<span class="product-tag out-tag">Agotado</span>`;
        }

        const precioActual = esDecant ? 'Desde S/ 15.00' : 'S/ ' + prod.precio.toFixed(2);
        const precioAnteriorHtml = (!esDecant && prod.precioAnterior)
            ? `<span class="price-old">S/ ${prod.precioAnterior.toFixed(2)}</span>`
            : '';

        const presentacionFormateada = esDecant ? prod.presentacion : `Sellado / ${prod.presentacion}`;

        const stockHtml = esDecant
            ? (prod.disponible && prod.mililitrosDisponibles >= 3
                ? `<span class="product-stock-status">Disponible (${prod.mililitrosDisponibles} ml)</span>`
                : `<span class="product-stock-status out">Agotado</span>`)
            : (prod.disponible && prod.stock > 0
                ? `<span class="product-stock-status">Disponible (${prod.stock} unid.)</span>`
                : `<span class="product-stock-status out">Agotado</span>`);

        let actionBtnHtml = '';
        if (esDecant) {
            if (prod.disponible && prod.mililitrosDisponibles >= 3) {
                actionBtnHtml = `
                    <a href="producto.html?id=${prod.id}" class="btn btn-primary btn-select-option">
                        Seleccionar Presentación
                    </a>
                `;
            } else {
                actionBtnHtml = `
                    <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                        <span class="btn-icon">💬</span> Consultar
                    </button>
                `;
            }
        } else if (prod.disponible && prod.stock > 0) {
            actionBtnHtml = `
                <button class="btn btn-primary btn-add-cart" data-id="${prod.id}" data-nombre="${prod.nombre}">
                    <span class="btn-icon">🛒</span> Agregar
                </button>
            `;
        } else {
            actionBtnHtml = `
                <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                    <span class="btn-icon">💬</span> Consultar
                </button>
            `;
        }

        card.innerHTML = `
            <div class="product-image-container">
                ${tagHtml}
                <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="lazy">
                <div class="product-actions-overlay">
                    <a href="producto.html?id=${prod.id}" class="btn btn-light-glass btn-view-details">Ver Detalles</a>
                </div>
            </div>
            <div class="product-info">
                <span class="product-brand">${prod.marca}</span>
                <h3 class="product-title">${prod.nombre}</h3>
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
                <div class="product-card-footer">
                    ${actionBtnHtml}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    // Vincular eventos de adición y WhatsApp
    vincularEventosGridCatalogo(grid);
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
