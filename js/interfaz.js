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

    // 4. Renderizar productos destacados en la página de inicio
    cargarProductosDestacadosHome();

    // 5. Configurar enlaces de WhatsApp y botones flotantes
    inicializarEnlacesWhatsApp();
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
    return '$ ' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

/**
 * Carga y renderiza los productos destacados en el index.html
 */
async function cargarProductosDestacadosHome() {
    const grid = document.getElementById('productos-destacados-grid');
    if (!grid) return; // No estamos en index.html o no existe el contenedor

    grid.innerHTML = '<div class="loading-spinner">Cargando fragancias exclusivas...</div>';

    // Obtener los productos destacados del módulo
    const destacados = await window.productosModulo.obtenerProductosDestacados();

    if (destacados.length === 0) {
        grid.innerHTML = '<p class="no-products-msg">No se encontraron fragancias destacadas en este momento.</p>';
        return;
    }

    grid.innerHTML = ''; // Limpiar spinner

    destacados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card reveal';
        if (!prod.disponible) {
            card.classList.add('out-of-stock');
        }

        // Construir etiquetas
        let tagHtml = '';
        if (prod.oferta && prod.disponible) {
            tagHtml = `<span class="product-tag promo-tag">Oferta</span>`;
        } else if (!prod.disponible) {
            tagHtml = `<span class="product-tag out-tag">Agotado</span>`;
        }

        // Precios
        const precioActual = formatearMoneda(prod.precio);
        const precioAnteriorHtml = prod.precioAnterior 
            ? `<span class="price-old">${formatearMoneda(prod.precioAnterior)}</span>` 
            : '';

        // Botón de acción principal
        let actionBtnHtml = '';
        if (prod.disponible) {
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
                <span class="product-volume">${prod.presentacion}</span>
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
}

/**
 * Asigna eventos de clic a los botones de comprar y agregar en la cuadrícula
 * @param {HTMLElement} grid 
 */
function vincularEventosProductosGrid(grid) {
    // Botones de agregar al carrito
    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            const nombre = e.currentTarget.dataset.nombre;
            window.carritoModulo.agregarAlCarrito(id, nombre);
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
            const msg = 'Hola Dunes Parfums! Me gustaría hacer una consulta sobre sus perfumes y decants.';
            window.whatsappConfig.enviarMensajeWhatsApp(msg);
        });
    }

    // Botón en la sección de consulta WhatsApp
    const generalWaBtn = document.getElementById('general-whatsapp-btn');
    if (generalWaBtn) {
        generalWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = 'Hola Dunes Parfums! Me comunico desde la web para recibir asesoramiento personalizado.';
            window.whatsappConfig.enviarMensajeWhatsApp(msg);
        });
    }
}
