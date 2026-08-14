/**
 * Dunes Parfums - módulo del carrito de compras (Fase Variantes)
 * Soporta variantes de decants (3ml, 5ml, 10ml) diferenciándolas en el pedido
 * y controlando el stock basado en los mililitros totales disponibles de la marca.
 */

// Inicializar el carrito en localStorage si no existe
function obtenerCarrito() {
    try {
        const carrito = localStorage.getItem('dunes_cart');
        return carrito ? JSON.parse(carrito) : [];
    } catch (e) {
        console.error('Error al acceder al localStorage:', e);
        return [];
    }
}

function guardarCarrito(carrito) {
    try {
        localStorage.setItem('dunes_cart', JSON.stringify(carrito));
    } catch (e) {
        console.error('Error al guardar en el localStorage:', e);
    }
}

/**
 * Actualiza el contador numérico visible en el icono del carrito de toda la página
 */
function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll('.cart-count');
    const carrito = obtenerCarrito();
    const cantidadTotal = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);

    contadores.forEach(contador => {
        if (contador) {
            const anterior = parseInt(contador.textContent) || 0;
            contador.textContent = cantidadTotal;
            if (cantidadTotal > 0) {
                contador.style.display = 'inline-flex';
                if (cantidadTotal > anterior) {
                    contador.classList.remove('badge-pop');
                    void contador.offsetWidth;
                    contador.classList.add('badge-pop');
                }
            } else {
                contador.style.display = 'none';
            }
        }
    });
}

/**
 * Aplica una micro-animación elegante al botón del carrito en la cabecera cuando un producto se agrega exitosamente
 */
function animarBotonCarritoHeader() {
    const cartBtns = document.querySelectorAll('.cart-icon-btn');
    cartBtns.forEach(btn => {
        if (!btn) return;

        btn.classList.remove('is-cart-animated');
        // Forzar reflow para reiniciar la animación si se agregan múltiples ítems rápidamente
        void btn.offsetWidth;
        btn.classList.add('is-cart-animated');

        const onAnimationEnd = () => {
            btn.classList.remove('is-cart-animated');
            btn.removeEventListener('animationend', onAnimationEnd);
        };
        btn.addEventListener('animationend', onAnimationEnd, { once: true });
    });
}

/**
 * Agrega un producto al carrito controlando estrictamente el stock real (unidades para sellados, ml para decants)
 * @param {string} idProducto - ID base del producto
 * @param {number} cantidadAAgregar - Cantidad a añadir
 * @param {number|null} tamanoMl - Tamaño en ml si es decant (3, 5 o 10)
 */
