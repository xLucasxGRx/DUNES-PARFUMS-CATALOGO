/**
 * Dunes Parfums - Módulo del Comparador Automático por Fichas Olfativas (FASE M24.4)
 * Corrección de la disponibilidad del servicio centralizado ProductosService
 * y verificación paso a paso de los filtros de elegibilidad (Sellados y Decants).
 */

(function () {
    'use strict';

    const state = {
        modo: null, // 'sellados' | 'decants'
        productos: [],
        cargando: false,
        izq: {
            producto: null,
            busqueda: '',
            varianteMl: null,
            cantidad: 1
        },
        der: {
            producto: null,
            busqueda: '',
            varianteMl: null,
            cantidad: 1
        }
    };

    let searchDebounceTimer = null;

    /**
     * Normaliza cadenas para búsqueda insensible a mayúsculas, espacios y acentos
     */
    function normalizarTexto(str) {
        if (!str) return '';
        return String(str)
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Inicialización al cargar el DOM
     */
    document.addEventListener('DOMContentLoaded', async () => {
        configurarBotoneraModos();
        verificarUrlModo();
        configurarCierreDropdownsExternos();
        await cargarProductos();
    });

    /**
     * Carga todos los productos centralizadamente desde ProductosService
     */
    async function cargarProductos() {
        state.cargando = true;
        try {
            const service = window.ProductosService || (typeof ProductosService !== 'undefined' ? ProductosService : null);
            let todos = [];

            if (service && typeof service.cargarProductos === 'function') {
                const res = await (window.ProductosService ? window.ProductosService.cargarProductos() : ProductosService.cargarProductos());
                todos = res ? (res.productos || []) : [];
            } else if (window.productosModulo && typeof window.productosModulo.obtenerProductos === 'function') {
                todos = await window.productosModulo.obtenerProductos();
            } else {
                console.error('[Comparador] No se encontró servicio de productos disponible.');
            }

            // Conservar todos los productos válidos devueltos por ProductosService (visible !== false)
            state.productos = (todos || []).filter(p => p && p.visible !== false);
        } catch (err) {
            console.error('[Comparador] Error al cargar productos:', err);
        } finally {
            state.cargando = false;
            // Sincronizar columnas si ya hay un modo activo al finalizar la carga
            if (state.modo) {
                renderizarLado('izq');
                renderizarLado('der');
            }
        }
    }

    /**
     * Configura escuchadores de la botonera de modo (SELLADOS / DECANTS)
     */
    function configurarBotoneraModos() {
        const btnSellados = document.getElementById('btn-mode-sellados');
        const btnDecants = document.getElementById('btn-mode-decants');

        if (btnSellados) {
            btnSellados.addEventListener('click', () => seleccionarModo('sellados'));
        }
        if (btnDecants) {
            btnDecants.addEventListener('click', () => seleccionarModo('decants'));
        }
    }

    /**
     * Cierra desplegables de búsqueda al hacer clic fuera del área activa
     */
    function configurarCierreDropdownsExternos() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.comparator-search-box')) {
                document.querySelectorAll('.comparator-dropdown-results').forEach(el => el.classList.add('is-hidden'));
            }
        });
    }

    /**
     * Permite abrir un modo mediante parámetro en la URL ?modo=sellados|decants, o por defecto 'sellados'
     */
    function verificarUrlModo() {
        const params = new URLSearchParams(window.location.search);
        const modoParam = params.get('modo');
        if (modoParam === 'sellados' || modoParam === 'decants') {
            seleccionarModo(modoParam);
        } else {
            // Modo por defecto inicial
            seleccionarModo('sellados');
        }
    }

    /**
     * Selecciona el modo de comparación activo (sellados o decants)
     */
    function seleccionarModo(nuevoModo, forceRender = false) {
        if (state.modo === nuevoModo && !forceRender) return;

        state.modo = nuevoModo;

        // Limpiar selecciones de ambos lados
        limpiarLado('izq', false);
        limpiarLado('der', false);

        // Actualizar estado activo en botones
        const btnSellados = document.getElementById('btn-mode-sellados');
        const btnDecants = document.getElementById('btn-mode-decants');

        if (btnSellados) btnSellados.classList.toggle('is-selected', nuevoModo === 'sellados');
        if (btnDecants) btnDecants.classList.toggle('is-selected', nuevoModo === 'decants');

        // Revelar contenedor principal
        const mainContainer = document.getElementById('comparador-main-container');
        if (mainContainer) {
            mainContainer.classList.remove('is-hidden');
        }

        renderizarLado('izq');
        renderizarLado('der');
    }

    /**
     * Limpia el estado de un lado del comparador
     */
    function limpiarLado(ladoKey, autoRender = true) {
        state[ladoKey] = {
            producto: null,
            busqueda: '',
            varianteMl: null,
            cantidad: 1
        };
        if (autoRender) {
            renderizarLado(ladoKey);
            const otroLadoKey = ladoKey === 'izq' ? 'der' : 'izq';
            if (!state[otroLadoKey].producto) {
                renderizarLado(otroLadoKey);
            }
        }
    }

    /**
     * Filtra productos elegibles según el modo y excluyendo el producto del otro lado
     */
    function obtenerProductosElegibles(excluirId = null) {
        if (!state.modo) return [];

        return state.productos.filter(p => {
            // Regla 1: visible !== false
            if (p.visible === false) return false;

            // Regla 2: Exclusión cruzada de ID
            if (excluirId && String(p.id).trim() === String(excluirId).trim()) {
                return false;
            }

            // Regla 3: imagen_notas (o imagenNotas) debe ser una cadena no vacía
            const notasRaw = p.imagen_notas ?? p.imagenNotas;
            const tieneNotas = typeof notasRaw === 'string' && notasRaw.trim().length > 0;
            if (!tieneNotas) return false;

            if (state.modo === 'sellados') {
                // MODO SELLADOS:
                // - stock > 0
                // - No ser decant puro exclusivo
                const esDecantPuro = p.categoria === 'decants' || p.formato === 'Decants de 3, 5 y 10 ml';
                const stockVal = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0;
                return stockVal > 0 && !esDecantPuro;
            } else if (state.modo === 'decants') {
                // MODO DECANTS:
                // - Categoría decant o formato decant o presentaciones de decant disponibles
                // - NO requiere stock > 0 del frasco sellado
                const tienePresentaciones = (p.presentaciones && p.presentaciones.length > 0) ||
                    (p.precio_3ml > 0 || p.precio_5ml > 0 || p.precio_10ml > 0);
                const esDecant = p.categoria === 'decants' || p.formato === 'Decants de 3, 5 y 10 ml' || tienePresentaciones;
                return esDecant;
            }

            return false;
        });
    }

    /**
     * Renderiza la columna del lado indicado (izq o der)
     */
    function renderizarLado(ladoKey) {
        const colEl = document.getElementById(ladoKey === 'izq' ? 'col-izquierdo' : 'col-derecho');
        if (!colEl) return;

        const sideData = state[ladoKey];
        const otroLadoKey = ladoKey === 'izq' ? 'der' : 'izq';
        const productoOpuesto = state[otroLadoKey].producto;
        const idExcluir = productoOpuesto ? productoOpuesto.id : null;

        colEl.innerHTML = '';

        if (!sideData.producto) {
            colEl.appendChild(crearComponenteBuscador(ladoKey, idExcluir));
        } else {
            colEl.appendChild(crearComponenteFicha(ladoKey, sideData.producto));
        }
    }

    /**
     * Crea el mini buscador elegante con dropdown flotante
     */
    function crearComponenteBuscador(ladoKey, idExcluir) {
        const box = document.createElement('div');
        box.className = 'comparator-search-box';

        const labelTitle = document.createElement('h3');
        labelTitle.className = 'comparator-side-label';
        labelTitle.textContent = ladoKey === 'izq' ? 'PERFUME 1' : 'PERFUME 2';
        box.appendChild(labelTitle);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'comparator-input-wrapper';

        const searchIconSvg = `
            <svg class="comparator-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'comparator-search-input';
        input.placeholder = 'Buscar perfume...';
        input.value = state[ladoKey].busqueda;
        input.setAttribute('aria-label', `Buscar ${ladoKey === 'izq' ? 'Perfume 1' : 'Perfume 2'}`);

        inputWrapper.innerHTML = searchIconSvg;
        inputWrapper.appendChild(input);
        box.appendChild(inputWrapper);

        // Contenedor Dropdown Flotante
        const dropdown = document.createElement('div');
        dropdown.className = 'comparator-dropdown-results is-hidden';
        box.appendChild(dropdown);

        // Renderizado del desplegable
        const ejecutarBusqueda = () => {
            const queryNorm = normalizarTexto(input.value);
            state[ladoKey].busqueda = input.value;

            if (state.cargando) {
                dropdown.innerHTML = '<div class="comparator-empty-msg">CARGANDO FRAGANCIAS...</div>';
                dropdown.classList.remove('is-hidden');
                return;
            }

            const elegibles = obtenerProductosElegibles(idExcluir);

            // ESTADO C — REALMENTE NO EXISTE NINGÚN PRODUCTO ELEGIBLE EN ESTE MODO
            if (elegibles.length === 0) {
                dropdown.innerHTML = '<div class="comparator-empty-msg">NO HAY PERFUMES DISPONIBLES PARA COMPARAR EN ESTE MOMENTO.</div>';
                dropdown.classList.remove('is-hidden');
                return;
            }

            let resultados = elegibles;
            if (queryNorm !== '') {
                resultados = elegibles.filter(p => {
                    const nomNorm = normalizarTexto(p.nombre);
                    const marNorm = normalizarTexto(p.marca);
                    const comboNorm = normalizarTexto(`${p.nombre} ${p.marca}`);
                    return nomNorm.includes(queryNorm) || marNorm.includes(queryNorm) || comboNorm.includes(queryNorm);
                });
            }

            dropdown.innerHTML = '';

            // ESTADO B — EXISTEN PRODUCTOS ELEGIBLES PERO NO HAY COINCIDENCIA CON LA CONSULTA
            if (resultados.length === 0) {
                dropdown.innerHTML = '<div class="comparator-empty-msg">NO ENCONTRAMOS COINCIDENCIAS</div>';
                dropdown.classList.remove('is-hidden');
                return;
            }

            // ESTADO A — RENDERIZAR RESULTADOS ELEGIBLES (máximo 8)
            resultados.slice(0, 8).forEach(prod => {
                const itemBtn = document.createElement('button');
                itemBtn.type = 'button';
                itemBtn.className = 'comparator-dropdown-item';

                const service = window.ProductosService || (typeof ProductosService !== 'undefined' ? ProductosService : null);
                const thumbUrl = service && typeof service.resolverImagen === 'function' ? service.resolverImagen(prod.imagen) : prod.imagen;

                itemBtn.innerHTML = `
                    <img src="${thumbUrl}" alt="${prod.nombre}" class="comparator-thumb" loading="lazy" decoding="async">
                    <div class="comparator-item-meta">
                        <span class="comparator-item-brand">${prod.marca || ''}</span>
                        <strong class="comparator-item-name">${prod.nombre || ''}</strong>
                    </div>
                `;

                itemBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.add('is-hidden');
                    seleccionarProducto(ladoKey, prod);
                });

                dropdown.appendChild(itemBtn);
            });

            dropdown.classList.remove('is-hidden');
        };

        input.addEventListener('focus', ejecutarBusqueda);
        input.addEventListener('input', () => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(ejecutarBusqueda, 120);
        });

        return box;
    }

    /**
     * Selecciona un producto para un lado del comparador
     */
    function seleccionarProducto(ladoKey, producto) {
        state[ladoKey].producto = producto;
        state[ladoKey].cantidad = 1;

        if (state.modo === 'decants') {
            const presentaciones = obtenerPresentacionesDecant(producto);
            state[ladoKey].varianteMl = presentaciones.length > 0 ? presentaciones[0].ml : null;
        } else {
            state[ladoKey].varianteMl = null;
        }

        renderizarLado(ladoKey);

        const otroLadoKey = ladoKey === 'izq' ? 'der' : 'izq';
        if (!state[otroLadoKey].producto) {
            renderizarLado(otroLadoKey);
        }
    }

    /**
     * Obtiene las presentaciones disponibles del decant
     */
    function obtenerPresentacionesDecant(producto) {
        if (producto.presentaciones && Array.isArray(producto.presentaciones) && producto.presentaciones.length > 0) {
            return producto.presentaciones;
        }

        const pres = [];
        if (producto.precio_3ml > 0) pres.push({ ml: 3, nombre: 'Decant 3 ml', precio: producto.precio_3ml });
        if (producto.precio_5ml > 0) pres.push({ ml: 5, nombre: 'Decant 5 ml', precio: producto.precio_5ml });
        if (producto.precio_10ml > 0) pres.push({ ml: 10, nombre: 'Decant 10 ml', precio: producto.precio_10ml });

        return pres;
    }

    /**
     * Crea la vista de Ficha Olfativa cuando hay un producto seleccionado
     */
    function crearComponenteFicha(ladoKey, producto) {
        const card = document.createElement('div');
        card.className = 'comparator-card';

        // 1. Header Marca & Nombre
        const header = document.createElement('div');
        header.className = 'comparator-card-header';
        header.innerHTML = `
            <span class="comparator-brand">${producto.marca || ''}</span>
            <h3 class="comparator-name">${producto.nombre || ''}</h3>
        `;
        card.appendChild(header);

        // 2. Ficha Olfativa (imagen_notas con badge discreto "VER FICHA")
        const notesContainer = document.createElement('div');
        notesContainer.className = 'comparator-notes-container';

        const notasRaw = producto.imagen_notas ?? producto.imagenNotas;
        const service = window.ProductosService || (typeof ProductosService !== 'undefined' ? ProductosService : null);
        const notasUrl = service && typeof service.resolverImagen === 'function' ? service.resolverImagen(notasRaw) : notasRaw;

        const imgNotes = document.createElement('img');
        imgNotes.src = notasUrl;
        imgNotes.alt = `Ficha olfativa de ${producto.nombre}`;
        imgNotes.className = 'comparator-notes-img';
        imgNotes.loading = 'lazy';
        imgNotes.decoding = 'async';
        imgNotes.title = 'Toca para ampliar en pantalla completa';

        const zoomBadge = document.createElement('span');
        zoomBadge.className = 'comparator-zoom-badge';
        zoomBadge.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <span>VER FICHA</span>
        `;

        notesContainer.appendChild(imgNotes);
        notesContainer.appendChild(zoomBadge);

        const handleZoomClick = (e) => {
            e.stopPropagation();
            if (window.interfaz && typeof window.interfaz.abrirLightboxVisor === 'function') {
                window.interfaz.abrirLightboxVisor(notasUrl, `Ficha olfativa de ${producto.nombre}`);
            } else if (typeof window.abrirLightboxVisor === 'function') {
                window.abrirLightboxVisor(notasUrl, `Ficha olfativa de ${producto.nombre}`);
            }
        };

        notesContainer.addEventListener('click', handleZoomClick);
        card.appendChild(notesContainer);

        // 3. Botón Cambiar Perfume (Compacto)
        const btnChange = document.createElement('button');
        btnChange.type = 'button';
        btnChange.className = 'btn-change-compact';
        btnChange.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>CAMBIAR</span>
        `;
        btnChange.addEventListener('click', () => limpiarLado(ladoKey));
        card.appendChild(btnChange);

        // 4. Zona de Compra
        const buyBox = document.createElement('div');
        buyBox.className = 'comparator-buy-box';

        if (state.modo === 'sellados') {
            // ORDEN SELLADOS: PRECIO -> STOCK -> CANTIDAD -> AGREGAR
            const precioHtml = producto.oferta && producto.precio_oferta > 0
                ? `<div class="comparator-price-row">
                     <span class="comparator-price-old">S/${Number(producto.precio).toFixed(2)}</span>
                     <span class="comparator-price-offer">S/${Number(producto.precio_oferta).toFixed(2)}</span>
                   </div>`
                : `<div class="comparator-price-row">
                     <span class="comparator-price-main">S/${Number(producto.precio).toFixed(2)}</span>
                   </div>`;

            const stockHtml = `<span class="comparator-stock">Disponible (${producto.stock} u.)</span>`;

            buyBox.innerHTML = `
                ${precioHtml}
                ${stockHtml}
            `;

            const qtyBox = crearSelectorCantidad(
                state[ladoKey].cantidad,
                1,
                producto.stock,
                (q) => { state[ladoKey].cantidad = q; }
            );
            buyBox.appendChild(qtyBox);

            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.className = 'btn btn-primary btn-add-compact';
            btnAdd.textContent = 'AGREGAR';
            btnAdd.addEventListener('click', () => {
                if (typeof window.agregarAlCarrito === 'function') {
                    window.agregarAlCarrito(producto.id, state[ladoKey].cantidad, null);
                }
            });
            buyBox.appendChild(btnAdd);

        } else if (state.modo === 'decants') {
            // ORDEN DECANTS: SUBTITULO -> PILLS -> PRECIO -> CANTIDAD -> AGREGAR
            const decantLabel = document.createElement('span');
            decantLabel.className = 'comparator-sublabel';
            decantLabel.textContent = 'ELIGE TU DECANT';
            buyBox.appendChild(decantLabel);

            const presList = obtenerPresentacionesDecant(producto);
            const presContainer = document.createElement('div');
            presContainer.className = 'comparator-decant-pills';

            presList.forEach(p => {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className = `decant-pill ${state[ladoKey].varianteMl === p.ml ? 'is-selected' : ''}`;
                pill.textContent = `${p.ml} ML`;
                pill.addEventListener('click', () => {
                    state[ladoKey].varianteMl = p.ml;
                    renderizarLado(ladoKey);
                });
                presContainer.appendChild(pill);
            });
            buyBox.appendChild(presContainer);

            const presSel = presList.find(p => p.ml === state[ladoKey].varianteMl);
            if (presSel) {
                const priceRow = document.createElement('div');
                priceRow.className = 'comparator-price-row';
                priceRow.innerHTML = `<span class="comparator-price-main">S/${Number(presSel.precio).toFixed(2)}</span>`;
                buyBox.appendChild(priceRow);

                const qtyBox = crearSelectorCantidad(
                    state[ladoKey].cantidad,
                    1,
                    99,
                    (q) => { state[ladoKey].cantidad = q; }
                );
                buyBox.appendChild(qtyBox);

                const btnAdd = document.createElement('button');
                btnAdd.type = 'button';
                btnAdd.className = 'btn btn-primary btn-add-compact';
                btnAdd.textContent = 'AGREGAR';
                btnAdd.addEventListener('click', () => {
                    if (typeof window.agregarAlCarrito === 'function') {
                        window.agregarAlCarrito(producto.id, state[ladoKey].cantidad, state[ladoKey].varianteMl);
                    }
                });
                buyBox.appendChild(btnAdd);
            }
        }

        card.appendChild(buyBox);
        return card;
    }

    /**
     * Selector de cantidad compacto
     */
    function crearSelectorCantidad(inicial, min, max, onChange) {
        const box = document.createElement('div');
        box.className = 'comparator-qty-selector';

        const btnMinus = document.createElement('button');
        btnMinus.type = 'button';
        btnMinus.className = 'qty-btn';
        btnMinus.textContent = '-';

        const numSpan = document.createElement('span');
        numSpan.className = 'qty-val';
        numSpan.textContent = inicial;

        const btnPlus = document.createElement('button');
        btnPlus.type = 'button';
        btnPlus.className = 'qty-btn';
        btnPlus.textContent = '+';

        let qty = inicial;

        btnMinus.addEventListener('click', () => {
            if (qty > min) {
                qty--;
                numSpan.textContent = qty;
                onChange(qty);
            }
        });

        btnPlus.addEventListener('click', () => {
            if (qty < max) {
                qty++;
                numSpan.textContent = qty;
                onChange(qty);
            }
        });

        box.appendChild(btnMinus);
        box.appendChild(numSpan);
        box.appendChild(btnPlus);

        return box;
    }

    window.ComparadorModulo = {
        state,
        normalizarTexto,
        seleccionarModo,
        obtenerProductosElegibles,
        seleccionarProducto,
        limpiarLado
    };

})();
