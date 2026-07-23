/**
 * Dunes Parfums - Controlador de Interfaz General
 * Maneja el comportamiento visual, menú responsive, animaciones de scroll,
 * y renderizado inicial de los productos de prueba en el Home.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar menú móvil
    inicializarMenuMovil();

    // 2. Inicializar encabezado sticky al hacer scroll
    inicializarStickyHeader();

    // 3. Inicializar animaciones de revelación con Intersection Observer
    inicializarScrollReveal();

    // 4. Renderizar productos destacados y oferta especial en la página de inicio
    cargarProductosDestacadosHome();
    cargarOfertaEspecialHome();

    // 5. Configurar enlaces de WhatsApp y botones flotantes
    inicializarEnlacesWhatsApp();

    // 6. Cargar detalle de producto (si aplica)
    cargarDetalleProducto();

    // 7. Renderizar carrito de compras (si aplica)
    if (document.getElementById('cart-table-container')) {
        renderizarCarritoDOM();
        inicializarCheckoutForm();
    }
});

/**
 * Controla la apertura y cierre del menú hamburguesa en dispositivos móviles
 */
function inicializarMenuMovil() {
    const burgerBtn = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (burgerBtn && navMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Evitar scroll en el body cuando el menú está abierto
            document.body.classList.toggle('no-scroll');
        });

        // Cerrar menú al presionar cualquier enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && e.target !== burgerBtn) {
                burgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    }
}

/**
 * Cambia el estilo del header cuando el usuario hace scroll
 */
function inicializarStickyHeader() {
    const header = document.getElementById('header-main');
    if (!header) return;

    const checkScroll = () => {
        if (window.scrollY > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    // Ejecutar al cargar por si el usuario ya recargó con scroll
    checkScroll();
    window.addEventListener('scroll', checkScroll);
}

/**
 * Revela elementos con animación cuando entran en el viewport
 */
function inicializarScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Dejar de observar una vez animado
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback para navegadores antiguos
        revealElements.forEach(el => el.classList.add('active'));
    }
}

/**
 * Formatea un número a formato de moneda local ($ 12.345)
 * @param {number} valor 
 * @returns {string}
 */
function formatearMoneda(valor) {
    return 'S/ ' + new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

/**
 * Carga y renderiza los productos destacados en el index.html
 */
async function cargarProductosDestacadosHome() {
    const grid = document.getElementById('productos-destacados-grid');
    const section = document.getElementById('destacados');
    if (!grid) return; // No estamos en index.html o no existe el contenedor

    grid.innerHTML = '<div class="loading-spinner">Cargando fragancias exclusivas...</div>';

    try {
        // Obtener los productos destacados del módulo
        const destacados = await window.productosModulo.obtenerProductosDestacados();

        if (!destacados || destacados.length === 0) {
            if (section) section.style.display = 'none';
            grid.innerHTML = '';
            return;
        }

        if (section) section.style.display = 'block';
        grid.innerHTML = ''; // Limpiar spinner

    destacados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card reveal';

        const esDecant = prod.categoria === 'decants';
        const estaAgotado = esDecant
            ? (!prod.disponible || prod.mililitrosDisponibles < 3)
            : (!prod.disponible || prod.stock <= 0);

        if (estaAgotado) {
            card.classList.add('out-of-stock', 'is-soldout');
        }

        // Construir etiquetas
        let tagHtml = '';
        if (!esDecant && prod.oferta && prod.disponible && prod.stock > 0) {
            tagHtml = `<span class="product-tag promo-tag">Oferta</span>`;
        } else if (estaAgotado) {
            tagHtml = `<span class="product-tag out-tag">Agotado</span>`;
        }

        // Precios
        const precioActual = esDecant ? 'Desde S/ 15.00' : formatearMoneda(prod.precio);
        const precioAnteriorHtml = (!esDecant && prod.precioAnterior)
            ? `<span class="price-old">${formatearMoneda(prod.precioAnterior)}</span>`
            : '';

        // Formatear presentación
        const presentacionFormateada = esDecant ? prod.presentacion : `Sellado / ${prod.presentacion}`;

        // Estado disponible y stock
        const stockHtml = esDecant
            ? (prod.disponible && prod.mililitrosDisponibles >= 3
                ? `<span class="product-stock-status">Disponible (${prod.mililitrosDisponibles} ml)</span>`
                : `<span class="product-stock-status out">Agotado</span>`)
            : (prod.disponible && prod.stock > 0
                ? `<span class="product-stock-status">Disponible (${prod.stock} unid.)</span>`
                : `<span class="product-stock-status out">Agotado</span>`);

        // Botón de acción principal
        let actionBtnHtml = '';
        if (esDecant) {
            if (!estaAgotado) {
                actionBtnHtml = `
                    <a href="producto.html?id=${prod.id}" class="btn btn-primary btn-select-option">
                        Seleccionar Presentación
                    </a>
                `;
            } else {
                actionBtnHtml = `
                    <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                        <svg class="btn-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Consultar
                    </button>
                `;
            }
        } else if (!estaAgotado) {
            actionBtnHtml = `
                <button class="btn btn-primary btn-add-cart" data-id="${prod.id}" data-nombre="${prod.nombre}">
                    <svg class="btn-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> Agregar
                </button>
            `;
        } else {
            actionBtnHtml = `
                <button class="btn btn-secondary btn-query-wa" data-id="${prod.id}" data-nombre="${prod.nombre}" data-marca="${prod.marca}">
                    <svg class="btn-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Consultar
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

    // Asignar eventos a los botones recién creados
    vincularEventosProductosGrid(grid);
    } catch (err) {
        console.error('Error al cargar fragancias destacadas:', err);
        if (section) section.style.display = 'none';
        grid.innerHTML = '';
    }
}

/**
 * Carga y renderiza dinámicamente la Oferta Especial en index.html
 */
async function cargarOfertaEspecialHome() {
    const section = document.getElementById('ofertas');
    if (!section) return;

    try {
        const prod = await window.productosModulo.obtenerProductoOferta();

        if (!prod) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const badgeEl = document.getElementById('weekly-offer-badge');
        const imgEl = document.getElementById('weekly-offer-img');
        const subtitleEl = document.getElementById('weekly-offer-subtitle');
        const titleEl = document.getElementById('weekly-offer-title');
        const descEl = document.getElementById('weekly-offer-desc');
        const priceOldEl = document.getElementById('weekly-offer-price-old');
        const priceNewEl = document.getElementById('weekly-offer-price-new');
        const stockEl = document.getElementById('weekly-offer-stock');
        const validityEl = document.getElementById('weekly-offer-validity');
        const btnEl = document.getElementById('weekly-offer-btn');

        const esDecant = prod.categoria === 'decants';
        const estaAgotado = esDecant
            ? (!prod.disponible || (prod.mililitrosDisponibles !== undefined && prod.mililitrosDisponibles < 3))
            : (!prod.disponible || (prod.stock !== undefined && prod.stock <= 0));

        // Subtítulo
        if (subtitleEl) {
            subtitleEl.textContent = prod.ofertaSubtitulo || (esDecant ? 'DECANT DESTACADO' : 'PERFUME ÁRABE DESTACADO');
        }

        // Título
        if (titleEl) {
            titleEl.textContent = prod.ofertaTitulo || `${prod.nombre} - ${prod.marca}`;
        }

        // Descripción
        if (descEl) {
            descEl.textContent = prod.descripcion || 'Descubre esta fragancia seleccionada especialmente por Dunes Parfums.';
        }

        // Imagen
        if (imgEl) {
            imgEl.src = prod.imagen;
            imgEl.alt = `${prod.nombre} - ${prod.marca} en oferta especial`;
        }

        // Precios y Descuento
        const precioActual = esDecant ? (prod.precio || 15) : prod.precio;
        if (priceNewEl) {
            priceNewEl.textContent = esDecant ? 'Desde S/ 15.00' : formatearMoneda(precioActual);
        }

        const precioAnterior = prod.precioAnterior;
        const tieneDescuentoValido = !esDecant &&
            typeof precioAnterior === 'number' &&
            precioAnterior > precioActual &&
            precioActual > 0;

        if (tieneDescuentoValido) {
            if (priceOldEl) {
                priceOldEl.textContent = formatearMoneda(precioAnterior);
                priceOldEl.style.display = 'inline-block';
            }
            const porcentaje = Math.round(((precioAnterior - precioActual) / precioAnterior) * 100);
            if (badgeEl && porcentaje > 0) {
                badgeEl.textContent = `${porcentaje}% OFF`;
                badgeEl.style.display = 'inline-block';
            } else if (badgeEl) {
                badgeEl.style.display = 'none';
            }
        } else {
            if (priceOldEl) priceOldEl.style.display = 'none';
            if (badgeEl) badgeEl.style.display = 'none';
        }

        // Stock
        if (stockEl) {
            if (prod.ofertaTextoStock) {
                stockEl.textContent = prod.ofertaTextoStock;
            } else if (estaAgotado) {
                stockEl.textContent = 'Actualmente agotado';
            } else if (esDecant) {
                stockEl.textContent = `Stock disponible: ${prod.mililitrosDisponibles || 0} ml`;
            } else if (prod.stock === 1) {
                stockEl.textContent = 'Última unidad disponible';
            } else {
                stockEl.textContent = `Stock disponible: ${prod.stock} unidades`;
            }
        }

        // Vigencia
        if (validityEl) {
            validityEl.textContent = prod.ofertaVigencia || 'Válido hasta agotar stock.';
        }

        // Botón y evento WhatsApp sin emojis
        if (btnEl) {
            const textoBoton = prod.ofertaTextoBoton || (estaAgotado ? 'CONSULTAR DISPONIBILIDAD' : 'CONSULTAR OFERTA POR WHATSAPP');
            btnEl.textContent = textoBoton;

            btnEl.onclick = (e) => {
                e.preventDefault();
                let msg = `Hola, Dunes Parfums.\n\nDeseo consultar la oferta de:\n${prod.nombre}\nPresentación: ${prod.presentacion || (esDecant ? 'Decant' : 'Sellado')}\nPrecio de oferta: S/${precioActual.toFixed(2)}`;
                if (tieneDescuentoValido) {
                    msg += `\nPrecio anterior: S/${precioAnterior.toFixed(2)}`;
                }
                const url = `https://wa.me/51986510573?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            };
        }

    } catch (err) {
        console.error('Error al cargar la oferta especial:', err);
        section.style.display = 'none';
    }
}

/**
 * Asigna eventos de clic a los botones de comprar y agregar en la cuadrícula
 * @param {HTMLElement} grid
 */
function vincularEventosProductosGrid(grid) {
    // Botones de agregar al carrito (solo sellados)
    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            window.carritoModulo.agregarAlCarrito(id, 1, null);
        });
    });

    // Botones de consulta por agotado o consulta directa
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
 * Inicializa los enlaces generales de WhatsApp en la página
 */