async function agregarAlCarrito(idProducto, cantidadAAgregar = 1, tamanoMl = null) {
    try {
        const product = await window.productosModulo.obtenerProductoPorId(idProducto);
        if (!product) {
            mostrarToastPremium('Error: Producto no encontrado.', true);
            return;
        }

        if (!product.disponible) {
            mostrarToastPremium(`Agotado: ${product.nombre} no está disponible.`, true);
            return;
        }

        let carrito = obtenerCarrito();
        const esDecant = product.categoria === 'decants';

        // Clave única en carrito
        const key = idProducto + (esDecant ? `-${tamanoMl}` : '');
        const itemExistente = carrito.find(item => item.id === key);
        const qtyInCart = itemExistente ? itemExistente.cantidad : 0;
        const nuevaCantidadPropuesta = qtyInCart + cantidadAAgregar;

        let cantidadFinal = nuevaCantidadPropuesta;
        let limiteAlcanzado = false;
        let stockMaximo = 0;

        if (esDecant) {
            // Validar presentación
            if (!tamanoMl || ![3, 5, 10].includes(tamanoMl)) {
                mostrarToastPremium('Error: Presentación de decant no válida.', true);
                return;
            }

            // Calcular mililitros ocupados por OTRAS presentaciones de este mismo decant
            const mlOtros = carrito
                .filter(item => item.idProducto === idProducto && item.id !== key)
                .reduce((acc, item) => acc + (item.tamanoMl * item.cantidad), 0);

            // Calcular capacidad restante de mililitros para este ítem
            const mlDisponiblesParaItem = product.mililitrosDisponibles - mlOtros;
            stockMaximo = Math.floor(mlDisponiblesParaItem / tamanoMl);

            if (nuevaCantidadPropuesta > stockMaximo) {
                cantidadFinal = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            }
        } else {
            // Perfume Sellado
            stockMaximo = product.stock;
            if (nuevaCantidadPropuesta > stockMaximo) {
                cantidadFinal = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            }
        }

        if (limiteAlcanzado) {
            const mensajeAviso = esDecant
                ? `Límite alcanzado: ml insuficientes para agregar más (${stockMaximo} unid. máx.).`
                : `Límite alcanzado: solo hay ${stockMaximo} unidades de ${product.nombre}.`;
            mostrarToastPremium(mensajeAviso, true);

            if (cantidadFinal <= 0) {
                // Si no se puede agregar nada, salir sin modificar carrito
                return;
            }
        }

        // Obtener precio unitario
        let precioUnitario = product.precio;
        if (!esDecant && product.oferta === true && (typeof product.precio_oferta === 'number' || typeof product.precioOferta === 'number')) {
            precioUnitario = product.precio_oferta ?? product.precioOferta;
        }
        let presentacionTexto = `Sellado / ${product.presentacion}`;
        let mlItem = 100;

        if (esDecant) {
            const presInfo = product.presentaciones.find(p => p.ml === tamanoMl);
            precioUnitario = presInfo ? presInfo.precio : 30.00;
            presentacionTexto = `Decant ${tamanoMl} ml`;
            mlItem = tamanoMl;
        }

        if (itemExistente) {
            itemExistente.cantidad = cantidadFinal;
            itemExistente.subtotal = itemExistente.precioUnitario * cantidadFinal;
        } else {
            carrito.push({
                id: key,
                idProducto: idProducto,
                nombre: product.nombre,
                marca: product.marca,
                imagen: product.imagen,
                tipo: product.tipo,
                categoria: product.categoria,
                presentacion: presentacionTexto,
                tamanoMl: mlItem,
                precioUnitario: precioUnitario,
                cantidad: cantidadFinal,
                subtotal: precioUnitario * cantidadFinal
            });
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        animarBotonCarritoHeader();

        if (!limiteAlcanzado) {
            mostrarToastPremium(`S/ ${precioUnitario.toFixed(2)} - ${product.nombre} (${mlItem}ml) agregado.`);

            const totalItemsEnCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);
            mostrarModalAgregarCarrito({
                idProducto: product.id,
                nombre: product.nombre,
                marca: product.marca,
                imagen: product.imagen,
                presentacion: presentacionTexto,
                precioUnitario: precioUnitario,
                cantidadAgregada: cantidadAAgregar,
                subtotalAccion: precioUnitario * cantidadAAgregar,
                totalProductosCarrito: totalItemsEnCarrito
            });
        }

        if (window.renderizarCarritoDOM) {
            window.renderizarCarritoDOM();
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarToastPremium('Error al procesar el carrito.', true);
    }
}

/**
 * Actualiza la cantidad de un ítem ya existente en el carrito con chequeo estricto
 * @param {string} id - ID único del ítem en carrito (ej: "p1" o "d1-3")
 * @param {number} nuevaCantidad - Cantidad deseada
 */
async function actualizarCantidadItem(id, nuevaCantidad) {
    try {
        let carrito = obtenerCarrito();
        const item = carrito.find(i => i.id === id);
        if (!item) return;

        if (nuevaCantidad <= 0) {
            eliminarItem(id);
            return;
        }

        const product = await window.productosModulo.obtenerProductoPorId(item.idProducto);
        if (!product) return;

        const esDecant = item.categoria === 'decants';
        let stockMaximo = 0;
        let limiteAlcanzado = false;

        if (esDecant) {
            // Calcular mililitros de otras variantes del mismo perfume
            const mlOtros = carrito
                .filter(i => i.idProducto === item.idProducto && i.id !== id)
                .reduce((acc, i) => acc + (i.tamanoMl * i.cantidad), 0);

            const mlDisponiblesParaItem = product.mililitrosDisponibles - mlOtros;
            stockMaximo = Math.floor(mlDisponiblesParaItem / item.tamanoMl);

            if (nuevaCantidad > stockMaximo) {
                item.cantidad = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            } else {
                item.cantidad = nuevaCantidad;
            }
        } else {
            // Sellado
            stockMaximo = product.stock;
            if (nuevaCantidad > stockMaximo) {
                item.cantidad = stockMaximo;
                limiteAlcanzado = true;
            } else {
                item.cantidad = nuevaCantidad;
            }
        }

        item.subtotal = item.precioUnitario * item.cantidad;

        if (limiteAlcanzado) {
            mostrarToastPremium(`Stock máximo alcanzado (${stockMaximo} unidades).`, true);
        }

        // Si la cantidad es 0 por falta de ml, eliminarlo
        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id !== id);
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        if (window.renderizarCarritoDOM) window.renderizarCarritoDOM();
    } catch (e) {
        console.error('Error al actualizar cantidad:', e);
    }
}

