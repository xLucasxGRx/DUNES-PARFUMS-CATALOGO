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
    if (document.getElementById('cart-table-container') && typeof renderizarCarritoDOM === 'function') {
        renderizarCarritoDOM();
        if (typeof inicializarCheckoutForm === 'function') {
            inicializarCheckoutForm();
        }
    }

    // 8. Inicializar acordeón del footer
    inicializarAcordeonFooter();
});

/**
 * Controla la apertura, animación y acordeón del panel de navegación móvil (slide-over drawer)
 */
function inicializarMenuMovil() {
    const burgerBtn = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (!burgerBtn || !navMenu) return;

    // Asegurar la existencia del overlay en el DOM con atributo hidden por defecto
    let overlay = document.getElementById('nav-menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'nav-menu-overlay';
        overlay.className = 'nav-menu-overlay';
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
    }

    const closeBtn = document.getElementById('mobile-menu-close');
    const accordionBtn = document.getElementById('btn-toggle-catalogo-submenu');
    const submenu = document.getElementById('mobile-catalogo-submenu');

    let isClosing = false;
    let pendingTimeout = null;

    // Sincronizar atributos de visibilidad y accesibilidad según breakpoint de pantalla
    const sincronizarEstadoBreakpoint = () => {
        if (window.innerWidth >= 992) {
            navMenu.hidden = false;
            navMenu.removeAttribute('aria-hidden');
            navMenu.removeAttribute('inert');
            navMenu.classList.remove('active');
            if (overlay) {
                overlay.hidden = true;
                overlay.setAttribute('aria-hidden', 'true');
                overlay.classList.remove('active');
            }
            document.body.classList.remove('no-scroll', 'menu-open');
            burgerBtn.classList.remove('active');
            burgerBtn.setAttribute('aria-expanded', 'false');
        } else {
            if (!navMenu.classList.contains('active')) {
                navMenu.hidden = true;
                navMenu.setAttribute('aria-hidden', 'true');
                navMenu.setAttribute('inert', '');
                if (overlay) {
                    overlay.hidden = true;
                    overlay.setAttribute('aria-hidden', 'true');
                    overlay.classList.remove('active');
                }
            }
        }
    };

    // Aplicar estado inicial en la carga
    sincronizarEstadoBreakpoint();

    const abrirMenu = () => {
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }
        isClosing = false;

        // Revelar en el DOM antes de iniciar la animación de entrada
        navMenu.hidden = false;
        navMenu.removeAttribute('aria-hidden');
        navMenu.removeAttribute('inert');
        if (overlay) {
            overlay.hidden = false;
            overlay.setAttribute('aria-hidden', 'false');
        }

        // Forzar reflow para asegurar que el navegador procese la eliminación de hidden antes de añadir .active
        void navMenu.offsetWidth;

        navMenu.classList.add('active');
        if (overlay) overlay.classList.add('active');
        burgerBtn.classList.add('active');
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('no-scroll');
        document.body.classList.add('menu-open');

        if (closeBtn && typeof closeBtn.focus === 'function') {
            try { closeBtn.focus(); } catch (e) {}
        }
    };

    const cerrarMenu = () => {
        if (isClosing) return;
        isClosing = true;

        navMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        document.body.classList.remove('menu-open');

        let transitionEnded = false;
        const finalizationClose = () => {
            if (transitionEnded) return;
            transitionEnded = true;

            if (window.innerWidth <= 991) {
                navMenu.hidden = true;
                navMenu.setAttribute('aria-hidden', 'true');
                navMenu.setAttribute('inert', '');
                if (overlay) {
                    overlay.hidden = true;
                    overlay.setAttribute('aria-hidden', 'true');
                }
            }

            if (typeof burgerBtn.focus === 'function') {
                try { burgerBtn.focus(); } catch (e) {}
            }

            isClosing = false;
        };

        const onTransitionEnd = (e) => {
            if (e && e.target !== navMenu) return;
            navMenu.removeEventListener('transitionend', onTransitionEnd);
            finalizationClose();
        };

        navMenu.addEventListener('transitionend', onTransitionEnd);

        // Fallback controlado si transitionend no ocurre (ej. prefers-reduced-motion)
        pendingTimeout = setTimeout(() => {
            navMenu.removeEventListener('transitionend', onTransitionEnd);
            finalizationClose();
        }, 350);
    };

    // Evento Abrir / Alternar con el botón hamburguesa
    burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navMenu.classList.contains('active')) {
            cerrarMenu();
        } else {
            abrirMenu();
        }
    });

    // Evento Cerrar con el botón X del panel
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrarMenu();
        });
    }

    // Cerrar al pulsar cualquier opción de navegación del panel
    const navLinks = navMenu.querySelectorAll('.nav-link:not(#btn-toggle-catalogo-submenu), .mobile-submenu-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 991) {
                cerrarMenu();
            }
        });
    });

    // Evento Acordeón para la opción CATÁLOGO
    if (accordionBtn && submenu) {
        accordionBtn.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = submenu.classList.contains('is-open');
                if (isOpen) {
                    submenu.classList.remove('is-open');
                    accordionBtn.classList.remove('is-open');
                    accordionBtn.setAttribute('aria-expanded', 'false');
                    submenu.setAttribute('aria-hidden', 'true');
                } else {
                    submenu.classList.add('is-open');
                    accordionBtn.classList.add('is-open');
                    accordionBtn.setAttribute('aria-expanded', 'true');
                    submenu.setAttribute('aria-hidden', 'false');
                }
            } else {
                window.location.href = 'catalogo.html';
            }
        });
    }

    // Evento Cerrar al hacer clic en el overlay semitransparente
    overlay.addEventListener('click', () => {
        cerrarMenu();
    });

    // Evento Cerrar al presionar la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            cerrarMenu();
        }
    });

    // Autocierre y limpieza al redimensionar la ventana o cambiar orientación
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991 && navMenu.classList.contains('active')) {
            cerrarMenu();
        }
        sincronizarEstadoBreakpoint();
    });

    window.addEventListener('orientationchange', () => {
        sincronizarEstadoBreakpoint();
    });

    // Sincronizar submenú si la URL actual corresponde a una categoría
    sincronizarSubmenuMenuMovil();
}

/**
 * Sincroniza la categoría activa en el submenú del menú móvil según los parámetros de la URL
 */
