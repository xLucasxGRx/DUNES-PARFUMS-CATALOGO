/**
 * Dunes Parfums - Lógica de la Página Mis Favoritos (js/favoritos-page.js - FASE M14)
 */
(function(window, document) {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        inicializarPaginaFavoritos();
    });

    async function inicializarPaginaFavoritos() {
        const grid = document.getElementById('favorites-products-grid');
        const emptyState = document.getElementById('favorites-empty-state');
        const errorState = document.getElementById('favorites-error-state');
        if (!grid || !emptyState) return;

        const idsFavoritosRaw = window.FavoritosService ? window.FavoritosService.obtenerFavoritos() : [];

        // 1. Si no hay ningún ID favorito guardado, mostrar estado vacío directamente
        if (!idsFavoritosRaw || idsFavoritosRaw.length === 0) {
            if (errorState) errorState.style.display = 'none';
            grid.style.display = 'none';
            grid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        // 2. Si hay IDs guardados, mostrar skeletons mientras carga (no estado vacío)
        mostrarSkeletonsFavoritos(grid);
        emptyState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';

        try {
            // Reutilizar productosModulo.obtenerProductos() de productos.js
            let productos = [];
            if (window.productosModulo && typeof window.productosModulo.obtenerProductos === 'function') {
                productos = await window.productosModulo.obtenerProductos();
            } else if (window.ProductosService && typeof window.ProductosService.cargarProductos === 'function') {
                const res = await window.ProductosService.cargarProductos();
                productos = res ? (res.productos || []) : [];
            }

            // Si falló la carga o regresó arreglo vacío, mostrar estado de ERROR con botón REINTENTAR
            if (!productos || productos.length === 0) {
                mostrarErrorFavoritos(grid, emptyState, errorState, inicializarPaginaFavoritos);
                return;
            }

            // Limpieza segura de IDs obsoletos tras carga exitosa de catálogo no vacío
            const todosLosIds = productos.map(p => String(p.id).trim());
            if (window.FavoritosService) {
                window.FavoritosService.limpiarFavoritosInexistentes(todosLosIds);
            }

            const idsActuales = window.FavoritosService ? window.FavoritosService.obtenerFavoritos() : [];
            renderizarFavoritos(productos, idsActuales);

            // Escuchar eventos de actualización para sincronizar si el usuario quita un favorito desde la misma página
            if (!window._favPageListenerBound) {
                window._favPageListenerBound = true;
                window.addEventListener('dunes:favoritos:updated', function(e) {
                    const nuevosIds = e.detail ? e.detail.ids : (window.FavoritosService ? window.FavoritosService.obtenerFavoritos() : []);
                    renderizarFavoritos(productos, nuevosIds);
                });
            }

        } catch (err) {
            console.error('[FavoritosPage] Error al obtener productos:', err);
            mostrarErrorFavoritos(grid, emptyState, errorState, inicializarPaginaFavoritos);
        }
    }

    function mostrarSkeletonsFavoritos(grid) {
        if (!grid) return;
        grid.style.display = 'grid';
        let html = '';
        for (let i = 0; i < 4; i++) {
            html += `
                <div class="product-card-skeleton" aria-hidden="true" style="background: #FFF; border-radius: 14px; padding: 12px; border: 1px solid #EBE6DC;">
                    <div class="skeleton-pulse" style="width: 100%; height: 220px; border-radius: 10px; background: #F4EFE6;"></div>
                    <div style="padding: 12px 4px; display: flex; flex-direction: column; gap: 8px;">
                        <div class="skeleton-pulse" style="width: 40%; height: 12px; background: #F4EFE6;"></div>
                        <div class="skeleton-pulse" style="width: 80%; height: 18px; background: #F4EFE6;"></div>
                        <div class="skeleton-pulse" style="width: 60%; height: 16px; background: #F4EFE6;"></div>
                    </div>
                </div>
            `;
        }
        grid.innerHTML = html;
    }

    function mostrarErrorFavoritos(grid, emptyState, errorState, callbackReintentar) {
        grid.style.display = 'none';
        emptyState.style.display = 'none';

        if (errorState) {
            errorState.style.display = 'flex';
            const btnRetry = errorState.querySelector('#btn-reintentar-favoritos');
            if (btnRetry && typeof callbackReintentar === 'function') {
                btnRetry.onclick = function(e) {
                    e.preventDefault();
                    btnRetry.disabled = true;
                    btnRetry.textContent = 'Reintentando...';
                    callbackReintentar();
                };
            }
        }
    }

    function renderizarFavoritos(todosLosProductos, idsFavoritos) {
        const grid = document.getElementById('favorites-products-grid');
        const emptyState = document.getElementById('favorites-empty-state');
        const errorState = document.getElementById('favorites-error-state');
        if (!grid || !emptyState) return;

        if (errorState) errorState.style.display = 'none';

        const setIds = new Set((idsFavoritos || []).map(id => String(id).trim()));

        if (setIds.size === 0) {
            grid.style.display = 'none';
            grid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        // Filtrar productos cuya ID normalizada como String(p.id).trim() esté en setIds
        const favoritosProds = (todosLosProductos || []).filter(p => p && p.id && setIds.has(String(p.id).trim()));

        if (favoritosProds.length === 0) {
            grid.style.display = 'none';
            grid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = '';

        favoritosProds.forEach((prod, index) => {
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
            if (prod.categoria === 'arabe') categoryBadgeText = 'PERFUME ÁRABE';
            else if (prod.categoria === 'disenador') categoryBadgeText = 'DISEÑADOR';
            else if (prod.categoria === 'nicho') categoryBadgeText = 'NICHO';
            else if (prod.categoria === 'decants') categoryBadgeText = 'DECANT';

            const precioMinDecant = (esDecant && prod.presentaciones && prod.presentaciones.length > 0)
                ? prod.presentaciones[0].precio 
                : 15;

            const precioActual = esDecant ? `Desde S/ ${precioMinDecant.toFixed(2)}` : 'S/ ' + (prod.precio || 0).toFixed(2);
            const precioAnteriorHtml = (!esDecant && prod.precioAnterior)
                ? `<span class="price-old">S/ ${prod.precioAnterior.toFixed(2)}</span>`
                : '';

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
                            <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="btn btn-primary btn-select-option" aria-label="Seleccionar presentación para ${prod.nombre}">
                                Seleccionar
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

            const favBtnHtml = `
                <button type="button" class="favorite-toggle-btn is-active" data-id="${prod.id}" data-nombre="${prod.nombre}" aria-label="Quitar ${prod.nombre} de favoritos" aria-pressed="true">
                    <svg class="favorite-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                </button>
            `;

            const loadingAttr = index < 4 ? 'eager' : 'lazy';

            const divContainer = document.createElement('div');
            divContainer.className = 'product-image-container';
            divContainer.innerHTML = `
                ${tagHtml}
                ${favBtnHtml}
                <span class="product-category-badge">${categoryBadgeText}</span>
                <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="product-image-link" tabindex="-1">
                    <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="${loadingAttr}">
                </a>
            `;

            const divInfo = document.createElement('div');
            divInfo.className = 'product-info';

            const divBrand = document.createElement('div');
            divBrand.className = 'product-brand';
            divBrand.textContent = prod.marca;

            const h3Title = document.createElement('h3');
            h3Title.className = 'product-title';
            h3Title.textContent = prod.nombre;

            const divVol = document.createElement('div');
            divVol.className = 'product-volume';
            divVol.textContent = presentacionFormateada;

            const divStockRow = document.createElement('div');
            divStockRow.className = 'product-stock-row';
            divStockRow.innerHTML = stockHtml;

            const divPriceRow = document.createElement('div');
            divPriceRow.className = 'product-price-row';
            divPriceRow.innerHTML = `
                <div class="prices">
                    ${precioAnteriorHtml}
                    <span class="price-current">${precioActual}</span>
                </div>
            `;

            const divFooter = document.createElement('div');
            divFooter.className = 'product-card-footer';
            divFooter.innerHTML = actionBtnHtml;

            divInfo.appendChild(divBrand);
            divInfo.appendChild(h3Title);
            divInfo.appendChild(divVol);
            divInfo.appendChild(divStockRow);
            divInfo.appendChild(divPriceRow);

            card.appendChild(divContainer);
            card.appendChild(divInfo);
            card.appendChild(divFooter);

            grid.appendChild(card);
        });

        // Vincular eventos de agregar al carrito y consultar WhatsApp a las tarjetas de favoritos
        vincularEventosGridFavoritos(grid);
    }

    /**
     * Vincula los eventos de clic a los botones de la cuadrícula de favoritos (Agregar al carrito y Consultar WhatsApp)
     * Reutiliza exactamente el flujo original de window.carritoModulo.agregarAlCarrito
     */
    function vincularEventosGridFavoritos(grid) {
        if (!grid) return;

        // Botones de agregar al carrito (sellados) -> Reutiliza window.carritoModulo.agregarAlCarrito
        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.dataset.id;
                if (id && window.carritoModulo && typeof window.carritoModulo.agregarAlCarrito === 'function') {
                    window.carritoModulo.agregarAlCarrito(id, 1, null);
                }
            });
        });

        // Botones de consulta por agotado o WhatsApp
        grid.querySelectorAll('.btn-query-wa').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const nombre = this.dataset.nombre;
                const marca = this.dataset.marca;
                if (window.whatsappConfig && typeof window.whatsappConfig.consultarDisponibilidad === 'function') {
                    window.whatsappConfig.consultarDisponibilidad(nombre, marca, 'Presentación estándar');
                }
            });
        });
    }

})(typeof window !== 'undefined' ? window : globalThis, document);