/**
 * Elimina un producto del carrito
 * @param {string} id - ID único del ítem a eliminar
 */
function eliminarItem(id) {
    let carrito = obtenerCarrito();
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito(carrito);
    actualizarContadorCarrito();

    if (carrito.length === 0 && window.cuponesCheckout && typeof window.cuponesCheckout.quitarCupon === 'function') {
        window.cuponesCheckout.quitarCupon();
    }

    mostrarToastPremium('Producto eliminado del pedido.');

    if (window.renderizarCarritoDOM) {
        window.renderizarCarritoDOM();
    }
}

/**
 * Limpia por completo el carrito de compras
 */
function vaciarCarrito() {
    guardarCarrito([]);
    actualizarContadorCarrito();

    if (window.cuponesCheckout && typeof window.cuponesCheckout.quitarCupon === 'function') {
        window.cuponesCheckout.quitarCupon();
    }

    mostrarToastPremium('Carrito vaciado.');

    if (window.renderizarCarritoDOM) {
        window.renderizarCarritoDOM();
    }
}

/**
 * Retorna los ítems detallados del carrito
 * @returns {Promise<Array>}
 */
async function obtenerItemsCarritoDetallados() {
    const carrito = obtenerCarrito();
    const detallados = [];

    for (const item of carrito) {
        // Mapear con nombres de propiedades consistentes
        detallados.push({
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
        });
    }

    return detallados;
}

/**
 * Muestra una notificación emergente de la marca
 * @param {string} mensaje 
 * @param {boolean} esAdvertencia 
 */
function mostrarToastPremium(mensaje, esAdvertencia = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-premium';
    if (esAdvertencia) {
        toast.style.borderColor = '#FF3B30';
        toast.style.boxShadow = '0 0 10px rgba(255, 59, 48, 0.2)';
    }

    const iconoSvg = esAdvertencia 
        ? `<svg class="toast-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        : `<svg class="toast-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${iconoSvg}</span>
            <span class="toast-text">${mensaje}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Crea o recupera el nodo DOM del modal de confirmación al agregar al carrito
 */
function obtenerONavegarModalAgregarCarrito() {
    let modal = document.getElementById('cart-added-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-added-modal';
        modal.className = 'cart-added-modal-backdrop';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
        modal.hidden = true;
        if (document.body) document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ocultarModalAgregarCarrito();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) {
                ocultarModalAgregarCarrito();
            }
        });
    }
    return modal;
}