function sincronizarSubmenuMenuMovil() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');
    const isCatalogoPage = window.location.pathname.includes('catalogo.html');

    const accordionBtn = document.getElementById('btn-toggle-catalogo-submenu');
    const submenu = document.getElementById('mobile-catalogo-submenu');
    const subLinks = document.querySelectorAll('.submenu-link');

    if (!isCatalogoPage) return;

    if (accordionBtn) {
        accordionBtn.classList.add('active');
    }

    if (cat && submenu && accordionBtn) {
        submenu.classList.add('is-open');
        accordionBtn.classList.add('is-open');
        accordionBtn.setAttribute('aria-expanded', 'true');
        submenu.setAttribute('aria-hidden', 'false');

        subLinks.forEach(link => {
            const linkCat = link.dataset.categoria;
            if (linkCat === cat) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
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
            let promoText = 'OFERTA';
            if (typeof prod.precio === 'number' && prod.precio > 0 && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number')) {
                const precioOfertaVal = prod.precio_oferta ?? prod.precioOferta;
                if (prod.precio > precioOfertaVal) {
                    const pct = Math.round(((prod.precio - precioOfertaVal) / prod.precio) * 100);
                    if (pct > 0) {
                        promoText = `OFERTA • ${pct}% OFF`;
                    }
                }
            }
            tagHtml = `<span class="product-tag promo-tag">${promoText}</span>`;
        } else if (estaAgotado) {
            tagHtml = `<span class="product-tag out-tag">Agotado</span>`;
        }

        // Precios
        const tieneOferta = !esDecant && prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number');
        const precioOfertaVal = tieneOferta ? (prod.precio_oferta ?? prod.precioOferta) : null;
        const precioActual = esDecant ? 'Desde S/ 15.00' : formatearMoneda(tieneOferta ? precioOfertaVal : prod.precio);
        const precioAnteriorHtml = (tieneOferta && typeof prod.precio === 'number')
            ? `<span class="price-old">${formatearMoneda(prod.precio)}</span>`
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
                        <svg class="icon-whatsapp whatsapp-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Consultar
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
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Consultar
                </button>
            `;
        }

        const esFav = (typeof window !== 'undefined' && window.FavoritosService) ? window.FavoritosService.esFavorito(prod.id) : false;
        const favBtnHtml = `
            <button type="button" class="favorite-toggle-btn ${esFav ? 'is-active' : ''}" data-id="${prod.id}" data-nombre="${prod.nombre}" aria-label="${esFav ? 'Quitar ' + prod.nombre + ' de favoritos' : 'Agregar ' + prod.nombre + ' a favoritos'}" aria-pressed="${esFav ? 'true' : 'false'}">
                <svg class="favorite-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="${esFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
            </button>
        `;

        card.innerHTML = `
            <div class="product-image-container">
                ${tagHtml}
                ${favBtnHtml}
                <img src="${typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="lazy" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
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
            subtitleEl.textContent = esDecant ? 'DECANT DESTACADO' : 'PERFUME ÁRABE DESTACADO';
        }

        // Título
        if (titleEl) {
            titleEl.textContent = `${prod.nombre} - ${prod.marca}`;
        }

        // Descripción
        if (descEl) {
            descEl.textContent = prod.descripcion || 'Descubre esta fragancia seleccionada especialmente por Dunes Parfums.';
        }

        // Imagen
        if (imgEl) {
            imgEl.src = typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen;
            imgEl.onerror = function() {
                this.onerror = null;
                this.src = 'img/logo/logohorizontaldunesparfums.png';
            };
            imgEl.alt = `${prod.nombre} - ${prod.marca} en oferta especial`;
        }

        // Precios y Descuento
        const tieneOferta = !esDecant && prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number');
        const precioOfertaVal = tieneOferta ? (prod.precio_oferta ?? prod.precioOferta) : null;
        const precioActual = esDecant ? (prod.precio || 15) : (tieneOferta ? precioOfertaVal : prod.precio);
        if (priceNewEl) {
            priceNewEl.textContent = esDecant ? 'Desde S/ 15.00' : formatearMoneda(precioActual);
        }

        const tieneDescuentoValido = tieneOferta && typeof prod.precio === 'number' && prod.precio > precioActual && precioActual > 0;

        if (tieneDescuentoValido) {
            if (priceOldEl) {
                priceOldEl.textContent = formatearMoneda(prod.precio);
                priceOldEl.style.display = 'inline-block';
            }
            const porcentaje = Math.round(((prod.precio - precioActual) / prod.precio) * 100);
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
            if (estaAgotado) {
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
            validityEl.textContent = 'Válido hasta agotar stock.';
        }

        // Botón y evento WhatsApp sin emojis
        if (btnEl) {
            const textoBoton = estaAgotado ? 'CONSULTAR DISPONIBILIDAD' : 'CONSULTAR OFERTA POR WHATSAPP';
            btnEl.textContent = textoBoton;

            btnEl.onclick = (e) => {
                e.preventDefault();
                let msg = `Hola, Dunes Parfums.\n\nDeseo consultar la oferta de:\n${prod.nombre}\nPresentación: ${prod.presentacion || (esDecant ? 'Decant' : 'Sellado')}\nPrecio de oferta: S/${precioActual.toFixed(2)}`;
                if (tieneDescuentoValido) {
                    msg += `\nPrecio regular: S/${prod.precio.toFixed(2)}`;
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

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const idRaw = urlParams.get('id') || urlParams.get('producto') || urlParams.get('productoId');
        const idSolicitado = String(idRaw ?? '').trim();

        if (!idSolicitado) {
            configurarSeoProductoNoEncontrado();
            mostrarMensajeProductoNoEncontrado(container, 'No se ha especificado ningún perfume para visualizar.');
            return;
        }

        let productos = [];
        if (window.productosModulo && typeof window.productosModulo.obtenerProductos === 'function') {
            productos = await window.productosModulo.obtenerProductos();
        } else if (window.ProductosService && typeof window.ProductosService.cargarProductos === 'function') {
            const res = await window.ProductosService.cargarProductos();
            productos = res ? (res.productos || []) : [];
        }

        if (!productos || productos.length === 0) {
            configurarSeoProductoNoEncontrado();
            mostrarMensajeErrorProducto(container, () => cargarDetalleProducto());
            return;
        }

        const prod = productos.find(item => item && String(item.id).trim() === idSolicitado);

        if (!prod) {
            configurarSeoProductoNoEncontrado();
            mostrarMensajeProductoNoEncontrado(container, 'Este producto ya no está disponible o el enlace no es válido.');
            return;
        }

        // Actualizar SEO dinámico del producto válido
        actualizarSeoProducto(prod);

        if (typeof window !== 'undefined' && window.Analytics) {
            const item = window.Analytics.formatItem(prod, 1);
            window.Analytics.trackEcommerce('view_item', {
                value: item.price,
                items: [item]
            });
            window.Analytics.trackClarity('view_product');
        }

        const esDecant = (prod.formato && String(prod.formato).toLowerCase().includes('decant')) || prod.categoria === 'decants';
        if (esDecant) {
            renderizarDetalleDecant(container, prod);
        } else {
            renderizarDetalleSellado(container, prod);
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        // FASE M21: Calcular y renderizar productos relacionados automáticos
        try {
            const relacionados = obtenerProductosRelacionados(prod, productos, 4);
            renderProductosRelacionados(prod, relacionados);
        } catch (relErr) {
            console.error('[Interfaz] Error al renderizar productos relacionados:', relErr);
        }

    } catch (err) {
        console.error('[Interfaz] Error al cargar detalles del producto:', err);
        configurarSeoProductoNoEncontrado();
        mostrarMensajeErrorProducto(container, () => cargarDetalleProducto());
    }
}

/**
 * Actualiza dinámicamente los metadatos SEO, título, canonical y Schema JSON-LD de un producto existente
 * @param {Object} prod
 */
function actualizarSeoProducto(prod) {
    if (!prod) return;
    const idClean = String(prod.id).trim();
    const presText = prod.presentacion ? ` ${prod.presentacion}` : '';
    const titleText = `${prod.nombre}${presText} | Dunes Parfums`;
    const descText = `Compra ${prod.nombre}${presText}, en Dunes Parfums. Consulta disponibilidad, precio y opciones de entrega en Tarapoto y todo el Perú.`;
    const canonicalUrl = `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/producto.html?id=${encodeURIComponent(idClean)}`;

    document.title = titleText;

    let metaDesc = document.getElementById('meta-description');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.id = 'meta-description';
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = descText;

    let metaRobots = document.getElementById('meta-robots');
    if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.id = 'meta-robots';
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'index, follow';

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Insertar o actualizar Schema Product JSON-LD
    let jsonLdScript = document.getElementById('schema-product-jsonld');
    if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'schema-product-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
    }

    const esDecant = (prod.formato && String(prod.formato).toLowerCase().includes('decant')) || prod.categoria === 'decants';
    const mlDisp = prod.mililitrosDisponibles ?? prod.mililitros_disponibles ?? 0;
    const precioNumerico = esDecant
        ? (prod.presentaciones && prod.presentaciones.length > 0 ? prod.presentaciones[0].precio : (prod.precio || 15))
        : (prod.precio || 0);

    const estaAgotado = esDecant
        ? (!prod.disponible || mlDisp <= 0)
        : (!prod.disponible || (prod.stock ?? 0) <= 0);

    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": prod.nombre,
        "image": prod.imagen ? (/^https?:\/\//i.test(String(prod.imagen).trim()) ? String(prod.imagen).trim() : `https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO/${String(prod.imagen).trim()}`) : '',
        "description": descText,
        "brand": {
            "@type": "Brand",
            "name": prod.marca || "Dunes Parfums"
        },
        "sku": idClean,
        "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "PEN",
            "price": precioNumerico,
            "availability": estaAgotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
        }
    };
    jsonLdScript.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * Configura metadatos de noindex y título para producto no encontrado o inválido
 */
function configurarSeoProductoNoEncontrado() {
    document.title = 'Producto no encontrado | Dunes Parfums';

    let metaDesc = document.getElementById('meta-description');
    if (metaDesc) {
        metaDesc.content = 'El producto solicitado no está disponible en el catálogo de Dunes Parfums.';
    }

    let metaRobots = document.getElementById('meta-robots');
    if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.id = 'meta-robots';
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, follow';

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
        canonicalLink.remove();
    }

    const jsonLdScript = document.getElementById('schema-product-jsonld');
    if (jsonLdScript) {
        jsonLdScript.remove();
    }
}

function mostrarMensajeProductoNoEncontrado(container, mensaje) {
    configurarSeoProductoNoEncontrado();
    container.innerHTML = `
        <div class="placeholder-page-wrapper" style="text-align: center; padding: 48px 20px; max-width: 480px; margin: 0 auto;">
            <div class="benefit-icon-wrapper" style="width: 72px; height: 72px; border-radius: 50%; background: #FFF0ED; color: #C0392B; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto;" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line></svg>
            </div>
            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 700; color: #171717; margin-bottom: 8px;">PRODUCTO NO ENCONTRADO</h2>
            <p style="font-family: 'Montserrat', sans-serif; font-size: 0.9rem; color: #666666; margin-bottom: 24px; line-height: 1.4;">${mensaje}</p>
            <a href="catalogo.html" class="btn btn-primary" style="padding: 12px 28px; font-weight: 700;">VOLVER AL CATÁLOGO</a>
        </div>
    `;
}

function mostrarMensajeErrorProducto(container, callbackReintentar) {
    container.innerHTML = `
        <div class="catalog-error-state" style="text-align: center; padding: 36px 20px; background-color: var(--surface-card, #FFFEFC); border: 1px solid var(--catalog-gold-border, #E7D3A5); border-radius: 14px; max-width: 480px; margin: 30px auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);">
            <div style="margin-bottom: 12px; color: #A83232; display: flex; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #171717; margin-bottom: 8px;">
                NO PUDIMOS CARGAR ESTE PRODUCTO
            </h3>
            <p style="font-size: 0.88rem; color: #6F6F6F; margin-bottom: 18px;">
                Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <button id="btn-reintentar-detalle" class="btn btn-primary" style="padding: 10px 24px; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin: 0 auto;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> REINTENTAR
            </button>
        </div>
    `;

    const btnRetry = container.querySelector('#btn-reintentar-detalle');
    if (btnRetry && typeof callbackReintentar === 'function') {
        btnRetry.onclick = function(e) {
            e.preventDefault();
            btnRetry.disabled = true;
            btnRetry.textContent = 'Reintentando...';
            callbackReintentar();
        };
    }
}

/**
 * Genera el HTML de la zona de imagen (imagen única o estructura de galería si existe imagen_notas)
 * @param {Object} prod
 * @returns {string} HTML
 */
function generarHtmlLadoImagen(prod) {
    const rawNotas = (prod && prod.imagen_notas) ? String(prod.imagen_notas).trim() : '';
    const urlNotasClean = rawNotas ? (typeof resolverImagen === 'function' ? resolverImagen(rawNotas, '') : rawNotas) : '';
    const urlImagenClean = (prod && prod.imagen) ? (typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen) : '';
    const zoomBadgeSvg = `
        <span class="gallery-zoom-badge" aria-hidden="true" title="Ampliar imagen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="11" x2="14" y2="11"></line></svg>
        </span>
    `;

    if (!urlNotasClean) {
        return `
            <div class="detail-image-side">
                <div class="product-gallery__zoom-trigger" id="gallery-zoom-trigger" role="button" tabindex="0" aria-label="Ampliar imagen de ${prod.nombre}">
                    <img src="${urlImagenClean}" alt="${prod.nombre} - ${prod.marca}" class="detail-product-img detail-product-img--zoomable" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                    ${zoomBadgeSvg}
                </div>
            </div>
        `;
    }

    return `
        <div class="detail-image-side product-gallery-side">
            <div class="product-gallery product-gallery--layout-side" id="product-gallery" tabindex="0" aria-label="Galería de imágenes de ${prod.nombre}">
                <div class="product-gallery__main-viewport" id="gallery-main-viewport">
                    <div class="product-gallery__track" id="gallery-track">
                        <div class="product-gallery__slide active" data-index="0" role="button" tabindex="0" aria-label="Ampliar imagen del perfume ${prod.nombre}">
                            <img src="${urlImagenClean}" alt="${prod.nombre} - ${prod.marca}" class="detail-product-img gallery-img gallery-img--main" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                        </div>
                        <div class="product-gallery__slide" data-index="1" role="button" tabindex="0" aria-label="Ampliar notas del perfume ${prod.nombre}">
                            <img src="${urlNotasClean}" alt="Notas y perfil olfativo de ${prod.nombre}" class="detail-product-img gallery-img gallery-img--notas" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                        </div>
                    </div>
                    ${zoomBadgeSvg}
                </div>

                <div class="product-gallery__thumbs product-gallery__thumbs--vertical" role="tablist" aria-label="Seleccionar imagen">
                    <button type="button" class="gallery-thumb active" data-index="0" role="tab" aria-selected="true" aria-label="Ver imagen del perfume">
                        <div class="thumb-img-wrapper">
                            <img src="${urlImagenClean}" alt="" class="thumb-img" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                        </div>
                        <span class="thumb-label">PERFUME</span>
                    </button>
                    <button type="button" class="gallery-thumb" data-index="1" role="tab" aria-selected="false" aria-label="Ver notas del perfume">
                        <div class="thumb-img-wrapper">
                            <img src="${urlNotasClean}" alt="" class="thumb-img" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                        </div>
                        <span class="thumb-label">NOTAS</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Obtiene o crea el elemento modal para el Visor de Imagen Completa (Lightbox)
 */
function obtenerOCrearLightboxModal() {
    let lightbox = document.getElementById('product-lightbox');
    if (lightbox) return lightbox;

    lightbox = document.createElement('div');
    lightbox.id = 'product-lightbox';
    lightbox.className = 'product-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Visor de imagen ampliada');
    lightbox.setAttribute('tabindex', '-1');

    lightbox.innerHTML = `
        <div class="product-lightbox__backdrop" id="lightbox-backdrop"></div>
        <div class="product-lightbox__dialog" id="lightbox-dialog">
            <button type="button" class="lightbox-close-btn" id="lightbox-close-btn" aria-label="Cerrar imagen">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <button type="button" class="lightbox-arrow lightbox-arrow--prev" id="lightbox-arrow-prev" aria-label="Imagen anterior" style="display: none;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"></path></svg>
            </button>
            <button type="button" class="lightbox-arrow lightbox-arrow--next" id="lightbox-arrow-next" aria-label="Imagen siguiente" style="display: none;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"></path></svg>
            </button>

            <div class="product-lightbox__img-wrapper" id="lightbox-img-wrapper">
                <img src="" alt="" class="lightbox-img" id="lightbox-img" decoding="async">
            </div>
        </div>
    `;

    document.body.appendChild(lightbox);
    return lightbox;
}

/**
 * Abre el visor de imagen completa (Lightbox)
 * @param {Object} prod Objeto producto
 * @param {number} initialIndex Índice de la imagen activa
 * @param {Function} [onSlideChange] Callback de sincronización con la galería principal
 */
function abrirLightboxVisor(prod, initialIndex = 0, onSlideChange = null) {
    if (!prod) return;

    let imagenes = [];

    if (typeof prod === 'string') {
        const urlClean = typeof resolverImagen === 'function' ? resolverImagen(prod) : prod;
        const altText = typeof initialIndex === 'string' ? initialIndex : 'Ficha olfativa';
        imagenes = [{ url: urlClean, alt: altText }];
        initialIndex = 0;
    } else if (typeof prod === 'object' && prod.url) {
        const urlClean = typeof resolverImagen === 'function' ? resolverImagen(prod.url) : prod.url;
        imagenes = [{ url: urlClean, alt: prod.alt || 'Ficha olfativa' }];
        initialIndex = 0;
    } else {
        const rawNotas = prod.imagen_notas ? String(prod.imagen_notas).trim() : '';
        const urlNotasClean = rawNotas ? (typeof resolverImagen === 'function' ? resolverImagen(rawNotas, '') : rawNotas) : '';
        const urlImagenClean = prod.imagen ? (typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen) : '';

        if (urlImagenClean) {
            imagenes.push({ url: urlImagenClean, alt: `${prod.nombre || ''} - ${prod.marca || ''}` });
        }
        if (urlNotasClean) {
            imagenes.push({ url: urlNotasClean, alt: `Notas y perfil olfativo de ${prod.nombre || ''}` });
        }

        if (imagenes.length === 0) {
            imagenes.push({ url: 'img/logo/logohorizontaldunesparfums.png', alt: prod.nombre || 'Dunes Parfums' });
        }
    }

    let currentIndex = (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < imagenes.length) ? initialIndex : 0;
    const tieneMultiple = imagenes.length > 1;

    const modal = obtenerOCrearLightboxModal();
    const backdrop = modal.querySelector('#lightbox-backdrop');
    const dialog = modal.querySelector('#lightbox-dialog');
    const closeBtn = modal.querySelector('#lightbox-close-btn');
    const prevBtn = modal.querySelector('#lightbox-arrow-prev');
    const nextBtn = modal.querySelector('#lightbox-arrow-next');
    const imgWrapper = modal.querySelector('#lightbox-img-wrapper');
    const imgEl = modal.querySelector('#lightbox-img');

    const triggerElement = document.activeElement;

    if (prevBtn && nextBtn) {
        if (tieneMultiple) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    function actualizarVisor() {
        if (currentIndex < 0) currentIndex = imagenes.length - 1;
        if (currentIndex >= imagenes.length) currentIndex = 0;

        const actual = imagenes[currentIndex];
        if (actual && imgEl) {
            imgEl.onerror = function() {
                this.onerror = null;
                this.src = 'img/logo/logohorizontaldunesparfums.png';
            };
            imgEl.src = actual.url;
            imgEl.alt = actual.alt;
        }

        if (typeof onSlideChange === 'function') {
            onSlideChange(currentIndex);
        }
    }

    actualizarVisor();

    document.body.classList.add('lightbox-open');

    let isClosed = false;
    function cerrarVisor() {
        if (isClosed) return;
        isClosed = true;

        modal.classList.remove('is-open');
        document.body.classList.remove('lightbox-open');
        limpiarEventosVisor();

        if (triggerElement && typeof triggerElement.focus === 'function') {
            try {
                triggerElement.focus();
            } catch (e) {}
        }
    }

    function handleCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        cerrarVisor();
    }

    function handlePrevClick(e) {
        e.preventDefault();
        e.stopPropagation();
        currentIndex--;
        actualizarVisor();
    }

    function handleNextClick(e) {
        e.preventDefault();
        e.stopPropagation();
        currentIndex++;
        actualizarVisor();
    }

    function handleBackdropClick(e) {
        if (e.target === backdrop || e.target === dialog) {
            cerrarVisor();
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            cerrarVisor();
        } else if (tieneMultiple && e.key === 'ArrowLeft') {
            e.preventDefault();
            currentIndex--;
            actualizarVisor();
        } else if (tieneMultiple && e.key === 'ArrowRight') {
            e.preventDefault();
            currentIndex++;
            actualizarVisor();
        } else if (e.key === 'Tab') {
            const focusables = modal.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (focusables.length > 0) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isSwiping = false;

    function handleTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        isSwiping = true;
    }

    function handleTouchMove(e) {
        if (!isSwiping || !e.touches || e.touches.length === 0) return;
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && tieneMultiple) {
            if (e.cancelable) e.preventDefault();
        }
    }

    function handleTouchEnd() {
        if (!isSwiping) return;
        isSwiping = false;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40 && tieneMultiple) {
            if (deltaX < 0) {
                currentIndex++;
            } else {
                currentIndex--;
            }
            actualizarVisor();
        }
    }

    closeBtn.addEventListener('click', handleCloseClick);
    if (prevBtn) prevBtn.addEventListener('click', handlePrevClick);
    if (nextBtn) nextBtn.addEventListener('click', handleNextClick);
    backdrop.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('click', handleBackdropClick);

    if (imgWrapper) {
        imgWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        imgWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        imgWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
        imgWrapper.addEventListener('touchcancel', () => { isSwiping = false; }, { passive: true });
    }

    document.addEventListener('keydown', handleKeyDown);

    function limpiarEventosVisor() {
        closeBtn.removeEventListener('click', handleCloseClick);
        if (prevBtn) prevBtn.removeEventListener('click', handlePrevClick);
        if (nextBtn) nextBtn.removeEventListener('click', handleNextClick);
        backdrop.removeEventListener('click', handleBackdropClick);
        dialog.removeEventListener('click', handleBackdropClick);
        document.removeEventListener('keydown', handleKeyDown);
    }

    requestAnimationFrame(() => {
        modal.classList.add('is-open');
        if (closeBtn) closeBtn.focus();
    });
}

/**
 * Inicializa la lógica interactiva de la galería de producto (Autoplay, Swipe, Flechas, Miniaturas, Lightbox, A11y, Manejo de Errores)
 * @param {HTMLElement} container
 * @param {Object} prod
 */
function inicializarGaleriaDetalle(container, prod) {
    if (!container || !prod) return;

    const hasNotas = Boolean(prod.imagen_notas && String(prod.imagen_notas).trim());

    // Si NO tiene imagen_notas o es modo de 1 sola imagen:
    if (!hasNotas) {
        const zoomTrigger = container.querySelector('#gallery-zoom-trigger') || container.querySelector('.detail-product-img');
        if (zoomTrigger) {
            zoomTrigger.style.cursor = 'zoom-in';
            const handleSingleZoom = (e) => {
                e.preventDefault();
                abrirLightboxVisor(prod, 0, null);
            };
            zoomTrigger.addEventListener('click', handleSingleZoom);
            zoomTrigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSingleZoom(e);
                }
            });
        }
        return;
    }

    // Modo de 2 imágenes:
    const galleryEl = container.querySelector('#product-gallery');
    if (!galleryEl) return;

    const slides = galleryEl.querySelectorAll('.product-gallery__slide');
    const thumbs = galleryEl.querySelectorAll('.gallery-thumb');
    const prevBtn = galleryEl.querySelector('#gallery-arrow-prev');
    const nextBtn = galleryEl.querySelector('#gallery-arrow-next');
    const viewportEl = galleryEl.querySelector('#gallery-main-viewport');

    let currentIndex = 0;
    let autoplayTimer = null;
    let userInteracted = false;
    let isDestroyed = false;

    // Control de errores en imagen de notas externa
    const imgNotas = galleryEl.querySelector('.gallery-img--notas');
    const thumbImgNotas = galleryEl.querySelector('.gallery-thumb[data-index="1"] .thumb-img');

    function revertirAImagenUnica() {
        if (isDestroyed) return;
        isDestroyed = true;
        detenerAutoplay();
        limpiarListeners();

        const sideContainer = container.querySelector('.detail-image-side');
        if (sideContainer) {
            sideContainer.className = 'detail-image-side';
            const zoomBadgeSvg = `
                <span class="gallery-zoom-badge" aria-hidden="true" title="Ampliar imagen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="11" x2="14" y2="11"></line></svg>
                </span>
            `;
            sideContainer.innerHTML = `
                <div class="product-gallery__zoom-trigger" id="gallery-zoom-trigger" role="button" tabindex="0" aria-label="Ampliar imagen de ${prod.nombre}">
                    <img src="${typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="detail-product-img detail-product-img--zoomable" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                    ${zoomBadgeSvg}
                </div>
            `;
            const zoomTrigger = sideContainer.querySelector('#gallery-zoom-trigger');
            if (zoomTrigger) {
                zoomTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    abrirLightboxVisor(prod, 0, null);
                });
            }
        }
    }

    if (imgNotas) {
        if (imgNotas.complete && imgNotas.naturalWidth === 0 && imgNotas.src) {
            revertirAImagenUnica();
        } else {
            imgNotas.addEventListener('error', () => {
                revertirAImagenUnica();
            });
        }
    }
    if (thumbImgNotas) {
        if (thumbImgNotas.complete && thumbImgNotas.naturalWidth === 0 && thumbImgNotas.src) {
            revertirAImagenUnica();
        } else {
            thumbImgNotas.addEventListener('error', () => {
                revertirAImagenUnica();
            });
        }
    }

    function cambiarSlide(nuevoIndex, esInteraccionManual = false) {
        if (isDestroyed) return;

        if (esInteraccionManual) {
            userInteracted = true;
            detenerAutoplay();
        }

        if (!esInteraccionManual && nuevoIndex === 1 && imgNotas) {
            if (!imgNotas.complete || imgNotas.naturalWidth === 0) {
                return;
            }
        }

        currentIndex = (nuevoIndex + 2) % 2;

        slides.forEach((slide, idx) => {
            if (idx === currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        thumbs.forEach((thumb, idx) => {
            if (idx === currentIndex) {
                thumb.classList.add('active');
                thumb.setAttribute('aria-selected', 'true');
            } else {
                thumb.classList.remove('active');
                thumb.setAttribute('aria-selected', 'false');
            }
        });
    }

    function siguienteSlide(esManual = false) {
        cambiarSlide(currentIndex + 1, esManual);
    }

    function anteriorSlide(esManual = false) {
        cambiarSlide(currentIndex - 1, esManual);
    }

    function iniciarAutoplay() {
        if (userInteracted || autoplayTimer || isDestroyed) return;

        if (typeof window !== 'undefined' && window.matchMedia) {
            try {
                const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReduced) return;
            } catch (e) {}
        }

        if (typeof document !== 'undefined' && document.hidden) return;

        autoplayTimer = setInterval(() => {
            if (userInteracted || (typeof document !== 'undefined' && document.hidden) || isDestroyed) {
                detenerAutoplay();
                return;
            }
            siguienteSlide(false);
        }, 3000);
    }

    function detenerAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    // Vincular clic en slides para abrir el visor Lightbox
    slides.forEach(slide => {
        slide.addEventListener('click', (e) => {
            // Ignorar clic si fue sobre las flechas de navegación
            if (e.target.closest('#gallery-arrow-prev') || e.target.closest('#gallery-arrow-next')) {
                return;
            }
            e.preventDefault();
            userInteracted = true;
            detenerAutoplay();
            abrirLightboxVisor(prod, currentIndex, (nuevoIdx) => {
                cambiarSlide(nuevoIdx, true);
            });
        });

        slide.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                userInteracted = true;
                detenerAutoplay();
                abrirLightboxVisor(prod, currentIndex, (nuevoIdx) => {
                    cambiarSlide(nuevoIdx, true);
                });
            }
        });
    });

    // Eventos de miniaturas (solo cambian slide sin abrir lightbox)
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = parseInt(thumb.getAttribute('data-index')) || 0;
            cambiarSlide(idx, true);
        });
    });

    // Eventos de flechas
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            anteriorSlide(true);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            siguienteSlide(true);
        });
    }

    // Swipe táctil en viewport principal
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isSwiping = false;

    function handleTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        isSwiping = true;
        userInteracted = true;
        detenerAutoplay();
    }

    function handleTouchMove(e) {
        if (!isSwiping || !e.touches || e.touches.length === 0) return;
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    }

    function handleTouchEnd() {
        if (!isSwiping) return;
        isSwiping = false;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                siguienteSlide(true);
            } else {
                anteriorSlide(true);
            }
        }
    }

    if (viewportEl) {
        viewportEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        viewportEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        viewportEl.addEventListener('touchend', handleTouchEnd, { passive: true });
        viewportEl.addEventListener('touchcancel', () => { isSwiping = false; }, { passive: true });
    }

    // Teclado en la galería principal
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            anteriorSlide(true);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            siguienteSlide(true);
        }
    }
    galleryEl.addEventListener('keydown', handleKeyDown);

    // Visibilidad de pestaña
    function handleVisibilityChange() {
        if (typeof document !== 'undefined' && document.hidden) {
            detenerAutoplay();
        } else {
            if (!userInteracted && !isDestroyed) {
                iniciarAutoplay();
            }
        }
    }
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    function limpiarListeners() {
        if (typeof document !== 'undefined' && document.removeEventListener) {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }

    iniciarAutoplay();
}

/**
 * Renderiza la ficha técnica de un perfume SELLADO
 */
function renderizarDetalleSellado(container, prod) {
    const esFav = (typeof window !== 'undefined' && window.FavoritosService) ? window.FavoritosService.esFavorito(prod.id) : false;
    const presentacionFormateada = `Sellado / ${prod.presentacion}`;
    const stockHtml = prod.disponible && prod.stock > 0
        ? `<span class="detail-stock-badge in-stock">Disponible (${prod.stock} unidades)</span>`
        : `<span class="detail-stock-badge out-of-stock">Agotado</span>`;

    const tieneOferta = prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number');
    const precioOfertaVal = tieneOferta ? (prod.precio_oferta ?? prod.precioOferta) : null;
    const precioActual = tieneOferta ? precioOfertaVal : prod.precio;
    const precioAnteriorHtml = (tieneOferta && typeof prod.precio === 'number')
        ? `<span class="price-old">${formatearMoneda(prod.precio)}</span>`
        : '';

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
                <button class="btn btn-primary btn-add-cart-detail" id="btn-add-cart-detail" data-id="${prod.id}">Agregar al Carrito</button>
                <button class="btn btn-secondary btn-query-detail" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>Consultar por WhatsApp
                </button>
            </div>
        `;
    } else {
        pickerAndActionsHtml = `
            <div class="detail-btn-row">
                <button class="btn btn-secondary btn-query-detail" style="width: 100%;" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>Consultar reingreso por WhatsApp
                </button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-detail-layout">
            ${generarHtmlLadoImagen(prod)}
            <div class="detail-info-side">
                <span class="detail-brand">${prod.marca}</span>
                <h2 class="detail-title">${prod.nombre}</h2>
                <span class="detail-volume">${presentacionFormateada}</span>

                <div class="detail-price-box">
                    ${precioAnteriorHtml}
                    <span class="detail-price">${formatearMoneda(precioActual)}</span>
                </div>

                <div class="detail-stock-box">
                    ${stockHtml}
                </div>

                <div class="detail-favorite-row" style="margin-top: 10px; margin-bottom: 12px;">
                    <button type="button" class="btn-detail-favorite ${esFav ? 'is-active' : ''}" id="btn-detail-favorite" data-id="${prod.id}" data-nombre="${prod.nombre}" aria-pressed="${esFav ? 'true' : 'false'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${esFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                        </svg>
                        <span class="btn-detail-favorite-text">${esFav ? 'Guardado en favoritos' : 'Guardar en favoritos'}</span>
                    </button>
                </div>

                <div class="detail-divider"></div>

                ${pickerAndActionsHtml}

                <div class="detail-divider"></div>

                <div class="detail-description-accordion">
                    <button type="button" class="description-accordion-btn" id="btn-toggle-description" aria-expanded="false" aria-controls="detail-description-content">
                        <span>Descripción de la fragancia</span>
                        <svg class="accordion-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                    <div class="description-accordion-content" id="detail-description-content" aria-hidden="true">
                        <p>${prod.descripcion || 'Una fina fragancia de nuestra selección exclusiva.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Vincular acordeón de descripción
    const descBtnSellado = container.querySelector('#btn-toggle-description');
    const descContentSellado = container.querySelector('#detail-description-content');
    if (descBtnSellado && descContentSellado) {
        descBtnSellado.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.innerWidth >= 769) return;
            const isExpanded = descBtnSellado.getAttribute('aria-expanded') === 'true';
            descBtnSellado.setAttribute('aria-expanded', !isExpanded);
            descContentSellado.setAttribute('aria-hidden', isExpanded);
            descContentSellado.classList.toggle('active', !isExpanded);
        });
    }

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

            inicializarBarraMovilDetalle(prod, addCartBtn, () => {
                return {
                    nombre: prod.nombre,
                    variante: `Sellado · ${prod.presentacion || '100 ml'}`,
                    precio: (prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number')) ? (prod.precio_oferta ?? prod.precioOferta) : prod.precio
                };
            });
        }
    }

    const queryBtn = document.getElementById('btn-query-detail');
    if (queryBtn) {
        queryBtn.addEventListener('click', () => {
            window.whatsappConfig.consultarDisponibilidad(prod.nombre, prod.marca, presentacionFormateada);
        });
    }

    // Inicializar galería de 2 imágenes si existe imagen_notas válida
    inicializarGaleriaDetalle(container, prod);
}

/**
 * Renderiza la ficha técnica de un perfume DECANT con selector de presentación
 */
function renderizarDetalleDecant(container, prod) {
    const esFav = (typeof window !== 'undefined' && window.FavoritosService) ? window.FavoritosService.esFavorito(prod.id) : false;
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
                <button class="btn btn-primary btn-add-cart-detail" id="btn-add-cart-detail" data-id="${prod.id}">Agregar al Carrito</button>
                <button class="btn btn-secondary btn-query-detail" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>Consultar por WhatsApp
                </button>
            </div>
        `;
    } else {
        pickerAndActionsHtml = `
            <div class="detail-btn-row">
                <button class="btn btn-secondary btn-query-detail" style="width: 100%;" id="btn-query-detail" data-nombre="${prod.nombre}">
                    <svg class="icon-whatsapp whatsapp-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>Consultar reingreso por WhatsApp
                </button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-detail-layout">
            ${generarHtmlLadoImagen(prod)}
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

                <div class="detail-favorite-row" style="margin-top: 10px; margin-bottom: 12px;">
                    <button type="button" class="btn-detail-favorite ${esFav ? 'is-active' : ''}" id="btn-detail-favorite" data-id="${prod.id}" data-nombre="${prod.nombre}" aria-pressed="${esFav ? 'true' : 'false'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${esFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                        </svg>
                        <span class="btn-detail-favorite-text">${esFav ? 'Guardado en favoritos' : 'Guardar en favoritos'}</span>
                    </button>
                </div>

                <div class="detail-divider"></div>

                ${pickerAndActionsHtml}

                <div class="detail-divider"></div>

                <div class="detail-description-accordion">
                    <button type="button" class="description-accordion-btn" id="btn-toggle-description-decant" aria-expanded="false" aria-controls="detail-description-content-decant">
                        <span>Descripción de la fragancia</span>
                        <svg class="accordion-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                    <div class="description-accordion-content" id="detail-description-content-decant" aria-hidden="true">
                        <p>${prod.descripcion || 'Una fina fragancia de nuestra selección exclusiva.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Vincular acordeón de descripción en Decants
    const descBtnDecant = container.querySelector('#btn-toggle-description-decant');
    const descContentDecant = container.querySelector('#detail-description-content-decant');
    if (descBtnDecant && descContentDecant) {
        descBtnDecant.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.innerWidth >= 769) return;
            const isExpanded = descBtnDecant.getAttribute('aria-expanded') === 'true';
            descBtnDecant.setAttribute('aria-expanded', !isExpanded);
            descContentDecant.setAttribute('aria-hidden', isExpanded);
            descContentDecant.classList.toggle('active', !isExpanded);
        });
    }

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

            inicializarBarraMovilDetalle(prod, addCartBtn, () => {
                const activeBtn = container.querySelector('.variant-option-btn.active');
                const nombrePresentacion = activeBtn ? activeBtn.dataset.nombre : (selectedMl ? `${selectedMl} ml` : prod.presentacion);
                return {
                    nombre: prod.nombre,
                    variante: nombrePresentacion,
                    precio: selectedPrecio
                };
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

    // Inicializar galería de 2 imágenes si existe imagen_notas válida
    inicializarGaleriaDetalle(container, prod);
}

/**
 * Crea el elemento HTML de la barra móvil de compra rápida si no existe
 */
function crearBarraMovilDetalle() {
    let bar = document.getElementById('mobile-purchase-bar');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = 'mobile-purchase-bar';
    bar.className = 'mobile-purchase-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `
        <div class="mobile-purchase-bar__info">
            <span class="mobile-purchase-bar__variant" id="mobile-bar-variant"></span>
            <span class="mobile-purchase-bar__price" id="mobile-bar-price"></span>
        </div>
        <button type="button" class="btn btn-primary mobile-purchase-bar__action" id="mobile-bar-add-btn">
            AGREGAR
        </button>
    `;

    if (document.body) {
        document.body.appendChild(bar);
    }
    return bar;
}

/**
 * Actualiza la información dinámica de la barra móvil de compra rápida
 */
function actualizarBarraMovilDetalle(bar, info) {
    if (!bar || !info) return;
    const variantEl = bar.querySelector('#mobile-bar-variant');
    const priceEl = bar.querySelector('#mobile-bar-price');
    const btnEl = bar.querySelector('#mobile-bar-add-btn');

    if (variantEl) variantEl.textContent = info.variante || info.nombre || '';
    if (priceEl) {
        priceEl.textContent = typeof info.precio === 'number'
            ? `S/ ${info.precio.toFixed(2)}`
            : (info.precio || '');
    }
    if (btnEl) {
        const labelNombre = info.nombre || 'fragancia';
        const labelVar = info.variante ? ` (${info.variante})` : '';
        btnEl.setAttribute('aria-label', `Agregar ${labelNombre}${labelVar} al carrito`);
    }
}

/**
 * Inicializa la barra móvil con IntersectionObserver sobre el botón principal
 */
function inicializarBarraMovilDetalle(prod, targetBtn, obtenerEstadoCallback) {
    if (!targetBtn || !prod || !prod.disponible) return;

    const bar = crearBarraMovilDetalle();
    const actionBtn = bar.querySelector('#mobile-bar-add-btn');

    // Desvincular listener anterior si existía para evitar eventos duplicados
    if (actionBtn) {
        const oldHandler = actionBtn._m12Handler;
        if (oldHandler) actionBtn.removeEventListener('click', oldHandler);

        const newHandler = (e) => {
            e.preventDefault();
            targetBtn.click();
        };
        actionBtn._m12Handler = newHandler;
        actionBtn.addEventListener('click', newHandler);
    }

    const updateVisibility = (isOut) => {
        const width = window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0);
        if (isOut && width <= 768 && prod.disponible) {
            const currentInfo = typeof obtenerEstadoCallback === 'function'
                ? obtenerEstadoCallback()
                : { nombre: prod.nombre, precio: prod.precio, variante: prod.presentacion };
            actualizarBarraMovilDetalle(bar, currentInfo);
            bar.classList.add('is-visible');
            bar.setAttribute('aria-hidden', 'false');
            if (document.body) document.body.classList.add('has-mobile-purchase-bar-visible');
        } else {
            bar.classList.remove('is-visible');
            bar.setAttribute('aria-hidden', 'true');
            if (document.body) document.body.classList.remove('has-mobile-purchase-bar-visible');
        }
    };

    if (typeof IntersectionObserver !== 'undefined') {
        if (window._m12Observer) window._m12Observer.disconnect();
        window._m12Observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                updateVisibility(!entry.isIntersecting);
            });
        }, { threshold: 0.1 });
        window._m12Observer.observe(targetBtn);
    } else {
        const handleScroll = () => {
            if (!targetBtn.getBoundingClientRect) return;
            const rect = targetBtn.getBoundingClientRect();
            const isOut = rect.bottom < 0 || rect.top > (window.innerHeight || 800);
            updateVisibility(isOut);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
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

        const bar = document.getElementById('mobile-checkout-bar');
        if (bar) {
            bar.classList.remove('is-visible');
            bar.setAttribute('aria-hidden', 'true');
            if (document.body) document.body.classList.remove('has-mobile-checkout-bar-visible');
        }

        return;
    }

    // Activar columna derecha
    const summaryCol = document.querySelector('.cart-summary-column');
    if (summaryCol) {
        summaryCol.style.opacity = '1';
        summaryCol.style.pointerEvents = 'auto';
    }

    if (typeof window !== 'undefined' && window.Analytics && !window._viewCartSent) {
        window._viewCartSent = true;
        const subtotal = items.reduce((acc, i) => acc + ((i.precioUnitario || 0) * (i.cantidad || 1)), 0);
        window.Analytics.trackViewCart(items, subtotal);
    }
    const emptyBtn = document.getElementById('btn-empty-cart');
    if (emptyBtn) emptyBtn.style.display = 'inline-block';

    const btnConfirmar = document.getElementById('btn-confirmar-whatsapp');
    if (btnConfirmar) {
        inicializarBarraMovilCarrito(btnConfirmar);
    }

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
                    <img src="${typeof resolverImagen === 'function' ? resolverImagen(item.imagen) : item.imagen}" alt="${item.nombre}" class="cart-item-img" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
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
                    <button class="btn-remove-item" data-id="${item.id}" aria-label="Eliminar de carrito">×</button>
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

const ZONAS_DELIVERY_LOCAL = {
    cacatachi: {
        nombre: "Cacatachi",
        referencia: "Cacatachi",
        costo: 0
    },
    morales: {
        nombre: "Morales",
        referencia: "La Planicie, Oasis, Las Brisas y Plaza",
        costo: 3
    },
    tarapoto_central: {
        nombre: "Tarapoto – Sector Central",
        referencia: "Plaza Mayor, Partido Alto, Circunvalación, Suchiche, 9 de Abril y Atumpampa",
        costo: 4
    },
    tarapoto_aeropuerto: {
        nombre: "Tarapoto – Sector Aeropuerto",
        referencia: "Barrio Huayco, Av. Cáceres y zona del Aeropuerto",
        costo: 4.5
    },
    banda_entrada: {
        nombre: "La Banda de Shilcayo",
        referencia: "Plaza y entrada de La Banda",
        costo: 5
    },
    banda_alta: {
        nombre: "La Banda Alta",
        referencia: "Satélite, La Victoria, Nadine Heredia, AA. VV. Venecia y La Molina",
        costo: 6
    }
};

const CONFIG_DELIVERY_LOCAL = {
    montoMinimoGratis: 30,
    zonas: ZONAS_DELIVERY_LOCAL
};

window.ZONAS_DELIVERY_LOCAL = ZONAS_DELIVERY_LOCAL;
window.CONFIG_DELIVERY_LOCAL = CONFIG_DELIVERY_LOCAL;

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

function seleccionarTipoEntrega(tipo) {
    selectedDeliveryType = tipo;
    return selectedDeliveryType;
}

function seleccionarZonaEntrega(zona) {
    selectedDeliveryZone = zona;
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
    
    Object.keys(ZONAS_DELIVERY_LOCAL).forEach(key => {
        const z = ZONAS_DELIVERY_LOCAL[key];
        const btn = document.querySelector(`.zone-option-btn[data-zona="${key}"]`);
        if (!btn) return;

        const esGratis = key === 'cacatachi' || isFree;
        const priceBadgeHtml = esGratis
            ? `<span class="delivery-zone-price gratis">GRATIS</span>`
            : `<span class="delivery-zone-price">S/ ${z.costo.toFixed(2)}</span>`;

        const isSelected = selectedDeliveryZone === key;
        btn.classList.toggle('selected', isSelected);
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');

        btn.innerHTML = `
            <div class="zone-radio-indicator" aria-hidden="true"></div>
            <div class="zone-info">
                <span class="delivery-zone-name">${z.nombre}</span>
                <span class="delivery-zone-ref">${z.referencia}</span>
            </div>
            <div class="zone-price-container">
                ${priceBadgeHtml}
            </div>
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
    const deliveryFieldsWrapper = document.getElementById('delivery-fields-wrapper');
    const blockTotalPagar = document.getElementById('block-total-pagar');
    const btnConfirmar = document.getElementById('btn-confirmar-whatsapp');
    
    if (!warningBox || !blockDelivery || !blockAgencia || !blockRecojo) return;
    
    blockDelivery.style.display = 'none';
    blockAgencia.style.display = 'none';
    blockRecojo.style.display = 'none';
    if (deliveryFieldsWrapper) deliveryFieldsWrapper.style.display = 'none';

    // CORRECCIÓN M13.2: El bloque de total a pagar y el botón de confirmación permanecen siempre visibles
    if (blockTotalPagar) blockTotalPagar.style.display = 'block';
    if (btnConfirmar) {
        btnConfirmar.style.display = 'inline-flex';
        btnConfirmar.disabled = false;
    }
    
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
            if (selectedDeliveryZone) {
                if (deliveryFieldsWrapper) deliveryFieldsWrapper.style.display = 'block';
            } else {
                if (deliveryFieldsWrapper) deliveryFieldsWrapper.style.display = 'none';
            }
            if (document.getElementById('delivery-name')) document.getElementById('delivery-name').required = true;
            if (document.getElementById('delivery-address')) document.getElementById('delivery-address').required = true;
            if (document.getElementById('delivery-reference')) document.getElementById('delivery-reference').required = false;
            if (document.getElementById('recojo-name')) document.getElementById('recojo-name').required = false;
        } else if (selectedDeliveryType === 'agencia') {
            blockAgencia.style.display = 'block';
            if (document.getElementById('delivery-name')) document.getElementById('delivery-name').required = false;
            if (document.getElementById('delivery-address')) document.getElementById('delivery-address').required = false;
            if (document.getElementById('delivery-reference')) document.getElementById('delivery-reference').required = false;
            if (document.getElementById('recojo-name')) document.getElementById('recojo-name').required = false;
        } else if (selectedDeliveryType === 'recojo-local') {
            blockRecojo.style.display = 'block';
            if (document.getElementById('recojo-name')) document.getElementById('recojo-name').required = true;
            if (document.getElementById('delivery-name')) document.getElementById('delivery-name').required = false;
            if (document.getElementById('delivery-address')) document.getElementById('delivery-address').required = false;
            if (document.getElementById('delivery-reference')) document.getElementById('delivery-reference').required = false;
        }
    } else {
        warningBox.style.display = 'block';
        if (document.getElementById('delivery-name')) document.getElementById('delivery-name').required = false;
        if (document.getElementById('delivery-address')) document.getElementById('delivery-address').required = false;
        if (document.getElementById('delivery-reference')) document.getElementById('delivery-reference').required = false;
        if (document.getElementById('recojo-name')) document.getElementById('recojo-name').required = false;
    }
    
    const items = window.carritoModulo.obtenerCarrito();
    const subtotal = items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    
    actualizarBotonesZona(subtotal);
    actualizarMensajeDeliveryGratis(subtotal, selectedDeliveryZone);
    actualizarMensajeAgenciaGratis(subtotal);
    actualizarResumenEntrega();
    validarDatosEntrega();
}

// ==========================================================================
// Persistencia del Cupón en LocalStorage (Fase C4)
// Clave: dunes_coupon_v1 (solo guarda versión, código normalizado y fecha)
// ==========================================================================
const LOCALSTORAGE_COUPON_KEY = 'dunes_coupon_v1';

function guardarCuponPersistido(codigo) {
    if (!codigo || typeof codigo !== 'string') return;
    try {
        const payload = {
            version: 1,
            codigo: codigo.trim().toUpperCase(),
            guardadoEn: new Date().toISOString()
        };
        localStorage.setItem(LOCALSTORAGE_COUPON_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('[CuponesPersistencia] No se pudo guardar el cupón en localStorage:', e);
    }
}

function obtenerCuponPersistido() {
    try {
        const raw = localStorage.getItem(LOCALSTORAGE_COUPON_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1 || !parsed.codigo || typeof parsed.codigo !== 'string') {
            eliminarCuponPersistido();
            return null;
        }
        return parsed.codigo.trim().toUpperCase();
    } catch (e) {
        console.warn('[CuponesPersistencia] Error al leer el cupón persistido, limpiando clave:', e);
        eliminarCuponPersistido();
        return null;
    }
}

function eliminarCuponPersistido() {
    try {
        localStorage.removeItem(LOCALSTORAGE_COUPON_KEY);
    } catch (e) {
        console.warn('[CuponesPersistencia] Error al eliminar el cupón de localStorage:', e);
    }
}

let estadoCuponTemporal = {
    codigo: '',
    cupon: null,
    resultado: null,
    aplicado: false,
    persistido: false,
    restaurado: false
};

function recalcularCuponEstado() {
    if (!estadoCuponTemporal.codigo) {
        estadoCuponTemporal.aplicado = false;
        estadoCuponTemporal.resultado = null;
        return null;
    }

    if (!estadoCuponTemporal.cupon) {
        estadoCuponTemporal.aplicado = false;
        return estadoCuponTemporal.resultado;
    }

    const items = window.carritoModulo ? window.carritoModulo.obtenerCarrito() : [];
    if (!items || items.length === 0) {
        estadoCuponTemporal.aplicado = false;
        estadoCuponTemporal.resultado = {
            valido: false,
            codigo: estadoCuponTemporal.codigo,
            estado: 'carrito_vacio',
            mensaje: 'El carrito está vacío.',
            cupon: estadoCuponTemporal.cupon,
            subtotalBruto: 0,
            subtotalElegible: 0,
            descuento: 0,
            subtotalNeto: 0,
            montoFaltante: 0
        };

        // Si el carrito está completamente vacío, eliminar cupón persistido
        eliminarCuponPersistido();
        estadoCuponTemporal.persistido = false;

        return estadoCuponTemporal.resultado;
    }

    const subtotalBruto = items.reduce((acc, item) => acc + ((Number(item.precioUnitario ?? item.precio) || 0) * (Number(item.cantidad) || 0)), 0);

    if (window.cuponesModulo && typeof window.cuponesModulo.validarCupon === 'function') {
        const resultado = window.cuponesModulo.validarCupon(estadoCuponTemporal.cupon, {
            items,
            subtotalBruto,
            codigo: estadoCuponTemporal.codigo
        });
        estadoCuponTemporal.resultado = resultado;
        estadoCuponTemporal.aplicado = resultado.valido;

        const estadosQueConservanCodigo = [
            'cupon_valido',
            'monto_minimo_no_alcanzado',
            'sin_productos_elegibles',
            'cupon_no_iniciado',
            'error_servicio'
        ];

        if (estadosQueConservanCodigo.includes(resultado.estado)) {
            guardarCuponPersistido(estadoCuponTemporal.codigo);
            estadoCuponTemporal.persistido = true;
        } else {
            eliminarCuponPersistido();
            estadoCuponTemporal.persistido = false;
        }

        return resultado;
    }

    return null;
}

async function aplicarCuponTemporal(codigo, esRestauracion = false) {
    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
        quitarCuponTemporal();
        return { valido: false, estado: 'codigo_vacio', mensaje: 'Código vacío.' };
    }

    const codigoLimpio = codigo.trim().toUpperCase();
    const items = window.carritoModulo ? window.carritoModulo.obtenerCarrito() : [];
    const subtotalBruto = items.reduce((acc, item) => acc + ((Number(item.precioUnitario ?? item.precio) || 0) * (Number(item.cantidad) || 0)), 0);

    if (!window.cuponesModulo || typeof window.cuponesModulo.validarCuponPorCodigo !== 'function') {
        const resultadoError = {
            valido: false,
            codigo: codigoLimpio,
            estado: 'error_servicio',
            mensaje: 'Servicio de cupones no disponible.',
            cupon: null,
            subtotalBruto,
            subtotalElegible: 0,
            descuento: 0,
            subtotalNeto: subtotalBruto,
            montoFaltante: 0
        };
        estadoCuponTemporal = {
            codigo: codigoLimpio,
            cupon: null,
            resultado: resultadoError,
            aplicado: false,
            persistido: true,
            restaurado: esRestauracion
        };
        guardarCuponPersistido(codigoLimpio);
        if (typeof actualizarResumenEntrega === 'function') actualizarResumenEntrega();
        return resultadoError;
    }

    const resultado = await window.cuponesModulo.validarCuponPorCodigo(codigoLimpio, {
        items,
        subtotalBruto
    });

    estadoCuponTemporal = {
        codigo: codigoLimpio,
        cupon: resultado.cupon || null,
        resultado: resultado,
        aplicado: resultado.valido,
        persistido: true,
        restaurado: esRestauracion
    };

    const estadosQueConservanCodigo = [
        'cupon_valido',
        'monto_minimo_no_alcanzado',
        'sin_productos_elegibles',
        'cupon_no_iniciado',
        'error_servicio'
    ];

    if (estadosQueConservanCodigo.includes(resultado.estado)) {
        guardarCuponPersistido(codigoLimpio);
        estadoCuponTemporal.persistido = true;
    } else {
        eliminarCuponPersistido();
        estadoCuponTemporal.persistido = false;
    }

    if (typeof actualizarResumenEntrega === 'function') {
        actualizarResumenEntrega();
    }

    return resultado;
}

function quitarCuponTemporal() {
    estadoCuponTemporal = {
        codigo: '',
        cupon: null,
        resultado: null,
        aplicado: false,
        persistido: false,
        restaurado: false
    };

    eliminarCuponPersistido();

    if (typeof actualizarResumenEntrega === 'function') {
        actualizarResumenEntrega();
    }

    return obtenerEstadoCuponTemporal();
}

function obtenerEstadoCuponTemporal() {
    return {
        ...estadoCuponTemporal,
        codigoPersistido: obtenerCuponPersistido()
    };
}

function recalcularCuponTemporal() {
    recalcularCuponEstado();
    if (typeof actualizarResumenEntrega === 'function') {
        actualizarResumenEntrega();
    }
    return obtenerEstadoCuponTemporal();
}

let restauracionIniciada = false;
let restauracionPromise = null;

async function restaurarCuponPersistido() {
    if (restauracionIniciada && restauracionPromise) {
        return restauracionPromise;
    }

    const codigoPersistido = obtenerCuponPersistido();
    if (!codigoPersistido) {
        return null;
    }

    restauracionIniciada = true;
    restauracionPromise = (async () => {
        try {
            const resultado = await aplicarCuponTemporal(codigoPersistido, true);
            return resultado;
        } catch (e) {
            console.error('[CuponesCheckout] Error al restaurar el cupón persistido:', e);
            return null;
        } finally {
            restauracionIniciada = false;
        }
    })();

    return restauracionPromise;
}

// Exponer API pública para pruebas por consola (Fases C3 y C4)
window.cuponesCheckout = {
    aplicarCupon: aplicarCuponTemporal,
    quitarCupon: quitarCuponTemporal,
    obtenerEstado: obtenerEstadoCuponTemporal,
    recalcularCupon: recalcularCuponTemporal,
    restaurarCuponPersistido: restaurarCuponPersistido
};

function obtenerTotalesPedido() {
    const items = window.carritoModulo ? window.carritoModulo.obtenerCarrito() : [];
    const subtotalBruto = items.reduce((acc, item) => acc + ((Number(item.precioUnitario ?? item.precio) || 0) * (Number(item.cantidad) || 0)), 0);

    // Recalcular estado del cupón con los ítems actuales
    const resultadoCupon = recalcularCuponEstado();
    const descuento = (resultadoCupon && resultadoCupon.valido) ? resultadoCupon.descuento : 0;
    const subtotalNeto = Math.max(0, subtotalBruto - descuento);

    let costoEntrega = 0;
    let conceptoEntrega = 'Costo de envío:';

    if (subtotalBruto > 0) {
        if (selectedDeliveryType === 'delivery-local') {
            conceptoEntrega = 'Costo de delivery:';
            if (selectedDeliveryZone) {
                // REGLA OBLIGATORIA: Delivery gratis se evalúa SOBRE EL SUBTOTAL BRUTO antes del cupón
                costoEntrega = calcularCostoDeliveryLocal(subtotalBruto, selectedDeliveryZone);
            } else {
                costoEntrega = 0;
            }
        } else if (selectedDeliveryType === 'agencia') {
            conceptoEntrega = 'Embalaje y llevada a la agencia:';
            // REGLA OBLIGATORIA: Agencia gratis se evalúa SOBRE EL SUBTOTAL BRUTO antes del cupón
            costoEntrega = calcularCargoAgencia(subtotalBruto);
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

    // FÓRMULA OFICIAL: totalFinal = subtotalNeto + costoEntrega
    const totalFinal = subtotalBruto === 0 ? 0 : (subtotalNeto + costoEntrega);

    return {
        subtotalBruto,
        subtotalProductos: subtotalBruto, // Compatibilidad con código previo
        descuento,
        subtotalNeto,
        costoEntrega,
        conceptoEntrega,
        totalFinal,
        cuponAplicado: (resultadoCupon && resultadoCupon.valido) ? {
            codigo: resultadoCupon.codigo,
            tipo: resultadoCupon.cupon ? resultadoCupon.cupon.tipo : '',
            valor: resultadoCupon.cupon ? resultadoCupon.cupon.valor : 0,
            descuento: resultadoCupon.descuento
        } : null,
        resultadoCupon
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

    const discountRow = document.getElementById('coupon-discount-row') || document.getElementById('summary-discount-row');
    const discountLabel = document.getElementById('coupon-discount-label') || document.getElementById('summary-discount-label');
    const discountValue = document.getElementById('coupon-discount-value') || document.getElementById('summary-discount-amount');

    const totalMontoPagar = document.getElementById('total-monto-pagar');
    const totalMontoInfo = document.getElementById('total-monto-info');
    
    if (!summaryType) return;
    
    const totales = obtenerTotalesPedido();
    const { subtotalProductos, subtotalNeto, descuento, costoEntrega, conceptoEntrega, totalFinal, cuponAplicado } = totales;
    
    if (subtotalSpan) subtotalSpan.textContent = formatearMoneda(subtotalProductos);
    if (labelSpan) labelSpan.textContent = conceptoEntrega;
    
    // Actualizar fila de descuento
    if (discountRow) {
        if (cuponAplicado && descuento > 0) {
            discountRow.style.display = 'flex';
            if (discountLabel) {
                discountLabel.textContent = `Descuento (${cuponAplicado.codigo}):`;
            }
            if (discountValue) {
                discountValue.textContent = `- S/ ${descuento.toFixed(2)}`;
            }
        } else {
            discountRow.style.display = 'none';
            if (discountLabel) {
                discountLabel.textContent = 'Descuento:';
            }
            if (discountValue) {
                discountValue.textContent = '- S/ 0.00';
            }
        }
    }

    if (selectedDeliveryType === 'delivery-local') {
        summaryType.textContent = 'Delivery local';
        if (summaryZoneRow) summaryZoneRow.style.display = 'flex';
        
        if (selectedDeliveryZone && ZONAS_DELIVERY_LOCAL[selectedDeliveryZone]) {
            const zInfo = ZONAS_DELIVERY_LOCAL[selectedDeliveryZone];
            if (summaryZone) {
                summaryZone.textContent = zInfo.nombre;
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

    const mobileBar = document.getElementById('mobile-checkout-bar');
    if (mobileBar && typeof actualizarEstadoBarraMovilCarrito === 'function') {
        const val = typeof validarFormularioEntrega === 'function' ? validarFormularioEntrega(false).valido : false;
        actualizarEstadoBarraMovilCarrito(mobileBar, val, totalFinal);
    }
    
    if (totalMontoInfo) {
        if (subtotalProductos === 0) {
            totalMontoInfo.textContent = '';
            totalMontoInfo.style.display = 'none';
        } else if (!selectedDeliveryType) {
            totalMontoInfo.textContent = 'Selecciona el tipo de entrega para confirmar el total.';
            totalMontoInfo.style.display = 'block';
        } else if (selectedDeliveryType === 'delivery-local' && !selectedDeliveryZone) {
            totalMontoInfo.textContent = 'Selecciona la zona de delivery correspondiente a tu dirección.';
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
        'delivery-name', 'delivery-address', 'delivery-reference',
        'recojo-name'
    ];
    allInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('aria-invalid', 'false');
    });
    
    if (selectedDeliveryType === 'delivery-local') {
        const nameInput = document.getElementById('delivery-name');
        const addressInput = document.getElementById('delivery-address');
        const referenceInput = document.getElementById('delivery-reference');
        
        const name = nameInput ? nameInput.value.trim() : '';
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
        
        // Zone validation
        const validZones = Object.keys(ZONAS_DELIVERY_LOCAL);
        const isZoneValid = validZones.includes(selectedDeliveryZone);
        if (!isZoneValid) {
            result.valido = false;
            result.errores['zone-selector'] = 'Selecciona la zona de delivery correspondiente a tu dirección.';
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
            result.errores['delivery-address'] = 'Ingresa la dirección donde se realizará la entrega.';
            if (addressInput) addressInput.setAttribute('aria-invalid', 'true');
        }
        
        // Reference is optional
        const referenceError = document.getElementById('delivery-reference-error');
        if (referenceError) {
            referenceError.style.display = 'none';
        }
        
    } else if (selectedDeliveryType === 'recojo-local') {
        const nameInput = document.getElementById('recojo-name');
        const name = nameInput ? nameInput.value.trim() : '';
        
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
    } else if (selectedDeliveryType === 'agencia') {
        // Agencia is always valid as no fields are required
    }
    
    return result;
}

function validarDatosEntrega() {
    const btnCheckout = document.getElementById('btn-confirmar-whatsapp');
    if (!btnCheckout) return;
    
    const validation = validarFormularioEntrega(false);
    btnCheckout.disabled = false;

    const mobileBar = document.getElementById('mobile-checkout-bar');
    if (mobileBar && typeof actualizarEstadoBarraMovilCarrito === 'function') {
        const totales = typeof obtenerTotalesPedido === 'function' ? obtenerTotalesPedido() : { totalFinal: 0 };
        actualizarEstadoBarraMovilCarrito(mobileBar, validation.valido, totales.totalFinal);
    }
}

function obtenerDatosEntrega() {
    if (selectedDeliveryType === 'delivery-local') {
        const nameInput = document.getElementById('delivery-name');
        const addressInput = document.getElementById('delivery-address');
        const referenceInput = document.getElementById('delivery-reference');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const reference = referenceInput ? referenceInput.value.trim() : '';
        
        let nombreZona = '';
        let referenciaZona = '';
        if (selectedDeliveryZone && ZONAS_DELIVERY_LOCAL[selectedDeliveryZone]) {
            nombreZona = ZONAS_DELIVERY_LOCAL[selectedDeliveryZone].nombre;
            referenciaZona = ZONAS_DELIVERY_LOCAL[selectedDeliveryZone].referencia;
        }
        
        return {
            tipoEntrega: 'delivery-local',
            nombre: name,
            zona: selectedDeliveryZone,
            nombreZona: nombreZona,
            referenciaZona: referenciaZona,
            direccion: address,
            referencia: reference
        };
    } else if (selectedDeliveryType === 'agencia') {
        return {
            tipoEntrega: 'agencia'
        };
    } else if (selectedDeliveryType === 'recojo-local') {
        const nameInput = document.getElementById('recojo-name');
        const name = nameInput ? nameInput.value.trim() : '';
        
        return {
            tipoEntrega: 'recojo-local',
            nombre: name
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

/**
 * Reinicia completamente el estado del checkout (modalidad y zona en null) al entrar o recargar el carrito
 */
function reiniciarEstadoCheckout() {
    selectedDeliveryType = null;
    selectedDeliveryZone = null;

    try {
        localStorage.removeItem('dunes_delivery_pref');
    } catch (e) {}

    const form = document.getElementById('checkout-form');
    if (form) {
        form.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
            radio.checked = false;
        });
        form.querySelectorAll('.zone-option-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.setAttribute('aria-checked', 'false');
        });
    }

    const warningBox = document.getElementById('checkout-warning');
    if (warningBox) {
        warningBox.textContent = 'Selecciona cómo deseas recibir tu pedido.';
        warningBox.style.display = 'block';
    }

    actualizarInterfazEntrega();
    validarDatosEntrega();
}

function resetearZonaAlCambiarModalidad() {
    selectedDeliveryZone = null;
    const form = document.getElementById('checkout-form');
    if (form) {
        form.querySelectorAll('.zone-option-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.setAttribute('aria-checked', 'false');
        });
    }
}

function guardarPreferenciaEntrega() {
    try {
        localStorage.removeItem('dunes_delivery_pref');
    } catch (e) {}
}

function cargarPreferenciaEntrega() {
    reiniciarEstadoCheckout();
}

function inicializarCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    // Reiniciar modalidades al cargar
    reiniciarEstadoCheckout();

    // Reiniciar también ante bfcache (botón Atrás / Adelante)
    window.addEventListener('pageshow', (e) => {
        reiniciarEstadoCheckout();
    });

    // Listeners for delivery option cards and radio buttons (modality)
    form.querySelectorAll('.delivery-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const radio = card.querySelector('input[name="tipoEntrega"]');
            if (radio && !radio.checked) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    form.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedDeliveryType = e.target.value;

            // Tracking begin_checkout (una vez por sesión de checkout)
            if (typeof window !== 'undefined' && window.Analytics) {
                const itemsCart = window.carritoModulo.obtenerCarrito();
                const { subtotalProductos } = obtenerTotalesPedido();
                if (!window._beginCheckoutSent) {
                    window._beginCheckoutSent = true;
                    window.Analytics.trackBeginCheckout(itemsCart, subtotalProductos);
                }
                if (selectedDeliveryType === 'agencia' || selectedDeliveryType === 'recojo-local') {
                    window.Analytics.trackShippingInfo(selectedDeliveryType, itemsCart, subtotalProductos);
                }
            }

            // Al cambiar de modalidad, si no es delivery-local, limpiar zona
            if (selectedDeliveryType !== 'delivery-local') {
                resetearZonaAlCambiarModalidad();
            }

            // Limpiar avisos visuales de error al seleccionar modalidad
            document.querySelectorAll('.step-alert-banner').forEach(el => el.remove());
            document.querySelectorAll('.is-step-required').forEach(el => el.classList.remove('is-step-required'));

            actualizarInterfazEntrega();
        });
    });

    // Listeners for zone buttons (only relevant for delivery-local)
    form.querySelectorAll('.zone-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget || e.target.closest('.zone-option-btn');
            if (!targetBtn) return;

            form.querySelectorAll('.zone-option-btn').forEach(b => {
                b.classList.remove('selected');
                b.setAttribute('aria-checked', 'false');
            });
            targetBtn.classList.add('selected');
            targetBtn.setAttribute('aria-checked', 'true');
            selectedDeliveryZone = targetBtn.dataset.zona || targetBtn.getAttribute('data-zona');

            if (typeof window !== 'undefined' && window.Analytics) {
                const itemsCart = window.carritoModulo.obtenerCarrito();
                const { subtotalProductos } = obtenerTotalesPedido();
                window.Analytics.trackShippingInfo('delivery_local', itemsCart, subtotalProductos);
            }

            // Limpiar avisos visuales de error al seleccionar zona
            document.querySelectorAll('.step-alert-banner').forEach(el => el.remove());
            document.querySelectorAll('.is-step-required').forEach(el => el.classList.remove('is-step-required'));

            actualizarInterfazEntrega();
        });
    });
    
    // Listeners for text inputs
    const inputs = [
        'delivery-name', 'delivery-address', 'delivery-reference',
        'recojo-name'
    ];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
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
        const paso = obtenerPrimerPasoIncompleto();
        if (paso) {
            scrollToFirstInvalidStep();
            return;
        }
        confirmarPedidoWhatsApp(e);
    });
    
    // Direct click handler on the button
    const btnConfirmar = document.getElementById('btn-confirmar-whatsapp');
    if (btnConfirmar) {
        const oldHandler = btnConfirmar._m13CheckoutBtnHandler;
        if (oldHandler) btnConfirmar.removeEventListener('click', oldHandler);

        btnConfirmar._m13CheckoutBtnHandler = handleConfirmarPedido;
        btnConfirmar.addEventListener('click', handleConfirmarPedido);
    }
}

