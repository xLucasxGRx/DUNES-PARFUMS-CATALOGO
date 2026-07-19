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
        if (!prod.disponible || prod.stock <= 0) {
            card.classList.add('out-of-stock');
        }

        // Construir etiquetas
        let tagHtml = '';
        if (prod.oferta && prod.disponible && prod.stock > 0) {
            tagHtml = `<span class="product-tag promo-tag">Oferta</span>`;
        } else if (!prod.disponible || prod.stock <= 0) {
            tagHtml = `<span class="product-tag out-tag">Agotado</span>`;
        }

        // Precios
        const precioActual = formatearMoneda(prod.precio);
        const precioAnteriorHtml = prod.precioAnterior 
            ? `<span class="price-old">${formatearMoneda(prod.precioAnterior)}</span>` 
            : '';

        // Formatear presentación
        const presentacionFormateada = prod.formato === 'Sellado' 
            ? `Sellado / ${prod.presentacion}` 
            : prod.presentacion;

        // Estado disponible y stock
        const stockHtml = prod.disponible && prod.stock > 0 
            ? `<span class="product-stock-status">Disponible (${prod.stock} unid.)</span>`
            : `<span class="product-stock-status out">Agotado</span>`;

        // Botón de acción principal
        let actionBtnHtml = '';
        if (prod.disponible && prod.stock > 0) {
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
            const msg = 'Hola, Dunes Parfums 👋\nMe gustaría recibir asesoría sobre sus perfumes sellados y decants.';
            window.whatsappConfig.enviarMensajeWhatsApp(msg);
        });
    }

    // Botón en la sección de consulta WhatsApp
    const generalWaBtn = document.getElementById('general-whatsapp-btn');
    if (generalWaBtn) {
        generalWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = 'Hola, Dunes Parfums 👋\nMe comunico desde la web para recibir asesoramiento personalizado en alta perfumería.';
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
                <div class="benefit-icon-wrapper" style="width: 80px; height: 80px; font-size: 2.2rem; margin-bottom: 12px;" aria-hidden="true">⚠️</div>
                <h2>Error de Selección</h2>
                <p>No se ha especificado ningún perfume para visualizar.</p>
                <a href="catalogo.html" class="btn btn-primary">Ver Catálogo</a>
            </div>
        `;
        return;
    }

    const prod = await window.productosModulo.obtenerProductoPorId(id);
    if (!prod) {
        container.innerHTML = `
            <div class="placeholder-page-wrapper">
                <div class="benefit-icon-wrapper" style="width: 80px; height: 80px; font-size: 2.2rem; margin-bottom: 12px;" aria-hidden="true">🔍</div>
                <h2>No Encontrado</h2>
                <p>La fragancia solicitada no figura en nuestro stock actual.</p>
                <a href="catalogo.html" class="btn btn-primary">Ver Catálogo</a>
            </div>
        `;
        return;
    }

    const presentacionFormateada = prod.formato === 'Sellado' 
        ? `Sellado / ${prod.presentacion}` 
        : prod.presentacion;

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
                    🛒 Agregar al Carrito
                </button>
                <button class="btn btn-secondary btn-query-detail" id="btn-query-detail" data-nombre="${prod.nombre}">
                    💬 Consultar por WhatsApp
                </button>
            </div>
        `;
    } else {
        pickerAndActionsHtml = `
            <div class="detail-btn-row">
                <button class="btn btn-secondary btn-query-detail" style="width: 100%;" id="btn-query-detail" data-nombre="${prod.nombre}">
                    💬 Consultar reingreso por WhatsApp
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

    // Vincular eventos de detalle
    if (prod.disponible && prod.stock > 0) {
        const minusBtn = document.getElementById('detail-qty-minus');
        const plusBtn = document.getElementById('detail-qty-plus');
        const qtyInput = document.getElementById('detail-qty-input');
        const addCartBtn = document.getElementById('btn-add-cart-detail');

        if (minusBtn && plusBtn && qtyInput) {
            minusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) {
                    qtyInput.value = val - 1;
                }
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
                window.carritoModulo.agregarAlCarrito(prod.id, qty);
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
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;" aria-hidden="true">🛒</span>
                <h3>Tu pedido está vacío</h3>
                <p>Explora nuestro catálogo de perfumes y decants para agregar productos.</p>
                <a href="catalogo.html" class="btn btn-primary" style="margin-top: 20px;">Ir al Catálogo</a>
            </div>
        `;
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
        
        const presentacionFormateada = item.formato === 'Sellado' 
            ? `Sellado / ${item.presentacion}` 
            : item.presentacion;

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
    if (totalPriceSpan) totalPriceSpan.textContent = formatearMoneda(totalGeneral);

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

    // Vaciar carrito
    const emptyBtn = document.getElementById('btn-empty-cart');
    if (emptyBtn) {
        // Clonar botón para limpiar event listeners antiguos y evitar duplicación
        const newEmptyBtn = emptyBtn.cloneNode(true);
        emptyBtn.parentNode.replaceChild(newEmptyBtn, emptyBtn);
        newEmptyBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas vaciar el pedido actual?')) {
                window.carritoModulo.vaciarCarrito();
            }
        });
    }
}

/**
 * Inicializa el formulario de checkout y vincula el envío a WhatsApp
 */
function inicializarCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const items = await window.carritoModulo.obtenerItemsCarritoDetallados();
        if (items.length === 0) {
            window.carritoModulo.mostrarToastPremium('El carrito está vacío.', true);
            return;
        }

        const total = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        
        const clienteInfo = {
            nombre: document.getElementById('client-name').value.trim(),
            distrito: document.getElementById('client-district').value.trim(),
            entrega: document.getElementById('client-delivery').value,
            comentario: document.getElementById('client-comment').value.trim()
        };

        window.whatsappConfig.enviarPedidoWhatsApp(items, total, clienteInfo);
    });
}

// Exponer renderizador para que carrito.js pueda dispararlo
window.renderizarCarritoDOM = renderizarCarritoDOM;