function inicializarEnlacesWhatsApp() {
    // Botón flotante
    const floatWaBtn = document.getElementById('whatsapp-floating-btn');
    if (floatWaBtn) {
        floatWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = 'Hola, Dunes Parfums\nMe gustaría recibir asesoría sobre sus perfumes sellados y decants.';
            window.whatsappConfig.enviarMensajeWhatsApp(msg);
        });
    }

    // Botón en la sección de consulta WhatsApp
    const generalWaBtn = document.getElementById('general-whatsapp-btn');
    if (generalWaBtn) {
        generalWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = 'Hola, Dunes Parfums\nMe comunico desde la web para recibir asesoramiento personalizado en alta perfumería.';
            window.whatsappConfig.enviarMensajeWhatsApp(msg);
        });
    }
}

/**
 * Carga y renderiza la ficha técnica de producto.html
 */
async function cargarDetalleProducto() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        container.innerHTML = `
            <div class="placeholder-page-wrapper">
                <div class="benefit-icon-wrapper" style="width: 80px; height: 80px; margin-bottom: 12px;" aria-hidden="true"><i data-lucide="alert-triangle" class="icon-lg"></i></div>
                <h2>Error de Selección</h2>
                <p>No se ha especificado ningún perfume para visualizar.</p>
                <a href="catalogo.html" class="btn btn-primary">Ver Catálogo</a>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        return;
    }

    const prod = await window.productosModulo.obtenerProductoPorId(id);
    if (!prod) {
        container.innerHTML = `
            <div class="placeholder-page-wrapper">
                <div class="benefit-icon-wrapper" style="width: 80px; height: 80px; margin-bottom: 12px;" aria-hidden="true"><i data-lucide="search" class="icon-lg"></i></div>
                <h2>No Encontrado</h2>
                <p>La fragancia solicitada no figura en nuestro stock actual.</p>
                <a href="catalogo.html" class="btn btn-primary">Ver Catálogo</a>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        return;
    }

    const esDecant = prod.categoria === 'decants';

    if (esDecant) {
        renderizarDetalleDecant(container, prod);
    } else {
        renderizarDetalleSellado(container, prod);
    }
}

/**
 * Renderiza la ficha técnica de un perfume SELLADO
 */