function confirmarPedidoWhatsApp(e) {
    if (e) e.preventDefault();

    const rawItems = window.carritoModulo.obtenerCarrito();
    if (!rawItems || rawItems.length === 0) {
        window.carritoModulo.mostrarToastPremium('El carrito está vacío.', true);
        return;
    }

    const pasoIncompleto = obtenerPrimerPasoIncompleto();
    if (pasoIncompleto) {
        scrollToFirstInvalidStep();
        return;
    }

    // Revalidación final del cupón y totales antes de generar el mensaje
    if (window.cuponesCheckout && typeof window.cuponesCheckout.recalcularCupon === 'function') {
        window.cuponesCheckout.recalcularCupon();
    }

    const totales = obtenerTotalesPedido();
    const { subtotalBruto, subtotalNeto, descuento, costoEntrega, totalFinal, cuponAplicado, resultadoCupon } = totales;

    // Control de consistencia del total visual vs calculado
    const totalDOMText = document.getElementById('cart-total-price') ? document.getElementById('cart-total-price').textContent : '';
    let totalDOMNum = null;
    if (totalDOMText) {
        const match = totalDOMText.match(/[\d.]+/);
        if (match) totalDOMNum = parseFloat(match[0]);
    }

    if (totalDOMNum !== null && Math.abs(totalDOMNum - totalFinal) > 0.01) {
        actualizarResumenEntrega();
        if (window.cuponesUI && typeof window.cuponesUI.sincronizarInterfazCupon === 'function') {
            window.cuponesUI.sincronizarInterfazCupon();
        }
        window.carritoModulo.mostrarToastPremium('No pudimos actualizar el total del pedido. Inténtalo nuevamente.', true);
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
        subtotal: (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0)
    }));

    const datosEntrega = obtenerDatosEntrega();

    const pedido = {
        productos: items,
        subtotalBruto,
        subtotalProductos: subtotalBruto,
        descuento,
        subtotalNeto,
        costoEntrega,
        totalFinal,
        cuponAplicado,
        resultadoCupon,
        datosEntrega
    };

    if (typeof window !== 'undefined' && window.Analytics) {
        window.Analytics.trackLead({
            totalFinal: totalFinal,
            tipoEntrega: selectedDeliveryType,
            items: items
        });
    }

    window.whatsappConfig.enviarPedidoWhatsApp(pedido);
}