/**
 * Muestra el modal premium de confirmación visual al agregar un producto
 */
function mostrarModalAgregarCarrito(data) {
    if (!data) return;

    const modal = obtenerONavegarModalAgregarCarrito();

    const cantTotal = data.totalProductosCarrito || 1;
    const textoCantTotal = `Tienes <strong>${cantTotal} ${cantTotal === 1 ? 'producto' : 'productos'}</strong> en tu carrito`;

    modal.innerHTML = `
        <div class="cart-added-modal-container">
            <button type="button" class="cart-added-modal-close" id="cart-modal-close-btn" aria-label="Cerrar confirmación">&times;</button>

            <div class="cart-added-modal-header">
                <div class="cart-added-modal-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="cart-added-modal-header-text">
                    <h3 class="cart-added-modal-title">¡Agregado a tu carrito!</h3>
                    <span class="cart-added-modal-subtitle">Tu pedido se actualizó correctamente.</span>
                </div>
            </div>

            <div class="cart-added-modal-product-card">
                <img src="${typeof resolverImagen === 'function' ? resolverImagen(data.imagen) : (data.imagen || 'img/logo/logohorizontaldunesparfums.png')}" alt="${data.nombre}" class="cart-added-modal-img" loading="lazy" onerror="this.onerror=null; this.src='img/logo/logohorizontaldunesparfums.png';">
                <div class="cart-added-modal-product-info">
                    <span class="cart-added-modal-brand">${data.marca || 'DUNES PARFUMS'}</span>
                    <h4 class="cart-added-modal-name">${data.nombre}</h4>
                    <div class="cart-added-modal-details">
                        <span class="cart-added-modal-pres">${data.presentacion}</span>
                        <span class="cart-added-modal-qty">Cant: ${data.cantidadAgregada}</span>
                    </div>
                    <div class="cart-added-modal-price-row">
                        <span class="cart-added-modal-unit-price">S/ ${(data.precioUnitario || 0).toFixed(2)} c/u</span>
                        <span class="cart-added-modal-subtotal">Subtotal: S/ ${(data.subtotalAccion || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="cart-added-modal-summary-bar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>${textoCantTotal}</span>
            </div>

            <div class="cart-added-modal-actions">
                <button type="button" class="btn btn-secondary cart-added-btn-continue" id="cart-modal-continue-btn">
                    Seguir comprando
                </button>
                <a href="carrito.html" class="btn btn-primary cart-added-btn-cart" id="cart-modal-go-cart-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                    </svg>
                    Ir al carrito
                </a>
            </div>
        </div>
    `;

    const btnClose = modal.querySelector('#cart-modal-close-btn');
    if (btnClose) btnClose.addEventListener('click', ocultarModalAgregarCarrito);

    const btnContinue = modal.querySelector('#cart-modal-continue-btn');
    if (btnContinue) btnContinue.addEventListener('click', ocultarModalAgregarCarrito);

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
            modal.classList.add('is-visible');
        });
    } else {
        modal.classList.add('is-visible');
    }
}

/**
 * Oculta el modal de confirmación
 */
function ocultarModalAgregarCarrito() {
    const modal = document.getElementById('cart-added-modal');
    if (!modal) return;

    modal.classList.remove('is-visible');
    setTimeout(() => {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
    }, 220);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
});

// Hacer las funciones globales
window.mostrarModalAgregarCarrito = mostrarModalAgregarCarrito;
window.ocultarModalAgregarCarrito = ocultarModalAgregarCarrito;

window.carritoModulo = {
    obtenerCarrito,
    guardarCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    eliminarItem,
    vaciarCarrito,
    obtenerItemsCarritoDetallados,
    mostrarToastPremium,
    animarBotonCarritoHeader,
    mostrarModalAgregarCarrito,
    ocultarModalAgregarCarrito
};