function renderizarDetalleSellado(container, prod) {
    const presentacionFormateada = `Sellado / ${prod.presentacion}`;
    const stockHtml = prod.disponible && prod.stock > 0
        ? `<span class="detail-stock-badge in-stock">Disponible (${prod.stock} unidades)</span>`
        : `<span class="detail-stock-badge out-of-stock">Agotado</span>`;

    let pickerAndActionsHtml = '';
    if (prod.disponible && prod.stock > 0) {
        pickerAndActionsHtml = `
            <div class="detail-qty-picker-row">
                <span class="qty-label">Cantidad:</span>
                <div class="qty-picker">
                    <button class="qty-btn" id="detail-qty-minus">—</button>
                    <input type="number" id="detail-qty-input" value="1" min="1" max="${prod.stock}" readonly>
                    <button class="qty-btn" id="detail-qty-plus">+</button>
                </div>
            </div>
            <div class="detail-btn-row">
                <button class="btn btn-primary btn-add-cart-detail" id="btn-add-cart-detail" data-id="${prod.id}">
                    <i data-lucide="shopping-bag" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Agregar al Carrito
                </button>
                <button class="btn btn-secondary btn-query-detail" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <i data-lucide="message-square" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Consultar por WhatsApp
                </button>
            </div>
        `;
    } else {
        pickerAndActionsHtml = `
            <div class="detail-btn-row">
                <button class="btn btn-secondary btn-query-detail" style="width: 100%;" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <i data-lucide="message-square" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Consultar reingreso por WhatsApp
                </button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="detail-image-side">
                <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="detail-product-img">
            </div>
            <div class="detail-info-side">
                <span class="detail-brand">${prod.marca}</span>
                <h2 class="detail-title">${prod.nombre}</h2>
                <span class="detail-volume">${presentacionFormateada}</span>

                <div class="detail-price-box">
                    <span class="detail-price">${formatearMoneda(prod.precio)}</span>
                </div>

                <div class="detail-stock-box">
                    ${stockHtml}
                </div>

                <div class="detail-divider"></div>

                <div class="detail-description">
                    <h3>Descripción de la fragancia:</h3>
                    <p>${prod.descripcion || 'Una fina fragancia de nuestra selección exclusiva.'}</p>
                </div>

                <div class="detail-divider"></div>

                ${pickerAndActionsHtml}
            </div>
        </div>
    `;

    // Vincular eventos de detalle sellado
    if (prod.disponible && prod.stock > 0) {
        const minusBtn = document.getElementById('detail-qty-minus');
        const plusBtn = document.getElementById('detail-qty-plus');
        const qtyInput = document.getElementById('detail-qty-input');
        const addCartBtn = document.getElementById('btn-add-cart-detail');

        if (minusBtn && plusBtn && qtyInput) {
            minusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) qtyInput.value = val - 1;
            });
            plusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val < prod.stock) {
                    qtyInput.value = val + 1;
                } else {
                    window.carritoModulo.mostrarToastPremium('Límite de stock disponible alcanzado.', true);
                }
            });
        }
        if (addCartBtn) {
            addCartBtn.addEventListener('click', () => {
                const qty = parseInt(qtyInput.value) || 1;
                window.carritoModulo.agregarAlCarrito(prod.id, qty, null);
            });
        }
    }

    const queryBtn = document.getElementById('btn-query-detail');
    if (queryBtn) {
        queryBtn.addEventListener('click', () => {
            window.whatsappConfig.consultarDisponibilidad(prod.nombre, prod.marca, presentacionFormateada);
        });
    }
}

/**
 * Renderiza la ficha técnica de un perfume DECANT con selector de presentación
 */
function renderizarDetalleDecant(container, prod) {
    const mlDisponibles = prod.mililitrosDisponibles || 0;

    // Determinar la primera presentación seleccionable por defecto (empezando por 3ml)
    let defaultMl = null;
    if (prod.presentaciones) {
        for (const pres of prod.presentaciones) {
            if (pres.disponible && mlDisponibles >= pres.ml) {
                defaultMl = pres.ml;
                break;
            }
        }
    }

    const defaultPres = defaultMl
        ? prod.presentaciones.find(p => p.ml === defaultMl)
        : null;
    const precioInicial = defaultPres ? defaultPres.precio : 15.00;
    const presentacionInicialTexto = defaultPres ? defaultPres.nombre : 'Decants de 3, 5 y 10 ml';

    const stockHtml = mlDisponibles >= 3
        ? `<span class="detail-stock-badge in-stock">Disponible (${mlDisponibles} ml en stock)</span>`
        : `<span class="detail-stock-badge out-of-stock">Agotado</span>`;

    // Generar botones de presentación
    let presentacionBtnsHtml = '';
    if (prod.presentaciones) {
        prod.presentaciones.forEach(pres => {
            const maxQty = Math.floor(mlDisponibles / pres.ml);
            const deshabilitado = !pres.disponible || maxQty <= 0;
            const esDefault = pres.ml === defaultMl;
            const disabledAttr = deshabilitado ? 'disabled' : '';
            const activeClass = esDefault ? 'active' : '';
            const ariaChecked = esDefault ? 'true' : 'false';

            presentacionBtnsHtml += `
                <button class="variant-option-btn ${activeClass}"
                        data-ml="${pres.ml}"
                        data-precio="${pres.precio}"
                        data-nombre="${pres.nombre}"
                        data-max="${maxQty}"
                        role="radio"
                        aria-checked="${ariaChecked}"
                        ${disabledAttr}>
                    <span class="variant-ml">${pres.ml} ml</span>
                    <span class="variant-price">S/ ${pres.precio.toFixed(2)}</span>
                    ${deshabilitado ? '<span class="variant-unavailable">Sin stock</span>' : ''}
                </button>
            `;
        });
    }

    let pickerAndActionsHtml = '';
    if (mlDisponibles >= 3) {
        pickerAndActionsHtml = `
            <div class="detail-variant-selector">
                <h3 class="variant-selector-title">Selecciona una presentación:</h3>
                <div class="variant-options-row" role="radiogroup" aria-label="Presentaciones disponibles">
                    ${presentacionBtnsHtml}
                </div>
                <p class="variant-selected-label" id="variant-selected-label">Presentación seleccionada: <strong>${presentacionInicialTexto}</strong></p>
            </div>

            <div class="detail-divider"></div>

            <div class="detail-qty-picker-row">
                <span class="qty-label">Cantidad:</span>
                <div class="qty-picker">
                    <button class="qty-btn" id="detail-qty-minus">—</button>
                    <input type="number" id="detail-qty-input" value="1" min="1" max="${defaultPres ? Math.floor(mlDisponibles / defaultMl) : 1}" readonly>
                    <button class="qty-btn" id="detail-qty-plus">+</button>
                </div>
            </div>
            <div class="detail-btn-row">
                <button class="btn btn-primary btn-add-cart-detail" id="btn-add-cart-detail" data-id="${prod.id}">
                    <i data-lucide="shopping-bag" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Agregar al Carrito
                </button>
                <button class="btn btn-secondary btn-query-detail" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <i data-lucide="message-square" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Consultar por WhatsApp
                </button>
            </div>
        `;
    } else {
        pickerAndActionsHtml = `
            <div class="detail-btn-row">
                <button class="btn btn-secondary btn-query-detail" style="width: 100%;" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <i data-lucide="message-square" class="icon-sm" aria-hidden="true" style="margin-right: 6px;"></i>Consultar reingreso por WhatsApp
                </button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="detail-image-side">
                <img src="${prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="detail-product-img">
            </div>
            <div class="detail-info-side">
                <span class="detail-brand">${prod.marca}</span>
                <h2 class="detail-title">${prod.nombre}</h2>
                <span class="detail-volume">${prod.presentacion}</span>

                <div class="detail-price-box">
                    <span class="detail-price" id="detail-dynamic-price">${formatearMoneda(precioInicial)}</span>
                </div>

                <div class="detail-stock-box">
                    ${stockHtml}
                </div>

                <div class="detail-divider"></div>

                <div class="detail-description">
                    <h3>Descripción de la fragancia:</h3>
                    <p>${prod.descripcion || 'Una fina fragancia de nuestra selección exclusiva.'}</p>
                </div>

                <div class="detail-divider"></div>

                ${pickerAndActionsHtml}
            </div>
        </div>
    `;

    // ---- Vincular eventos del selector de presentación ----
    if (mlDisponibles >= 3) {
        const variantBtns = container.querySelectorAll('.variant-option-btn');
        const priceDisplay = document.getElementById('detail-dynamic-price');
        const selectedLabel = document.getElementById('variant-selected-label');
        const qtyInput = document.getElementById('detail-qty-input');
        const minusBtn = document.getElementById('detail-qty-minus');
        const plusBtn = document.getElementById('detail-qty-plus');
        const addCartBtn = document.getElementById('btn-add-cart-detail');

        // Estado mutable
        let selectedMl = defaultMl;
        let selectedPrecio = precioInicial;
        let selectedMaxQty = defaultPres ? Math.floor(mlDisponibles / defaultMl) : 1;

        variantBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                // Deseleccionar todas
                variantBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                // Seleccionar actual
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');

                selectedMl = parseInt(btn.dataset.ml);
                selectedPrecio = parseFloat(btn.dataset.precio);
                selectedMaxQty = parseInt(btn.dataset.max);

                // Actualizar precio visual
                if (priceDisplay) priceDisplay.textContent = formatearMoneda(selectedPrecio);
                if (selectedLabel) selectedLabel.innerHTML = `Presentación seleccionada: <strong>${btn.dataset.nombre}</strong>`;

                // Resetear qty
                if (qtyInput) {
                    qtyInput.value = 1;
                    qtyInput.max = selectedMaxQty;
                }
            });
        });

        // Controles de cantidad
        if (minusBtn && plusBtn && qtyInput) {
            minusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) qtyInput.value = val - 1;
            });
            plusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val < selectedMaxQty) {
                    qtyInput.value = val + 1;
                } else {
                    window.carritoModulo.mostrarToastPremium(`Máximo ${selectedMaxQty} unidades de ${selectedMl} ml disponibles.`, true);
                }
            });
        }

        // Agregar al carrito
        if (addCartBtn) {
            addCartBtn.addEventListener('click', () => {
                if (!selectedMl) {
                    window.carritoModulo.mostrarToastPremium('Selecciona una presentación primero.', true);
                    return;
                }
                const qty = parseInt(qtyInput.value) || 1;
                window.carritoModulo.agregarAlCarrito(prod.id, qty, selectedMl);
            });
        }
    }

    // Consultar por WhatsApp
    const queryBtn = document.getElementById('btn-query-detail');
    if (queryBtn) {
        queryBtn.addEventListener('click', () => {
            const activeVariant = container.querySelector('.variant-option-btn.active');
            const finalPresentation = activeVariant ? activeVariant.dataset.nombre : prod.presentacion;
            window.whatsappConfig.consultarDisponibilidad(prod.nombre, prod.marca, finalPresentation);
        });
    }
}