window.renderizarCarritoDOM = renderizarCarritoDOM;
window.CONFIG_DELIVERY_LOCAL = CONFIG_DELIVERY_LOCAL;
window.obtenerTipoEntregaSeleccionado = obtenerTipoEntregaSeleccionado;
window.obtenerZonaSeleccionada = obtenerZonaSeleccionada;
window.seleccionarTipoEntrega = seleccionarTipoEntrega;
window.seleccionarZonaEntrega = seleccionarZonaEntrega;
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



/**
 * Inicializa el acordeón interactivo en el footer para pantallas móviles
 */
function inicializarAcordeonFooter() {
    const buttons = document.querySelectorAll('.footer-accordion-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.innerWidth >= 769) return;

            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            const contentId = btn.getAttribute('aria-controls');
            const contentEl = contentId ? document.getElementById(contentId) : null;

            if (contentEl) {
                if (isExpanded) {
                    btn.setAttribute('aria-expanded', 'false');
                    contentEl.classList.remove('active');
                } else {
                    btn.setAttribute('aria-expanded', 'true');
                    contentEl.classList.add('active');
                }
            }
        });
    });
}

/**
 * Crea el elemento HTML de la barra móvil de checkout si no existe
 */
function crearBarraMovilCarrito() {
    let bar = document.getElementById('mobile-checkout-bar');
    if (bar) {
        bar.hidden = true;
        return bar;
    }

    bar = document.createElement('div');
    bar.id = 'mobile-checkout-bar';
    bar.className = 'mobile-checkout-bar';
    bar.hidden = true;
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `
        <div class="mobile-checkout-bar__total">
            <span class="mobile-checkout-bar__label">TOTAL</span>
            <span class="mobile-checkout-bar__amount" id="mobile-checkout-bar-amount">S/ 0.00</span>
        </div>
        <button type="button" class="btn mobile-checkout-bar__button" id="mobile-checkout-bar-btn">
            CONTINUAR PEDIDO
        </button>
    `;

    if (document.body) {
        document.body.appendChild(bar);
    }
    return bar;
}