/**
 * Renderiza el listado detallado del carrito de compras en la página carrito.html
 */
async function renderizarCarritoDOM() {
    const container = document.getElementById('cart-table-container');
    const totalPriceSpan = document.getElementById('cart-total-price');
    if (!container) return;

    const items = await window.carritoModulo.obtenerItemsCarritoDetallados();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <div style="margin-bottom: 12px;" aria-hidden="true"><i data-lucide="shopping-bag" class="icon-xl" style="color: var(--catalog-gold, #B18225);"></i></div>
                <h3>Tu pedido está vacío</h3>
                <p>Explora nuestro catálogo de perfumes y decants para agregar productos.</p>
                <a href="catalogo.html" class="btn btn-primary" style="margin-top: 20px;">Ir al Catálogo</a>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        if (totalPriceSpan) totalPriceSpan.textContent = 'S/ 0.00';

        // Ocultar o deshabilitar visualmente la columna derecha
        const summaryCol = document.querySelector('.cart-summary-column');
        if (summaryCol) {
            summaryCol.style.opacity = '0.5';
            summaryCol.style.pointerEvents = 'none';
        }

        const emptyBtn = document.getElementById('btn-empty-cart');
        if (emptyBtn) emptyBtn.style.display = 'none';

        return;
    }

    // Activar columna derecha
    const summaryCol = document.querySelector('.cart-summary-column');
    if (summaryCol) {
        summaryCol.style.opacity = '1';
        summaryCol.style.pointerEvents = 'auto';
    }
    const emptyBtn = document.getElementById('btn-empty-cart');
    if (emptyBtn) emptyBtn.style.display = 'inline-block';

    let html = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalGeneral = 0;

    items.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalGeneral += subtotal;

        const presentacionFormateada = item.presentacion;

        html += `
            <tr data-id="${item.id}">
                <td class="cart-td-product">
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
                    <div class="cart-item-meta">
                        <span class="cart-item-brand">${item.marca}</span>
                        <span class="cart-item-title">${item.nombre}</span>
                        <span class="cart-item-volume">${presentacionFormateada}</span>
                    </div>
                </td>
                <td class="cart-td-price">${formatearMoneda(item.precio)}</td>
                <td class="cart-td-qty">
                    <div class="qty-picker compact">
                        <button class="qty-btn btn-cart-minus" data-id="${item.id}" data-qty="${item.cantidad}">—</button>
                        <input type="number" class="qty-input-cart" value="${item.cantidad}" readonly>
                        <button class="qty-btn btn-cart-plus" data-id="${item.id}" data-qty="${item.cantidad}">+</button>
                    </div>
                </td>
                <td class="cart-td-subtotal">${formatearMoneda(subtotal)}</td>
                <td class="cart-td-remove">
                    <button class="btn-remove-item" data-id="${item.id}" aria-label="Eliminar del carrito" title="Eliminar del carrito"><i data-lucide="x" class="icon-xs" aria-hidden="true"></i></button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
    if (typeof actualizarInterfazEntrega === 'function') {
        actualizarInterfazEntrega();
    } else {
        if (totalPriceSpan) totalPriceSpan.textContent = formatearMoneda(totalGeneral);
        const subtotalPriceSpan = document.getElementById('cart-subtotal-price');
        if (subtotalPriceSpan) subtotalPriceSpan.textContent = formatearMoneda(totalGeneral);
        if (typeof validarDatosEntrega === 'function') {
            validarDatosEntrega();
        }
    }

    // Asignar eventos de botones del carrito
    vincularEventosCarritoDOM(container);
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}
}

/**
 * Vincula los eventos de cantidad y eliminación en el carrito
 */
function vincularEventosCarritoDOM(container) {
    // Aumentar cantidad
    container.querySelectorAll('.btn-cart-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const qty = parseInt(e.currentTarget.dataset.qty) || 1;
            window.carritoModulo.actualizarCantidadItem(id, qty + 1);
        });
    });

    // Disminuir cantidad
    container.querySelectorAll('.btn-cart-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const qty = parseInt(e.currentTarget.dataset.qty) || 1;
            window.carritoModulo.actualizarCantidadItem(id, qty - 1);
        });
    });

    // Eliminar producto
    container.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            window.carritoModulo.eliminarItem(id);
        });
    });

    // Inicializar Modal de Vaciar Carrito (Singleton Handler)
    inicializarModalVaciarCarrito();
}

/**
 * Inicializa el modal personalizado de confirmación de vaciar carrito (una sola vez)
 */
function inicializarModalVaciarCarrito() {
    const modal = document.getElementById('modal-confirm-vaciar');
    if (!modal || modal.dataset.initialized === 'true') return;
    modal.dataset.initialized = 'true';

    const btnCancelar = document.getElementById('btn-cancelar-vaciar');
    const btnConfirmar = document.getElementById('btn-confirmar-vaciar');
    const modalCard = modal.querySelector('.modal-card');

    function abrirModal() {
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    function cerrarModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 200);
    }

    // Delegación de evento de clic para abrir el modal cuando se presiona #btn-empty-cart
    document.addEventListener('click', (e) => {
        const emptyBtn = e.target.closest('#btn-empty-cart');
        if (emptyBtn) {
            e.preventDefault();
            e.stopPropagation();
            abrirModal();
        }
    });

    // Detener propagación de clics dentro del modal-card
    if (modalCard) {
        modalCard.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Clic en el fondo oscuro cierra el modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.preventDefault();
            cerrarModal();
        }
    });

    // Botón Cancelar cierra el modal
    if (btnCancelar) {
        btnCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal();
        });
    }

    // Botón Confirmar vacía el carrito y cierra el modal
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal();
            if (window.carritoModulo && typeof window.carritoModulo.vaciarCarrito === 'function') {
                window.carritoModulo.vaciarCarrito();
            }
        });
    }

    // Tecla Escape cierra el modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            cerrarModal();
        }
    });
}

const CONFIG_DELIVERY_LOCAL = {
    montoMinimoGratis: 30,
    zonas: {
        cacatachi: { nombre: "Cacatachi", costo: 0 },
        morales: { nombre: "Morales", costo: 3 },
        tarapoto: { nombre: "Tarapoto", costo: 4 },
        "banda-shilcayo": { nombre: "La Banda de Shilcayo", costo: 5 }
    }
};

const CONFIG_ENVIO_AGENCIA = {
    montoMinimoGratis: 30,
    cargoMenorAlMinimo: 4
};

function calcularCargoAgencia(subtotal) {
    const subtotalNumerico = Number(subtotal);
    if (!Number.isFinite(subtotalNumerico) || subtotalNumerico < 0) {
        return 0;
    }
    return subtotalNumerico >= CONFIG_ENVIO_AGENCIA.montoMinimoGratis ? 0 : CONFIG_ENVIO_AGENCIA.cargoMenorAlMinimo;
}

let selectedDeliveryType = null;
let selectedDeliveryZone = null;

function obtenerTipoEntregaSeleccionado() {
    return selectedDeliveryType;
}

function obtenerZonaSeleccionada() {
    return selectedDeliveryZone;
}

function calcularCostoDeliveryLocal(subtotal, zona) {
    const subtotalNumerico = Number(subtotal);
    if (!Number.isFinite(subtotalNumerico) || subtotalNumerico < 0) {
        return 0;
    }
    
    if (zona === 'cacatachi') {
        return 0;
    }
    
    if (subtotalNumerico >= CONFIG_DELIVERY_LOCAL.montoMinimoGratis) {
        return 0;
    }
    
    const zonaConfig = CONFIG_DELIVERY_LOCAL.zonas[zona];
    return zonaConfig ? zonaConfig.costo : 0;
}

function actualizarBotonesZona(subtotal) {
    const subtotalNumerico = Number(subtotal) || 0;
    const isFree = subtotalNumerico >= CONFIG_DELIVERY_LOCAL.montoMinimoGratis;
    
    const zonas = [
        { key: 'cacatachi', name: 'Cacatachi', freeAlways: true, cost: 0 },
        { key: 'morales', name: 'Morales', cost: CONFIG_DELIVERY_LOCAL.zonas.morales.costo },
        { key: 'tarapoto', name: 'Tarapoto', cost: CONFIG_DELIVERY_LOCAL.zonas.tarapoto.costo },
        { key: 'banda-shilcayo', name: 'La Banda de Shilcayo', cost: CONFIG_DELIVERY_LOCAL.zonas['banda-shilcayo'].costo }
    ];

    zonas.forEach(z => {
        const btn = document.querySelector(`.zone-option-btn[data-zona="${z.key}"]`);
        if (!btn) return;

        const esGratis = z.freeAlways || isFree;
        const priceBadgeHtml = esGratis
            ? `<span class="delivery-zone-price gratis">GRATIS</span>`
            : `<span class="delivery-zone-price">S/ ${z.cost.toFixed(2)}</span>`;

        btn.innerHTML = `
            <span class="delivery-zone-name">${z.name}</span>
            <span class="delivery-zone-separator"></span>
            ${priceBadgeHtml}
        `;
    });
}

function actualizarMensajeDeliveryGratis(subtotal, zona) {
    const infoBox = document.getElementById('delivery-free-info');
    if (!infoBox) return;
    
    const subtotalNumerico = Number(subtotal) || 0;
    if (subtotalNumerico === 0) {
        infoBox.style.display = 'none';
        return;
    }
    
    infoBox.style.display = 'block';
    
    if (subtotalNumerico >= CONFIG_DELIVERY_LOCAL.montoMinimoGratis) {
        infoBox.textContent = "¡Tu delivery es gratis!";
        infoBox.style.color = "var(--color-primary-dark)";
        infoBox.style.borderColor = "var(--color-primary-dark)";
        infoBox.style.background = "rgba(212, 175, 55, 0.06)";
        return;
    }
    
    const faltante = CONFIG_DELIVERY_LOCAL.montoMinimoGratis - subtotalNumerico;
    
    if (zona === 'cacatachi') {
        infoBox.textContent = "Delivery gratis en Cacatachi.";
        infoBox.style.color = "var(--color-primary-dark)";
        infoBox.style.borderColor = "var(--color-primary-dark)";
        infoBox.style.background = "rgba(212, 175, 55, 0.06)";
    } else {
        infoBox.textContent = `Te falta${faltante === 1 ? '' : 'n'} S/ ${faltante.toFixed(2)} para obtener delivery gratis.`;
        infoBox.style.color = "#FF9500";
        infoBox.style.borderColor = "#FF9500";
        infoBox.style.background = "rgba(255, 149, 0, 0.05)";
    }
}

function actualizarMensajeAgenciaGratis(subtotal) {
    const infoBox = document.getElementById('agencia-free-info');
    if (!infoBox) return;
    
    const subtotalNumerico = Number(subtotal) || 0;
    if (subtotalNumerico === 0) {
        infoBox.style.display = 'none';
        return;
    }
    
    infoBox.style.display = 'block';
    
    if (subtotalNumerico >= CONFIG_ENVIO_AGENCIA.montoMinimoGratis) {
        infoBox.textContent = "¡Embalaje y llevada a la agencia gratis!";
        infoBox.style.color = "var(--color-primary-dark)";
        infoBox.style.borderColor = "var(--color-primary-dark)";
        infoBox.style.background = "rgba(212, 175, 55, 0.06)";
        return;
    }
    
    const faltante = CONFIG_ENVIO_AGENCIA.montoMinimoGratis - subtotalNumerico;
    infoBox.textContent = `Te falta${faltante === 1 ? '' : 'n'} S/ ${faltante.toFixed(2)} para obtener el beneficio gratis.`;
    infoBox.style.color = "#FF9500";
    infoBox.style.borderColor = "#FF9500";
    infoBox.style.background = "rgba(255, 149, 0, 0.05)";
}

function actualizarInterfazEntrega() {
    const warningBox = document.getElementById('checkout-warning');
    const blockDelivery = document.getElementById('block-delivery-local');
    const blockAgencia = document.getElementById('block-agencia');
    const blockRecojo = document.getElementById('block-recojo-local');
    
    if (!warningBox || !blockDelivery || !blockAgencia || !blockRecojo) return;
    
    blockDelivery.style.display = 'none';
    blockAgencia.style.display = 'none';
    blockRecojo.style.display = 'none';
    
    // Hide all validation errors when switching modalities
    document.querySelectorAll('.validation-error-msg').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.delivery-option-card').forEach(card => {
        card.classList.remove('selected');
    });

    if (selectedDeliveryType) {
        warningBox.style.display = 'none';
        
        const selectedCard = document.getElementById(`card-${selectedDeliveryType}`);
        if (selectedCard) selectedCard.classList.add('selected');
        
        if (selectedDeliveryType === 'delivery-local') {
            blockDelivery.style.display = 'block';
            document.getElementById('delivery-name').required = true;
            document.getElementById('delivery-phone').required = true;
            document.getElementById('delivery-address').required = true;
            document.getElementById('delivery-reference').required = true;
            document.getElementById('recojo-name').required = false;
            document.getElementById('recojo-phone').required = false;
        } else if (selectedDeliveryType === 'agencia') {
            blockAgencia.style.display = 'block';
            document.getElementById('delivery-name').required = false;
            document.getElementById('delivery-phone').required = false;
            document.getElementById('delivery-address').required = false;
            document.getElementById('delivery-reference').required = false;
            document.getElementById('recojo-name').required = false;
            document.getElementById('recojo-phone').required = false;
        } else if (selectedDeliveryType === 'recojo-local') {
            blockRecojo.style.display = 'block';
            document.getElementById('recojo-name').required = true;
            document.getElementById('recojo-phone').required = true;
            document.getElementById('delivery-name').required = false;
            document.getElementById('delivery-phone').required = false;
            document.getElementById('delivery-address').required = false;
            document.getElementById('delivery-reference').required = false;
        }
    } else {
        warningBox.style.display = 'block';
        document.getElementById('delivery-name').required = false;
        document.getElementById('delivery-phone').required = false;
        document.getElementById('delivery-address').required = false;
        document.getElementById('delivery-reference').required = false;
        document.getElementById('recojo-name').required = false;
        document.getElementById('recojo-phone').required = false;
    }
    
    const items = window.carritoModulo.obtenerCarrito();
    const subtotal = items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    
    actualizarBotonesZona(subtotal);
    actualizarMensajeDeliveryGratis(subtotal, selectedDeliveryZone);
    actualizarMensajeAgenciaGratis(subtotal);
    actualizarResumenEntrega();
    validarDatosEntrega();
}

function obtenerTotalesPedido() {
    const items = window.carritoModulo.obtenerCarrito();
    const subtotalProductos = items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    
    let costoEntrega = 0;
    let conceptoEntrega = 'Costo de envío:';
    
    if (subtotalProductos > 0) {
        if (selectedDeliveryType === 'delivery-local') {
            conceptoEntrega = 'Costo de delivery:';
            if (selectedDeliveryZone) {
                costoEntrega = calcularCostoDeliveryLocal(subtotalProductos, selectedDeliveryZone);
            } else {
                costoEntrega = 0;
            }
        } else if (selectedDeliveryType === 'agencia') {
            conceptoEntrega = 'Embalaje y llevada a la agencia:';
            costoEntrega = calcularCargoAgencia(subtotalProductos);
        } else if (selectedDeliveryType === 'recojo-local') {
            conceptoEntrega = 'Costo de entrega:';
            costoEntrega = 0;
        }
    } else {
        if (selectedDeliveryType === 'agencia') {
            conceptoEntrega = 'Embalaje y llevada a la agencia:';
        } else if (selectedDeliveryType === 'delivery-local') {
            conceptoEntrega = 'Costo de delivery:';
        }
    }
    
    const totalFinal = subtotalProductos === 0 ? 0 : (subtotalProductos + costoEntrega);
    
    return {
        subtotalProductos,
        costoEntrega,
        conceptoEntrega,
        totalFinal
    };
}

function actualizarResumenEntrega() {
    const summaryType = document.getElementById('summary-delivery-type');
    const summaryZoneRow = document.getElementById('summary-delivery-zone-row');
    const summaryZone = document.getElementById('summary-delivery-zone');
    const summaryCost = document.getElementById('summary-delivery-cost');
    const labelSpan = document.getElementById('summary-delivery-label');
    const totalSpan = document.getElementById('cart-total-price');
    const subtotalSpan = document.getElementById('cart-subtotal-price');
    
    const totalMontoPagar = document.getElementById('total-monto-pagar');
    const totalMontoInfo = document.getElementById('total-monto-info');
    
    if (!summaryType) return;
    
    const { subtotalProductos, costoEntrega, conceptoEntrega, totalFinal } = obtenerTotalesPedido();
    
    if (subtotalSpan) subtotalSpan.textContent = formatearMoneda(subtotalProductos);
    if (labelSpan) labelSpan.textContent = conceptoEntrega;
    
    if (selectedDeliveryType === 'delivery-local') {
        summaryType.textContent = 'Delivery local';
        if (summaryZoneRow) summaryZoneRow.style.display = 'flex';
        
        if (selectedDeliveryZone) {
            const zonaFormateada = selectedDeliveryZone.charAt(0).toUpperCase() + selectedDeliveryZone.slice(1).replace('-', ' ');
            if (summaryZone) {
                summaryZone.textContent = selectedDeliveryZone === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
            }
            if (summaryCost) {
                summaryCost.textContent = costoEntrega === 0 ? 'GRATIS' : formatearMoneda(costoEntrega);
            }
        } else {
            if (summaryZone) summaryZone.textContent = 'Sin seleccionar';
            if (summaryCost) summaryCost.textContent = 'Selecciona una zona';
        }
    } else if (selectedDeliveryType === 'agencia') {
        summaryType.textContent = 'Envío por agencia de transporte';
        if (summaryZoneRow) summaryZoneRow.style.display = 'none';
        if (summaryCost) {
            if (subtotalProductos === 0) {
                summaryCost.textContent = 'Se calculará en la siguiente etapa';
            } else {
                summaryCost.textContent = costoEntrega === 0 ? 'GRATIS' : formatearMoneda(costoEntrega);
            }
        }
    } else if (selectedDeliveryType === 'recojo-local') {
        summaryType.textContent = 'Recojo en local';
        if (summaryZoneRow) summaryZoneRow.style.display = 'none';
        if (summaryCost) summaryCost.textContent = 'GRATIS';
    } else {
        summaryType.textContent = 'Sin seleccionar';
        if (summaryZoneRow) summaryZoneRow.style.display = 'none';
        if (summaryCost) summaryCost.textContent = 'Se calculará en la siguiente etapa';
    }
    
    if (totalSpan) totalSpan.textContent = formatearMoneda(totalFinal);
    if (totalMontoPagar) totalMontoPagar.textContent = formatearMoneda(totalFinal);
    
    if (totalMontoInfo) {
        if (subtotalProductos === 0) {
            totalMontoInfo.textContent = '';
            totalMontoInfo.style.display = 'none';
        } else if (!selectedDeliveryType) {
            totalMontoInfo.textContent = 'Selecciona el tipo de entrega para confirmar el total.';
            totalMontoInfo.style.display = 'block';
        } else if (selectedDeliveryType === 'delivery-local' && !selectedDeliveryZone) {
            totalMontoInfo.textContent = 'Selecciona una zona para confirmar el total.';
            totalMontoInfo.style.display = 'block';
        } else {
            totalMontoInfo.textContent = '';
            totalMontoInfo.style.display = 'none';
        }
    }
}

function validarFormularioEntrega(forceShowErrors = false) {
    const items = window.carritoModulo.obtenerCarrito();
    const result = {
        valido: true,
        errores: {}
    };
    
    if (items.length === 0) {
        result.valido = false;
        return result;
    }
    
    if (!selectedDeliveryType) {
        result.valido = false;
        return result;
    }
    
    // Reset all aria-invalid attributes first
    const allInputs = [
        'delivery-name', 'delivery-phone', 'delivery-address', 'delivery-reference',
        'recojo-name', 'recojo-phone'
    ];
    allInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('aria-invalid', 'false');
    });
    
    if (selectedDeliveryType === 'delivery-local') {
        const nameInput = document.getElementById('delivery-name');
        const phoneInput = document.getElementById('delivery-phone');
        const addressInput = document.getElementById('delivery-address');
        const referenceInput = document.getElementById('delivery-reference');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const reference = referenceInput ? referenceInput.value.trim() : '';
        
        // Name validation
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$/;
        const isNameValid = name.length >= 2 && name.length <= 80 && nameRegex.test(name);
        const nameError = document.getElementById('delivery-name-error');
        if (nameError) {
            const show = (forceShowErrors && !isNameValid) || (name.length > 0 && !isNameValid);
            nameError.style.display = show ? 'block' : 'none';
        }
        if (!isNameValid) {
            result.valido = false;
            result.errores['delivery-name'] = 'Ingresa tu nombre para continuar.';
            if (nameInput) nameInput.setAttribute('aria-invalid', 'true');
        }
        
        // Phone validation
        const phoneRegex = /^[0-9]{9}$/;
        const isPhoneValid = phoneRegex.test(phone);
        const phoneError = document.getElementById('delivery-phone-error');
        if (phoneError) {
            const show = (forceShowErrors && !isPhoneValid) || (phone.length > 0 && !isPhoneValid);
            phoneError.style.display = show ? 'block' : 'none';
        }
        if (!isPhoneValid) {
            result.valido = false;
            result.errores['delivery-phone'] = 'Ingresa un número de celular válido de 9 dígitos.';
            if (phoneInput) phoneInput.setAttribute('aria-invalid', 'true');
        }
        
        // Zone validation
        const validZones = ['cacatachi', 'morales', 'tarapoto', 'banda-shilcayo'];
        const isZoneValid = validZones.includes(selectedDeliveryZone);
        if (!isZoneValid) {
            result.valido = false;
            result.errores['zone-selector'] = 'Selecciona la zona donde deseas recibir tu pedido.';
        }
        
        // Address validation
        const isAddressValid = address.length >= 3;
        const addressError = document.getElementById('delivery-address-error');
        if (addressError) {
            const show = (forceShowErrors && !isAddressValid) || (address.length > 0 && !isAddressValid);
            addressError.style.display = show ? 'block' : 'none';
        }
        if (!isAddressValid) {
            result.valido = false;
            result.errores['delivery-address'] = 'Ingresa la dirección donde deseas recibir tu pedido.';
            if (addressInput) addressInput.setAttribute('aria-invalid', 'true');
        }
        
        // Reference is optional
        const referenceError = document.getElementById('delivery-reference-error');
        if (referenceError) {
            referenceError.style.display = 'none';
        }
        
    } else if (selectedDeliveryType === 'recojo-local') {
        const nameInput = document.getElementById('recojo-name');
        const phoneInput = document.getElementById('recojo-phone');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
        
        // Name validation
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$/;
        const isNameValid = name.length >= 2 && name.length <= 80 && nameRegex.test(name);
        const nameError = document.getElementById('recojo-name-error');
        if (nameError) {
            const show = (forceShowErrors && !isNameValid) || (name.length > 0 && !isNameValid);
            nameError.style.display = show ? 'block' : 'none';
        }
        if (!isNameValid) {
            result.valido = false;
            result.errores['recojo-name'] = 'Ingresa tu nombre para coordinar el recojo.';
            if (nameInput) nameInput.setAttribute('aria-invalid', 'true');
        }
        
        // Phone validation
        const phoneRegex = /^[0-9]{9}$/;
        const isPhoneValid = phoneRegex.test(phone);
        const phoneError = document.getElementById('recojo-phone-error');
        if (phoneError) {
            const show = (forceShowErrors && !isPhoneValid) || (phone.length > 0 && !isPhoneValid);
            phoneError.style.display = show ? 'block' : 'none';
        }
        if (!isPhoneValid) {
            result.valido = false;
            result.errores['recojo-phone'] = 'Ingresa un número de celular válido de 9 dígitos.';
            if (phoneInput) phoneInput.setAttribute('aria-invalid', 'true');
        }
    } else if (selectedDeliveryType === 'agencia') {
        // Agencia is always valid as no fields are required
    }
    
    return result;
}

function validarDatosEntrega() {
    const btnCheckout = document.getElementById('btn-confirmar-whatsapp');
    if (!btnCheckout) return;
    
    const validation = validarFormularioEntrega(false);
    btnCheckout.disabled = !validation.valido;
}

function obtenerDatosEntrega() {
    if (selectedDeliveryType === 'delivery-local') {
        const nameInput = document.getElementById('delivery-name');
        const phoneInput = document.getElementById('delivery-phone');
        const addressInput = document.getElementById('delivery-address');
        const referenceInput = document.getElementById('delivery-reference');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const reference = referenceInput ? referenceInput.value.trim() : '';
        
        let nombreZona = '';
        if (selectedDeliveryZone) {
            const zonaFormateada = selectedDeliveryZone.charAt(0).toUpperCase() + selectedDeliveryZone.slice(1).replace('-', ' ');
            nombreZona = selectedDeliveryZone === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
        }
        
        return {
            tipoEntrega: 'delivery-local',
            nombre: name,
            celular: phone,
            zona: selectedDeliveryZone,
            nombreZona: nombreZona,
            direccion: address,
            referencia: reference
        };
    } else if (selectedDeliveryType === 'agencia') {
        return {
            tipoEntrega: 'agencia'
        };
    } else if (selectedDeliveryType === 'recojo-local') {
        const nameInput = document.getElementById('recojo-name');
        const phoneInput = document.getElementById('recojo-phone');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\s+/g, '') : '';
        
        return {
            tipoEntrega: 'recojo-local',
            nombre: name,
            celular: phone
        };
    }
    return null;
}

function construirPedidoFinal() {
    const items = window.carritoModulo.obtenerCarrito();
    const { subtotalProductos, costoEntrega, conceptoEntrega, totalFinal } = obtenerTotalesPedido();
    const datosEntrega = obtenerDatosEntrega();
    
    return {
        productos: items,
        subtotalProductos,
        tipoEntrega: selectedDeliveryType,
        datosEntrega,
        conceptoEntrega,
        costoEntrega,
        totalFinal
    };
}

function guardarPreferenciaEntrega() {
    try {
        const pref = {
            tipoEntrega: selectedDeliveryType,
            zona: selectedDeliveryZone
        };
        localStorage.setItem('dunes_delivery_pref', JSON.stringify(pref));
    } catch (e) {
        console.error('Error al guardar preferencia de entrega:', e);
    }
}

function cargarPreferenciaEntrega() {
    try {
        const raw = localStorage.getItem('dunes_delivery_pref');
        if (!raw) return;
        
        const pref = JSON.parse(raw);
        if (pref && ['delivery-local', 'agencia', 'recojo-local'].includes(pref.tipoEntrega)) {
            selectedDeliveryType = pref.tipoEntrega;
            
            // Validate zone value
            if (pref.tipoEntrega === 'delivery-local' && ['cacatachi', 'morales', 'tarapoto', 'banda-shilcayo'].includes(pref.zona)) {
                selectedDeliveryZone = pref.zona;
            } else {
                selectedDeliveryZone = null;
            }
            
            // Check radio button in DOM
            const radio = document.querySelector(`input[name="tipoEntrega"][value="${selectedDeliveryType}"]`);
            if (radio) radio.checked = true;
            
            // Update selected class for zone buttons in DOM
            if (selectedDeliveryZone) {
                const zoneBtn = document.querySelector(`.zone-option-btn[data-zona="${selectedDeliveryZone}"]`);
                if (zoneBtn) zoneBtn.classList.add('selected');
            }
        }
    } catch (e) {
        console.error('Error al cargar preferencia de entrega:', e);
    }
}

function inicializarCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    // Load preferences
    cargarPreferenciaEntrega();
    actualizarInterfazEntrega();
    
    // Listeners for radio buttons (modality)
    form.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedDeliveryType = e.target.value;
            // When switching modality, if it is not delivery-local, clear zone selection
            if (selectedDeliveryType !== 'delivery-local') {
                selectedDeliveryZone = null;
                form.querySelectorAll('.zone-option-btn').forEach(btn => btn.classList.remove('selected'));
            }
            guardarPreferenciaEntrega();
            actualizarInterfazEntrega();
        });
    });
    
    // Listeners for zone buttons (only relevant for delivery-local)
    form.querySelectorAll('.zone-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            form.querySelectorAll('.zone-option-btn').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            selectedDeliveryZone = e.currentTarget.dataset.zona;
            guardarPreferenciaEntrega();
            actualizarInterfazEntrega();
        });
    });
    
    // Listeners for text/tel inputs
    const inputs = [
        'delivery-name', 'delivery-phone', 'delivery-address', 'delivery-reference',
        'recojo-name', 'recojo-phone'
    ];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                if (id.includes('phone')) {
                    input.value = input.value.replace(/[^0-9]/g, '');
                }
                validarDatosEntrega();
            });
            input.addEventListener('blur', () => {
                validarFormularioEntrega(false);
            });
        }
    });
    
    // Submit form handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmarPedidoWhatsApp(e);
    });
    
    // Direct click handler on the button
    const btnConfirmar = document.getElementById('btn-confirmar-whatsapp');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarPedidoWhatsApp);
    }
}

function confirmarPedidoWhatsApp(e) {
    if (e) e.preventDefault();
    
    const rawItems = window.carritoModulo.obtenerCarrito();
    if (rawItems.length === 0) {
        window.carritoModulo.mostrarToastPremium('El carrito está vacío.', true);
        return;
    }
    
    const validation = validarFormularioEntrega(true);
    if (!validation.valido) {
        window.carritoModulo.mostrarToastPremium('Por favor complete todos los datos requeridos correctamente.', true);
        
        // Focus the first invalid field
        const firstErrorFieldId = Object.keys(validation.errores)[0];
        if (firstErrorFieldId) {
            const el = document.getElementById(firstErrorFieldId);
            if (el) el.focus();
        }
        return;
    }
    
    const items = rawItems.map(item => ({
        id: item.id,
        idProducto: item.idProducto,
        nombre: item.nombre,
        marca: item.marca,
        imagen: item.imagen,
        tipo: item.tipo,
        categoria: item.categoria,
        presentacion: item.presentacion,
        formato: item.categoria === 'decants' ? 'Decant' : 'Sellado',
        tamanoMl: item.tamanoMl,
        precio: item.precioUnitario,
        cantidad: item.cantidad,
        subtotal: item.subtotal
    }));
    
    const { subtotalProductos, costoEntrega, totalFinal } = obtenerTotalesPedido();
    const datosEntrega = obtenerDatosEntrega();
    
    const pedido = {
        productos: items,
        subtotalProductos,
        costoEntrega,
        totalFinal,
        datosEntrega
    };
    
    window.whatsappConfig.enviarPedidoWhatsApp(pedido);
}

window.renderizarCarritoDOM = renderizarCarritoDOM;
window.CONFIG_DELIVERY_LOCAL = CONFIG_DELIVERY_LOCAL;
window.obtenerTipoEntregaSeleccionado = obtenerTipoEntregaSeleccionado;
window.obtenerZonaSeleccionada = obtenerZonaSeleccionada;
window.obtenerTotalesPedido = obtenerTotalesPedido;
window.calcularCargoAgencia = calcularCargoAgencia;
window.calcularCostoDeliveryLocal = calcularCostoDeliveryLocal;
window.actualizarBotonesZona = actualizarBotonesZona;
window.actualizarMensajeDeliveryGratis = actualizarMensajeDeliveryGratis;
window.actualizarInterfazEntrega = actualizarInterfazEntrega;
window.validarFormularioEntrega = validarFormularioEntrega;
window.validarDatosEntrega = validarDatosEntrega;
window.obtenerDatosEntrega = obtenerDatosEntrega;
window.construirPedidoFinal = construirPedidoFinal;
window.confirmarPedidoWhatsApp = confirmarPedidoWhatsApp;
window.actualizarResumenEntrega = actualizarResumenEntrega;
window.guardarPreferenciaEntrega = guardarPreferenciaEntrega;
window.cargarPreferenciaEntrega = cargarPreferenciaEntrega;
window.inicializarCheckoutForm = inicializarCheckoutForm;