/**
 * Actualiza el estado visual (Completo / Incompleto) y el total en la barra móvil del carrito
 */
function actualizarEstadoBarraMovilCarrito(bar, esCompleto, totalMonto) {
    if (!bar) return;
    const amountEl = bar.querySelector('#mobile-checkout-bar-amount');
    const btnEl = bar.querySelector('#mobile-checkout-bar-btn');

    if (amountEl) {
        amountEl.textContent = typeof totalMonto === 'number'
            ? `S/ ${totalMonto.toFixed(2)}`
            : (totalMonto || 'S/ 0.00');
    }

    if (btnEl) {
        if (esCompleto) {
            btnEl.classList.remove('is-incomplete');
            btnEl.classList.add('is-complete');
            btnEl.textContent = 'CONFIRMAR POR WHATSAPP';
            btnEl.setAttribute('aria-label', 'Confirmar pedido por WhatsApp');
        } else {
            btnEl.classList.remove('is-complete');
            btnEl.classList.add('is-incomplete');
            btnEl.textContent = 'CONTINUAR PEDIDO';
            btnEl.setAttribute('aria-label', 'Continuar pedido e ir al dato faltante');
        }
    }
}

/**
 * Retorna el primer paso o dato faltante en el proceso de checkout (FASE M13.2)
 * @returns { { tipo: string, elementoId: string, mensaje: string } | null }
 */
function obtenerPrimerPasoIncompleto() {
    const items = window.carritoModulo ? window.carritoModulo.obtenerCarrito() : [];
    if (!items || items.length === 0) {
        return {
            tipo: 'carrito_vacio',
            elementoId: 'cart-table-container',
            mensaje: 'Tu pedido está vacío.'
        };
    }

    if (!selectedDeliveryType) {
        return {
            tipo: 'modalidad',
            elementoId: 'container-seccion-entrega',
            mensaje: 'Selecciona primero cómo deseas recibir tu pedido.'
        };
    }

    if (selectedDeliveryType === 'delivery-local') {
        if (!selectedDeliveryZone) {
            return {
                tipo: 'zona',
                elementoId: 'block-delivery-local',
                mensaje: 'Selecciona la zona de delivery para continuar.'
            };
        }

        const nameInput = document.getElementById('delivery-name');
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$/;
        const isNameValid = nameVal.length >= 2 && nameVal.length <= 80 && nameRegex.test(nameVal);
        if (!isNameValid) {
            return {
                tipo: 'nombre',
                elementoId: 'delivery-name',
                mensaje: 'Ingresa tu nombre completo para continuar.'
            };
        }

        const addressInput = document.getElementById('delivery-address');
        const addressVal = addressInput ? addressInput.value.trim() : '';
        const isAddressValid = addressVal.length >= 3;
        if (!isAddressValid) {
            return {
                tipo: 'direccion',
                elementoId: 'delivery-address',
                mensaje: 'Ingresa la dirección de entrega para continuar.'
            };
        }
    } else if (selectedDeliveryType === 'recojo-local') {
        const nameInput = document.getElementById('recojo-name');
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$/;
        const isNameValid = nameVal.length >= 2 && nameVal.length <= 80 && nameRegex.test(nameVal);
        if (!isNameValid) {
            return {
                tipo: 'nombre_recojo',
                elementoId: 'recojo-name',
                mensaje: 'Ingresa tu nombre completo para continuar.'
            };
        }
    }

    return null;
}

/**
 * Controlador unificado para la confirmación de pedido (Botón Verde y Barra Móvil)
 */
function handleConfirmarPedido(e) {
    if (e) e.preventDefault();

    const pasoIncompleto = obtenerPrimerPasoIncompleto();
    if (pasoIncompleto) {
        irAlPrimerPasoIncompleto(pasoIncompleto);
        return false;
    }

    confirmarPedidoWhatsApp(e);
}

/**
 * Revela bloques ocultos, desplaza automáticamente al primer paso incompleto,
 * aplica focus al campo y resalta el contenedor con role="alert" y aria-live="polite".
 */
function irAlPrimerPasoIncompleto(pasoIncompleto) {
    pasoIncompleto = pasoIncompleto || obtenerPrimerPasoIncompleto();
    if (!pasoIncompleto) return false;

    // Limpiar alertas e is-step-required previas para evitar duplicados
    document.querySelectorAll('.step-alert-banner').forEach(el => el.remove());
    document.querySelectorAll('.is-step-required').forEach(el => el.classList.remove('is-step-required'));

    if (selectedDeliveryType === 'delivery-local') {
        const block = document.getElementById('block-delivery-local');
        if (block) {
            block.style.display = 'block';
            if (block.removeAttribute) block.removeAttribute('hidden');
            if (block.setAttribute) block.setAttribute('aria-hidden', 'false');
        }
        if (selectedDeliveryZone) {
            const wrapper = document.getElementById('delivery-fields-wrapper');
            if (wrapper) {
                wrapper.style.display = 'block';
                if (wrapper.removeAttribute) wrapper.removeAttribute('hidden');
                if (wrapper.setAttribute) wrapper.setAttribute('aria-hidden', 'false');
            }
        }
    } else if (selectedDeliveryType === 'agencia') {
        const block = document.getElementById('block-agencia');
        if (block) {
            block.style.display = 'block';
            if (block.removeAttribute) block.removeAttribute('hidden');
            if (block.setAttribute) block.setAttribute('aria-hidden', 'false');
        }
    } else if (selectedDeliveryType === 'recojo-local') {
        const block = document.getElementById('block-recojo-local');
        if (block) {
            block.style.display = 'block';
            if (block.removeAttribute) block.removeAttribute('hidden');
            if (block.setAttribute) block.setAttribute('aria-hidden', 'false');
        }
    }

    validarFormularioEntrega(true);

    const warningBox = document.getElementById('checkout-warning');
    if (warningBox) {
        warningBox.style.display = 'none';
    }

    // Limpiar alertas preexistentes para garantizar UNA SOLA alerta activa en el checkout
    document.querySelectorAll('.step-alert-banner').forEach(el => el.remove());
    document.querySelectorAll('.is-step-required').forEach(el => el.classList.remove('is-step-required'));

    const renderBannerYScroll = () => {
        const targetEl = document.getElementById(pasoIncompleto.elementoId)
            || document.querySelector(`.${pasoIncompleto.elementoId}`)
            || document.querySelector('.zone-selector-group')
            || document.querySelector('.delivery-options-grid');

        if (!targetEl) return;

        let highlightTarget = targetEl;
        if (targetEl.closest) {
            if (pasoIncompleto.tipo === 'modalidad') {
                highlightTarget = targetEl.closest('#container-seccion-entrega') || targetEl.closest('.checkout-delivery-step') || targetEl;
            } else if (pasoIncompleto.tipo === 'zona') {
                highlightTarget = targetEl.closest('#block-delivery-local') || targetEl.closest('.zone-selector-group') || targetEl;
            } else {
                highlightTarget = targetEl.closest('.form-group') || targetEl;
            }
        }

        if (highlightTarget && highlightTarget.classList) {
            highlightTarget.classList.add('is-step-required');

            let banner = highlightTarget.querySelector('.checkout-validation-alert') || highlightTarget.querySelector('.step-alert-banner');
            if (!banner && typeof document.createElement === 'function') {
                banner = document.createElement('div');
                banner.className = 'checkout-validation-alert step-alert-banner';
                if (banner.setAttribute) {
                    banner.setAttribute('role', 'alert');
                    banner.setAttribute('aria-live', 'polite');
                }
                banner.innerHTML = `
                    <span class="checkout-validation-alert__icon step-alert-banner__icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </span>
                    <span class="checkout-validation-alert__text step-alert-banner__text">${pasoIncompleto.mensaje}</span>
                `;
                if (highlightTarget.firstChild) {
                    highlightTarget.insertBefore(banner, highlightTarget.firstChild);
                } else if (highlightTarget.appendChild) {
                    highlightTarget.appendChild(banner);
                }
            }
        }

        const header = document.querySelector('header.header-main');
        const headerHeight = header ? header.offsetHeight + 20 : 100;

        let absoluteTop = 0;
        const scrollToNode = highlightTarget || targetEl;
        if (scrollToNode.getBoundingClientRect) {
            const rect = scrollToNode.getBoundingClientRect();
            const pageY = window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0);
            absoluteTop = pageY + rect.top - headerHeight;
        }

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (typeof window.scrollTo === 'function') {
            window.scrollTo({
                top: Math.max(0, absoluteTop),
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        } else if (typeof scrollToNode.scrollIntoView === 'function') {
            scrollToNode.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        }

        if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT' || targetEl.tagName === 'TEXTAREA') {
            setTimeout(() => {
                if (typeof targetEl.focus === 'function') targetEl.focus();
            }, 300);
        }
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(renderBannerYScroll);
    } else {
        renderBannerYScroll();
    }

    return true;
}

function irAlPasoIncompleto(paso) {
    irAlPrimerPasoIncompleto(paso);
}

function scrollToFirstInvalidStep() {
    const pasoIncompleto = obtenerPrimerPasoIncompleto();
    if (pasoIncompleto) {
        irAlPasoIncompleto(pasoIncompleto);
    }
}

/**
 * Enfoca y desplaza al primer campo faltante en el formulario del carrito (Alias)
 */
function enfocarPrimerCampoFaltante() {
    scrollToFirstInvalidStep();
}

/**
 * Inicializa la barra móvil del carrito con IntersectionObserver sobre el botón original de confirmación
 */
const checkoutMobileQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;

/**
 * Controla centralizadamente la visibilidad y estado de la barra fija del checkout móvil (FASE M13)
 */
function actualizarBarraCheckoutMovil(isOutParam) {
    const bar = document.getElementById('mobile-checkout-bar');
    if (!bar) return;

    const esMovil = checkoutMobileQuery
        ? checkoutMobileQuery.matches
        : ((window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0)) <= 767);

    if (!esMovil) {
        bar.hidden = true;
        bar.classList.remove('is-visible');
        if (bar.style && typeof bar.style.removeProperty === 'function') {
            bar.style.removeProperty('display');
        } else if (bar.style) {
            bar.style.display = '';
        }
        bar.setAttribute('aria-hidden', 'true');
        if (document.body) document.body.classList.remove('has-mobile-checkout-bar-visible');
        if (window._m13Observer) {
            window._m13Observer.disconnect();
            window._m13Observer = null;
        }
        return;
    }

    const items = window.carritoModulo ? window.carritoModulo.obtenerCarrito() : [];
    const tieneItems = items && items.length > 0;
    const targetBtn = document.getElementById('btn-confirmar-whatsapp');

    let isOut = isOutParam;
    if (typeof isOut !== 'boolean' && targetBtn && targetBtn.getBoundingClientRect) {
        const rect = targetBtn.getBoundingClientRect();
        isOut = rect.bottom < 0 || rect.top > (window.innerHeight || 800);
    }

    if (isOut && tieneItems) {
        const totales = typeof obtenerTotalesPedido === 'function' ? obtenerTotalesPedido() : { totalFinal: 0 };
        const validation = typeof validarFormularioEntrega === 'function' ? validarFormularioEntrega(false) : { valido: false };
        if (typeof actualizarEstadoBarraMovilCarrito === 'function') {
            actualizarEstadoBarraMovilCarrito(bar, validation.valido, totales.totalFinal);
        }
        bar.hidden = false;
        bar.classList.add('is-visible');
        bar.setAttribute('aria-hidden', 'false');
        if (document.body) document.body.classList.add('has-mobile-checkout-bar-visible');
    } else {
        bar.hidden = true;
        bar.classList.remove('is-visible');
        if (bar.style && typeof bar.style.removeProperty === 'function') {
            bar.style.removeProperty('display');
        } else if (bar.style) {
            bar.style.display = '';
        }
        bar.setAttribute('aria-hidden', 'true');
        if (document.body) document.body.classList.remove('has-mobile-checkout-bar-visible');
    }
}

if (checkoutMobileQuery && typeof checkoutMobileQuery.addEventListener === 'function') {
    checkoutMobileQuery.addEventListener('change', () => {
        actualizarBarraCheckoutMovil();
        if (checkoutMobileQuery.matches) {
            const btn = document.getElementById('btn-confirmar-whatsapp');
            if (btn) inicializarBarraMovilCarrito(btn);
        }
    });
}

/**
 * Inicializa los eventos e IntersectionObserver para la barra móvil del carrito
 */
function inicializarBarraMovilCarrito(targetBtn) {
    if (!targetBtn) return;

    const bar = crearBarraMovilCarrito();
    const actionBtn = bar.querySelector('#mobile-checkout-bar-btn');

    if (actionBtn) {
        const oldHandler = actionBtn._m13Handler;
        if (oldHandler) actionBtn.removeEventListener('click', oldHandler);

        const newHandler = (e) => {
            handleConfirmarPedido(e);
        };
        actionBtn._m13Handler = newHandler;
        actionBtn.addEventListener('click', newHandler);
    }

    const esMovil = checkoutMobileQuery
        ? checkoutMobileQuery.matches
        : ((window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0)) <= 767);

    if (!esMovil) {
        actualizarBarraCheckoutMovil();
        return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
        if (window._m13Observer) window._m13Observer.disconnect();
        window._m13Observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                actualizarBarraCheckoutMovil(!entry.isIntersecting);
            });
        }, { threshold: 0.1 });
        window._m13Observer.observe(targetBtn);
    } else {
        const handleScroll = () => {
            if (!targetBtn.getBoundingClientRect) return;
            const rect = targetBtn.getBoundingClientRect();
            const isOut = rect.bottom < 0 || rect.top > (window.innerHeight || 800);
            actualizarBarraCheckoutMovil(isOut);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
    }
}

/* ==========================================================================
   FASE M14 — SISTEMA DE FAVORITOS (Global Listener & Toast)
   ========================================================================== */
function mostrarToastFavorito(mensaje) {
    if (typeof document === 'undefined') return;
    let toast = document.getElementById('favorite-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'favorite-toast';
        toast.className = 'favorite-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.innerHTML = `
        <span class="favorite-toast__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            </svg>
        </span>
        <span class="favorite-toast__text">${mensaje}</span>
    `;
    toast.classList.add('is-visible');

    if (window._favToastTimeout) clearTimeout(window._favToastTimeout);
    window._favToastTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2000);
}

function actualizarContadoresFavoritos() {
    if (typeof document === 'undefined') return;
    const count = window.FavoritosService ? window.FavoritosService.obtenerCantidadFavoritos() : 0;

    const navBadge = document.getElementById('favorites-nav-badge');
    if (navBadge) {
        if (count > 0) {
            navBadge.textContent = count;
            navBadge.style.display = 'inline-flex';
        } else {
            navBadge.style.display = 'none';
        }
    }

    const headerCount = document.getElementById('favorites-header-count');
    if (headerCount) {
        if (count > 0) {
            const anterior = parseInt(headerCount.textContent) || 0;
            headerCount.textContent = count;
            headerCount.style.display = 'inline-flex';
            if (count > anterior) {
                headerCount.classList.remove('badge-pop');
                void headerCount.offsetWidth;
                headerCount.classList.add('badge-pop');
            }
        } else {
            headerCount.style.display = 'none';
        }
    }

    const headerBtns = document.querySelectorAll('.favorites-header-icon-btn');
    headerBtns.forEach(btn => {
        btn.classList.toggle('is-active', count > 0);
        btn.setAttribute('aria-pressed', count > 0 ? 'true' : 'false');
    });
}

if (typeof window !== 'undefined') {
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('dunes:favoritos:updated', function() {
            actualizarContadoresFavoritos();
        });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', function() {
            actualizarContadoresFavoritos();
        });

        document.addEventListener('click', function(e) {
        // Clic en botón de tarjeta de producto
        const favBtn = e.target.closest('.favorite-toggle-btn');
        if (favBtn) {
            e.preventDefault();
            e.stopPropagation();

            const productId = favBtn.getAttribute('data-id');
            if (!productId || !window.FavoritosService) return;

            const ahoraEsFav = window.FavoritosService.alternarFavorito(productId);

            document.querySelectorAll(`.favorite-toggle-btn[data-id="${productId}"]`).forEach(el => {
                el.classList.toggle('is-active', ahoraEsFav);
                el.setAttribute('aria-pressed', ahoraEsFav ? 'true' : 'false');
                const nombre = el.getAttribute('data-nombre') || 'Producto';
                el.setAttribute('aria-label', ahoraEsFav ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`);

                const svg = el.querySelector('svg');
                if (svg) {
                    svg.setAttribute('fill', ahoraEsFav ? 'currentColor' : 'none');
                }
            });

            // Si estamos en la página de detalle, actualizar también el botón principal de detalle
            const detailBtn = document.getElementById('btn-detail-favorite');
            if (detailBtn && detailBtn.getAttribute('data-id') === String(productId).trim()) {
                detailBtn.classList.toggle('is-active', ahoraEsFav);
                detailBtn.setAttribute('aria-pressed', ahoraEsFav ? 'true' : 'false');
                const textEl = detailBtn.querySelector('.btn-detail-favorite-text');
                if (textEl) {
                    textEl.textContent = ahoraEsFav ? 'Guardado en favoritos' : 'Guardar en favoritos';
                }
                const svg = detailBtn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('fill', ahoraEsFav ? 'currentColor' : 'none');
                }
            }

            mostrarToastFavorito(ahoraEsFav ? 'Agregado a favoritos' : 'Eliminado de favoritos');
            return;
        }

        // Clic en botón de ficha de producto.html
        const detailFavBtn = e.target.closest('#btn-detail-favorite');
        if (detailFavBtn) {
            e.preventDefault();

            const productId = detailFavBtn.getAttribute('data-id');
            if (!productId || !window.FavoritosService) return;

            const ahoraEsFav = window.FavoritosService.alternarFavorito(productId);

            detailFavBtn.classList.toggle('is-active', ahoraEsFav);
            detailFavBtn.setAttribute('aria-pressed', ahoraEsFav ? 'true' : 'false');
            const textEl = detailFavBtn.querySelector('.btn-detail-favorite-text');
            if (textEl) {
                textEl.textContent = ahoraEsFav ? 'Guardado en favoritos' : 'Guardar en favoritos';
            }
            const svg = detailFavBtn.querySelector('svg');
            if (svg) {
                svg.setAttribute('fill', ahoraEsFav ? 'currentColor' : 'none');
            }

            // Sincronizar botones de tarjeta si existieran
            document.querySelectorAll(`.favorite-toggle-btn[data-id="${productId}"]`).forEach(el => {
                el.classList.toggle('is-active', ahoraEsFav);
                el.setAttribute('aria-pressed', ahoraEsFav ? 'true' : 'false');
                const svgCard = el.querySelector('svg');
                if (svgCard) {
                    svgCard.setAttribute('fill', ahoraEsFav ? 'currentColor' : 'none');
                }
            });

            mostrarToastFavorito(ahoraEsFav ? 'Agregado a favoritos' : 'Eliminado de favoritos');
        }
    }, true);
  }
}

/* ==========================================================================
   FASE M21 — Motor de Productos Relacionados Automáticos ("También te puede interesar")
   ========================================================================== */

/**
 * Normaliza una cadena removiendo espacios externos, tildes/diacríticos y convirtiendo a minúsculas
 * @param {string} val
 * @returns {string}
 */
function normalizarTexto(val) {
    if (!val || typeof val !== 'string') return '';
    return val
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcula la puntuación de afinidad entre un producto actual y un candidato
 * Misma Categoría: +100 puntos | Misma Marca: +25 puntos
 * @param {Object} productoActual
 * @param {Object} candidato
 * @returns {number}
 */
function calcularPuntuacionRelacion(productoActual, candidato) {
    if (!productoActual || !candidato) return 0;
    let score = 0;

    const catActual = normalizarTexto(productoActual.categoria);
    const catCand = normalizarTexto(candidato.categoria);

    const marcaActual = normalizarTexto(productoActual.marca);
    const marcaCand = normalizarTexto(candidato.marca);

    if (catActual && catCand && catActual === catCand) {
        score += 100;
    }

    if (marcaActual && marcaCand && marcaActual === marcaCand) {
        score += 25;
    }

    return score;
}

/**
 * Barajado Fisher-Yates sin mutar el arreglo original
 * @param {Array} arr
 * @returns {Array}
 */
function meclarArrayFisherYates(arr) {
    if (!Array.isArray(arr)) return [];
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

/**
 * Calcula el arreglo de hasta 4 productos relacionados utilizando el algoritmo de puntuación + variabilidad Fisher-Yates
 * @param {Object} productoActual
 * @param {Array} todosLosProductos
 * @param {number} limite
 * @returns {Array}
 */
function obtenerProductosRelacionados(productoActual, todosLosProductos, limite = 4) {
    if (!productoActual || !productoActual.id || !Array.isArray(todosLosProductos) || todosLosProductos.length === 0) {
        return [];
    }

    const idActualClean = String(productoActual.id).trim();

    // 1. Filtrar candidatos válidos y disponibles (excluyendo el producto actual y productos no disponibles/ocultos)
    const candidatosValidos = todosLosProductos.filter(cand => {
        if (!cand || !cand.id) return false;

        const idCandClean = String(cand.id).trim();
        if (idCandClean === idActualClean) return false;

        // Validar visibilidad
        const visibleStr = String(cand.visible ?? true).toLowerCase();
        if (cand.visible === false || cand.visible === 0 || visibleStr === 'false' || visibleStr === '0' || visibleStr === 'no') {
            return false;
        }

        // Validar disponibilidad y stock
        const esDecant = (cand.formato && String(cand.formato).toLowerCase().includes('decant')) || cand.categoria === 'decants';
        if (esDecant) {
            const mlDisp = cand.mililitrosDisponibles ?? cand.mililitros_disponibles ?? 0;
            if (cand.disponible === false || mlDisp <= 0) {
                return false;
            }
        } else {
            if (cand.disponible === false || (typeof cand.stock === 'number' && cand.stock <= 0)) {
                return false;
            }
        }

        return true;
    });

    if (candidatosValidos.length === 0) return [];

    // 2. Agrupar por puntuación de afinidad
    const gruposPorScore = new Map();
    candidatosValidos.forEach(cand => {
        const score = calcularPuntuacionRelacion(productoActual, cand);
        if (!gruposPorScore.has(score)) {
            gruposPorScore.set(score, []);
        }
        gruposPorScore.get(score).push(cand);
    });

    // 3. Ordenar puntajes en orden descendente y mezclar aleatoriamente dentro de cada grupo con empates
    const scoresOrdenados = Array.from(gruposPorScore.keys()).sort((a, b) => b - a);

    const recomendados = [];
    const idsAgregados = new Set();

    for (const score of scoresOrdenados) {
        const grupo = gruposPorScore.get(score);
        const grupoMezclado = meclarArrayFisherYates(grupo);

        for (const cand of grupoMezclado) {
            const idClean = String(cand.id).trim();
            if (!idsAgregados.has(idClean)) {
                idsAgregados.add(idClean);
                recomendados.push(cand);
                if (recomendados.length >= limite) {
                    break;
                }
            }
        }
        if (recomendados.length >= limite) {
            break;
        }
    }

    return recomendados;
}

/**
 * Renderiza la sección de productos relacionados automáticos en producto.html
 * @param {Object} productoActual
 * @param {Array} productosRelacionados
 */
function renderProductosRelacionados(productoActual, productosRelacionados) {
    const section = document.getElementById('related-products-section');
    const grid = document.getElementById('related-products-grid');
    if (!section || !grid) return;

    if (!productosRelacionados || productosRelacionados.length === 0) {
        section.style.display = 'none';
        grid.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    productosRelacionados.forEach((prod) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const esDecant = (prod.formato && String(prod.formato).toLowerCase().includes('decant')) || prod.categoria === 'decants';
        const mlDisp = prod.mililitrosDisponibles ?? prod.mililitros_disponibles ?? 0;
        const estaAgotado = esDecant
            ? (!prod.disponible || mlDisp <= 0)
            : (!prod.disponible || (prod.stock ?? 0) <= 0);

        if (estaAgotado) {
            card.classList.add('out-of-stock', 'is-soldout');
        }

        let tagHtml = '';
        if (!esDecant && prod.oferta && prod.disponible && prod.stock > 0) {
            let promoText = 'OFERTA';
            if (typeof prod.precio === 'number' && prod.precio > 0 && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number')) {
                const precioOfertaVal = prod.precio_oferta ?? prod.precioOferta;
                if (prod.precio > precioOfertaVal) {
                    const pct = Math.round(((prod.precio - precioOfertaVal) / prod.precio) * 100);
                    if (pct > 0) {
                        promoText = `OFERTA • ${pct}% OFF`;
                    }
                }
            }
            tagHtml = `<span class="product-tag promo-tag">${promoText}</span>`;
        }

        let categoryBadgeText = 'CATÁLOGO';
        const catNorm = (prod.categoria || '').toLowerCase().trim();
        if (catNorm === 'arabe') categoryBadgeText = esDecant ? 'DECANT ÁRABE' : 'PERFUME ÁRABE';
        else if (catNorm === 'disenador') categoryBadgeText = esDecant ? 'DECANT DISEÑADOR' : 'DISEÑADOR';
        else if (catNorm === 'nicho') categoryBadgeText = esDecant ? 'DECANT NICHO' : 'NICHO';
        else if (esDecant) categoryBadgeText = 'DECANT';

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

        const tieneOferta = !esDecant && prod.oferta === true && (typeof prod.precio_oferta === 'number' || typeof prod.precioOferta === 'number');
        const precioOfertaVal = tieneOferta ? (prod.precio_oferta ?? prod.precioOferta) : null;
        const precioActual = esDecant
            ? `Desde S/ ${precioMinDecant.toFixed(2)}`
            : 'S/ ' + (tieneOferta ? precioOfertaVal : (prod.precio || 0)).toFixed(2);
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
            <a href="producto.html?id=${encodeURIComponent(prod.id)}" class="product-image-link" tabindex="-1">
                <img src="${typeof resolverImagen === 'function' ? resolverImagen(prod.imagen) : prod.imagen}" alt="${prod.nombre} - ${prod.marca}" class="product-img" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
            </a>
        `;

        const divInfo = document.createElement('div');
        divInfo.className = 'product-info';

        const spanCatMobile = document.createElement('span');
        spanCatMobile.className = 'product-category-mobile';
        spanCatMobile.textContent = categoryBadgeText;

        const divBrand = document.createElement('div');
        divBrand.className = 'product-brand';
        divBrand.textContent = prod.marca;

        const h3Title = document.createElement('h3');
        h3Title.className = 'product-title';
        h3Title.innerHTML = `<a href="producto.html?id=${encodeURIComponent(prod.id)}" class="product-title-link" style="color: inherit; text-decoration: none;">${prod.nombre}</a>`;

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

        divInfo.appendChild(spanCatMobile);
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

    // Vincular listeners para los botones dentro de la cuadrícula de relacionados
    if (typeof vincularEventosProductosGrid === 'function') {
        vincularEventosProductosGrid(grid);
    }
}

// Exportar al objeto global para pruebas y reusabilidad modular
if (typeof window !== 'undefined') {
    window.normalizarTexto = normalizarTexto;
    window.calcularPuntuacionRelacion = calcularPuntuacionRelacion;
    window.obtenerProductosRelacionados = obtenerProductosRelacionados;
    window.renderProductosRelacionados = renderProductosRelacionados;
}





