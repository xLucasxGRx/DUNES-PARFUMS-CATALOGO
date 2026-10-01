/**
 * Dunes Parfums - Interfaz y Controlador de "Mi Reserva Preventa" (FASE P4.3)
 *
 * Módulo puro desacoplado del carrito general, del catálogo y de compras regulares.
 * Lee exclusivamente desde dunes_preventa_cart a través de js/preventa-cart.js.
 *
 * Fórmulas comerciales aplicadas:
 * - total_preventa = cantidad * precio_preventa
 * - adelanto = cantidad * 10
 * - saldo = total_preventa - adelanto
 */
(function (global) {
    'use strict';

    /**
     * Formatea un valor numérico a moneda peruana (S/ 0.00)
     * @param {number|string} val
     * @returns {string}
     */
    function formatearPrecio(val) {
        const num = Number(val);
        if (!Number.isFinite(num)) return 'S/ 0.00';
        return 'S/ ' + (Math.round((num + Number.EPSILON) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * Resuelve de forma segura la ruta de imagen para la página /preventa/reserva/
     * @param {string} url
     * @returns {string}
     */
    function resolverRutaImagen(url) {
        if (!url || typeof url !== 'string') {
            return '../../img/logo/logohorizontaldunesparfums.png';
        }
        const limpia = url.trim();
        if (limpia.startsWith('http://') || limpia.startsWith('https://') || limpia.startsWith('//') || limpia.startsWith('data:')) {
            return limpia;
        }
        if (limpia.startsWith('../../')) {
            return limpia;
        }
        if (limpia.startsWith('../')) {
            return '../' + limpia;
        }
        return '../../' + limpia.replace(/^\//, '');
    }

    /**
     * Obtiene los productos reservados desde PreventaCart
     * @returns {Array}
     */
    function obtenerProductos() {
        if (typeof global.PreventaCart !== 'undefined' && typeof global.PreventaCart.obtenerReservaPreventa === 'function') {
            return global.PreventaCart.obtenerReservaPreventa();
        }
        if (typeof global.obtenerReservaPreventa === 'function') {
            return global.obtenerReservaPreventa();
        }
        try {
            const raw = localStorage.getItem('dunes_preventa_cart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Obtiene el resumen financiero calculado desde PreventaCart
     * @returns {{ totalProductos: number, totalUnidades: number, totalAdelanto: number, saldoPendiente: number }}
     */
    function obtenerResumen() {
        if (typeof global.PreventaCart !== 'undefined' && typeof global.PreventaCart.calcularResumenPreventa === 'function') {
            return global.PreventaCart.calcularResumenPreventa();
        }
        if (typeof global.calcularResumenPreventa === 'function') {
            return global.calcularResumenPreventa();
        }

        const items = obtenerProductos();
        let totalProductos = 0;
        let totalUnidades = 0;
        let totalAdelanto = 0;

        items.forEach(item => {
            const cant = Math.max(0, parseInt(item.cantidad, 10) || 0);
            const precio = Number(item.precio_preventa) || 0;
            totalUnidades += cant;
            totalProductos += cant * precio;
            totalAdelanto += cant * 10;
        });

        return {
            totalProductos,
            totalUnidades,
            totalAdelanto,
            saldoPendiente: Math.max(0, totalProductos - totalAdelanto)
        };
    }

    const WHATSAPP_NUMERO = '51986510573';

    /**
     * Formatea un número al estilo de moneda de WhatsApp (FASE P4.9: S/XXX.00)
     * @param {number|string} val
     * @returns {string}
     */
    function formatearMonedaWhatsApp(val) {
        if (typeof val === 'string') {
            val = val.replace(/[^\d.-]/g, '');
        }
        const num = Number(val);
        if (!Number.isFinite(num)) return 'S/0.00';
        return 'S/' + (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
    }

    /**
     * Genera el texto del mensaje optimizado y profesional de WhatsApp para confirmación de preventa (FASE P4.9)
     * - Sin emojis.
     * - Estructura exacta y profesional:
     *   Hola Dunes Parfums
     *   Deseo confirmar mi reserva de PREVENTA:
     *   Productos:
     *   • Producto x cantidad (o '• X productos en preventa' si son demasiados)
     *   Total de compra: S/XXX.00
     *   Adelanto de reserva: S/XX.00
     *   Saldo restante: S/XX.00
     *   Por favor, bríndenme los métodos de pago para confirmar mi reserva.
     *   Gracias.
     * - Elimina completamente cualquier aclaración redundante.
     *
     * @param {Array} items
     * @param {Object} [resumen]
     * @param {Object} [options]
     * @returns {string}
     */
    function construirTextoMensajeWhatsApp(items, resumen, options = {}) {
        const prodsAgrupados = new Map();
        (items || []).forEach(it => {
            const nombre = (it.nombre || 'Fragancia').trim();
            const cant = Math.max(1, parseInt(it.cantidad, 10) || 1);
            prodsAgrupados.set(nombre, (prodsAgrupados.get(nombre) || 0) + cant);
        });

        const res = resumen || obtenerResumen();
        const total = formatearMonedaWhatsApp(res.totalProductos);
        const adelanto = formatearMonedaWhatsApp(res.totalAdelanto);
        const saldo = formatearMonedaWhatsApp(res.saldoPendiente);

        // FASE P4.9: Si la reserva contiene demasiados productos y el mensaje se vuelve excesivamente largo
        const limiteMax = (options && typeof options.maxItems === 'number') ? options.maxItems : 6;
        const demasiadosProductos = Boolean(
            (options && options.resumirProductos) ||
            prodsAgrupados.size > limiteMax
        );

        let lineasProductos = [];
        if (demasiadosProductos) {
            const totalUnidades = res.totalUnidades || Array.from(prodsAgrupados.values()).reduce((a, b) => a + b, 0);
            lineasProductos = [`• ${totalUnidades} productos en preventa`];
        } else {
            prodsAgrupados.forEach((cant, nombre) => {
                lineasProductos.push(`• ${nombre} x${cant}`);
            });
        }

        const lineas = [
            'Hola Dunes Parfums',
            '',
            'Deseo confirmar mi reserva de PREVENTA:',
            '',
            'Productos:',
            '',
            ...lineasProductos,
            '',
            `Total de compra: ${total}`,
            '',
            `Adelanto de reserva: ${adelanto}`,
            '',
            `Saldo restante: ${saldo}`,
            '',
            'Por favor, bríndenme los métodos de pago para confirmar mi reserva.',
            '',
            'Gracias.'
        ];

        return lineas.join('\n');
    }

    /**
     * Muestra aviso cuando se intenta confirmar una reserva vacía
     */
    function mostrarAvisoReservaVacia() {
        if (typeof document !== 'undefined') {
            let toast = document.getElementById('reserva-alert-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'reserva-alert-toast';
                toast.className = 'reserva-alert-toast';
                document.body.appendChild(toast);
            }
            toast.innerHTML = `
                <div class="reserva-toast-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Agrega productos a tu reserva antes de continuar.</span>
                </div>
            `;
            toast.classList.add('is-visible');
            setTimeout(() => {
                toast.classList.remove('is-visible');
            }, 3200);
        }
    }

    /**
     * Valida la consistencia de stock de los productos reservados antes de abrir WhatsApp (FASE P4.5).
     * Si cambió el stock o la cantidad excede la disponibilidad actual, bloquea el envío.
     * @param {Array} items
     * @param {Array|null} [catalogoReferencia=null]
     * @returns {{ valido: boolean, mensaje?: string, itemAfectado?: Object }}
     */
    function validarStockAntesDeWhatsApp(items, catalogoReferencia = null) {
        if (!Array.isArray(items) || items.length === 0) {
            return { valido: false, mensaje: 'Agrega productos a tu reserva antes de continuar.' };
        }

        let catalogo = catalogoReferencia;
        if (!catalogo && typeof global.PreventaService !== 'undefined' && typeof global.PreventaService.obtenerProductos === 'function') {
            catalogo = global.PreventaService.obtenerProductos();
        }

        for (const item of items) {
            const cantReservada = Math.max(1, parseInt(item.cantidad, 10) || 1);

            if (catalogo && catalogo.length > 0) {
                const prod = catalogo.find(p => 
                    String(p.id) === String(item.id) || 
                    String(p.nombre).toLowerCase().trim() === String(item.nombre).toLowerCase().trim()
                );

                if (prod) {
                    const stockDisponible = Math.max(0, parseInt(prod.stock, 10) || 0);
                    if (prod.disponible === false || stockDisponible <= 0 || cantReservada > stockDisponible) {
                        return {
                            valido: false,
                            mensaje: 'Algunas cantidades disponibles cambiaron. Actualiza tu reserva.',
                            itemAfectado: item
                        };
                    }
                    continue;
                }
            }

            // Si no hay catálogo en memoria o no se encontró en catálogo, validar contra stock local
            if (item.stock !== undefined && item.stock !== null) {
                const stockLocal = Math.max(0, parseInt(item.stock, 10) || 0);
                if (cantReservada > stockLocal) {
                    return {
                        valido: false,
                        mensaje: 'Algunas cantidades disponibles cambiaron. Actualiza tu reserva.',
                        itemAfectado: item
                    };
                }
            }
        }

        return { valido: true };
    }

    /**
     * Genera el mensaje y enlace de WhatsApp para la reserva y lo abre (FASE P4.4 / P4.5)
     * - Lee dunes_preventa_cart.
     * - Revalida stock antes de WhatsApp.
     * - Si cambió el stock: muestra "Algunas cantidades disponibles cambiaron. Actualiza tu reserva."
     * - Obtiene productos.
     * - Calcula cantidades, adelanto y saldo.
     * - Codifica mensaje URL.
     * - Abre WhatsApp.
     * - Mantiene productos en localStorage (NO elimina la reserva).
     * @param {Object} [options={}]
     * @returns {string|null} URL de WhatsApp generada o null si no hay productos o error de stock
     */
    function generarMensajeWhatsAppReserva(options = {}) {
        const items = obtenerProductos();
        if (!items || items.length === 0) {
            mostrarAvisoReservaVacia('Agrega productos a tu reserva antes de continuar.');
            return null;
        }

        // FASE P4.5: Revalidar stock antes de generar WhatsApp
        const catalogo = (options && (options.catalogo || options.productos)) || null;
        const validacionStock = validarStockAntesDeWhatsApp(items, catalogo);
        if (!validacionStock.valido) {
            mostrarAvisoReservaVacia(validacionStock.mensaje || 'Algunas cantidades disponibles cambiaron. Actualiza tu reserva.');
            return null;
        }

        const resumen = obtenerResumen();
        const textoMensaje = construirTextoMensajeWhatsApp(items, resumen, options);
        const mensajeCodificado = encodeURIComponent(textoMensaje);
        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeCodificado}`;

        // Disparo de evento desacoplado para auditoría o pruebas
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('dunes:preventa-whatsapp-generado', {
                    detail: { items, resumen, textoMensaje, urlWhatsApp }
                }));
            } catch (e) {}
        }

        // Abrir WhatsApp en nueva pestaña sin destruir el storage
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
            try {
                window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
            } catch (err) {
                if (typeof window.location !== 'undefined') {
                    window.location.href = urlWhatsApp;
                }
            }
        }

        return urlWhatsApp;
    }

    /**
     * Renderiza la página completa de "Mi Reserva Preventa"
     */
    function renderizarPaginaReserva() {
        if (typeof document === 'undefined') return;

        const contentEl = document.getElementById('reserva-content');
        const emptyEl = document.getElementById('reserva-empty-state');
        const listEl = document.getElementById('reserva-items-list');
        const countPill = document.getElementById('reserva-count-pill');

        const items = obtenerProductos();
        const resumen = obtenerResumen();

        // 1. Manejo de estado vacío vs con productos
        if (!items || items.length === 0) {
            if (contentEl) contentEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
            if (countPill) countPill.textContent = '0 unidades';
            return;
        }

        if (contentEl) contentEl.style.display = 'grid';
        if (emptyEl) emptyEl.style.display = 'none';

        // 2. Actualizar contador en cabecera
        if (countPill) {
            const textoCant = resumen.totalUnidades === 1 ? '1 unidad' : `${resumen.totalUnidades} unidades`;
            countPill.textContent = textoCant;
        }

        // 3. Renderizar listado de productos
        if (listEl) {
            listEl.innerHTML = '';
            items.forEach(item => {
                const card = document.createElement('article');
                card.className = 'reserva-item-card';
                card.setAttribute('data-id', item.id);
                card.setAttribute('role', 'listitem');

                const rutaImg = resolverRutaImagen(item.imagen);
                const precioPreventaStr = formatearPrecio(item.precio_preventa);
                const adelantoStr = formatearPrecio(item.adelanto_total);
                const saldoStr = formatearPrecio(item.saldo_pendiente);
                const cant = Math.max(1, parseInt(item.cantidad, 10) || 1);
                const stockMax = Math.max(1, parseInt(item.stock ?? item.stock_validado ?? 999, 10));
                const isMax = cant >= stockMax;
                const isMin = cant <= 1;

                card.innerHTML = `
                    <div class="reserva-item-compact-grid">
                        <div class="reserva-item-media">
                            <img src="${rutaImg}" alt="${item.nombre}" class="reserva-item-img" onerror="this.onerror=null; this.src='../../img/logo/logohorizontaldunesparfums.png';">
                        </div>

                        <div class="reserva-item-info">
                            <span class="reserva-item-brand">${item.marca || 'DUNES PARFUMS'}</span>
                            <h3 class="reserva-item-name">${item.nombre}</h3>
                            <div class="reserva-item-price-val">${precioPreventaStr}</div>
                        </div>

                        <div class="reserva-item-qty-col">
                            <span class="reserva-qty-label">Cantidad</span>
                            <div class="reserva-qty-stepper" aria-label="Cantidad para ${item.nombre}">
                                <button type="button" class="reserva-qty-btn btn-qty-minus ${isMin ? 'is-disabled' : ''}" data-action="decrease" data-id="${item.id}" ${isMin ? 'disabled' : ''} aria-label="Disminuir cantidad de ${item.nombre}">
                                    −
                                </button>
                                <span class="reserva-qty-display" aria-live="polite">${cant}</span>
                                <button type="button" class="reserva-qty-btn btn-qty-plus ${isMax ? 'is-disabled' : ''}" data-action="increase" data-id="${item.id}" ${isMax ? 'disabled' : ''} aria-label="Aumentar cantidad de ${item.nombre}">
                                    +
                                </button>
                            </div>
                        </div>

                        <div class="reserva-item-financial-col">
                            <div class="reserva-financial-mini-row">
                                <span class="reserva-financial-label">Adelanto:</span>
                                <span class="reserva-financial-val highlight-deposit">${adelantoStr}</span>
                            </div>
                            <div class="reserva-financial-mini-row">
                                <span class="reserva-financial-label">Saldo:</span>
                                <span class="reserva-financial-val">${saldoStr}</span>
                            </div>
                        </div>

                        <div class="reserva-item-actions-col">
                            <button type="button" class="reserva-btn-remove" data-action="remove" data-id="${item.id}" aria-label="Eliminar ${item.nombre} de la reserva">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span>Eliminar</span>
                            </button>
                        </div>
                    </div>
                `;

                listEl.appendChild(card);
            });
        }

        // 4. Actualizar Resumen Económico
        const totalUnidadesEl = document.getElementById('summary-total-unidades');
        const totalPreventaEl = document.getElementById('summary-total-preventa');
        const adelantoReqEl = document.getElementById('summary-adelanto-requerido');
        const saldoPendEl = document.getElementById('summary-saldo-pendiente');
        const calloutMontoEl = document.getElementById('callout-monto-adelanto');

        if (totalUnidadesEl) {
            const textoCant = resumen.totalUnidades === 1 ? '1 unidad' : `${resumen.totalUnidades} unidades`;
            totalUnidadesEl.textContent = textoCant;
        }
        if (totalPreventaEl) totalPreventaEl.textContent = formatearPrecio(resumen.totalProductos);
        if (adelantoReqEl) adelantoReqEl.textContent = formatearPrecio(resumen.totalAdelanto);
        if (saldoPendEl) saldoPendEl.textContent = formatearPrecio(resumen.saldoPendiente);
        if (calloutMontoEl) calloutMontoEl.textContent = formatearPrecio(resumen.totalAdelanto);
    }

    /**
     * Vincula las acciones de usuario (stepper de cantidad, eliminar, vaciar y whatsapp)
     */
    function inicializarEventosReserva() {
        if (typeof document === 'undefined') return;

        const listEl = document.getElementById('reserva-items-list');
        const btnVaciar = document.getElementById('btn-vaciar-reserva');
        const btnWhatsApp = document.getElementById('btn-confirmar-whatsapp');

        // Delegación de eventos en la lista de productos
        if (listEl) {
            listEl.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                e.preventDefault();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                if (!id) return;

                const items = obtenerProductos();
                const item = items.find(it => String(it.id) === String(id));
                if (!item) return;

                if (action === 'increase') {
                    const cantActual = parseInt(item.cantidad, 10) || 1;
                    const stockMax = Math.max(1, parseInt(item.stock ?? item.stock_validado ?? 999, 10));
                    if (cantActual >= stockMax) {
                        mostrarAvisoReservaVacia('Has alcanzado el máximo disponible para este producto.');
                        return;
                    }
                    const nuevaCant = cantActual + 1;
                    if (global.PreventaCart && typeof global.PreventaCart.actualizarCantidadPreventa === 'function') {
                        global.PreventaCart.actualizarCantidadPreventa(id, nuevaCant);
                    }
                    renderizarPaginaReserva();
                } else if (action === 'decrease') {
                    const cantActual = parseInt(item.cantidad, 10) || 1;
                    if (cantActual <= 1) {
                        // FASE P4.5: Nunca permitir 0. Si llega a 1: Mantener producto.
                        return;
                    }
                    const nuevaCant = cantActual - 1;
                    if (global.PreventaCart && typeof global.PreventaCart.actualizarCantidadPreventa === 'function') {
                        global.PreventaCart.actualizarCantidadPreventa(id, nuevaCant);
                    }
                    renderizarPaginaReserva();
                } else if (action === 'remove') {
                    if (global.PreventaCart && typeof global.PreventaCart.eliminarProductoPreventa === 'function') {
                        global.PreventaCart.eliminarProductoPreventa(id);
                    }
                    renderizarPaginaReserva();
                }
            });
        }

        // FASE P4.8.4: Modal de confirmación personalizado para vaciar reserva (Sin confirm nativo del navegador)
        const modalVaciar = document.getElementById('modal-vaciar-reserva');
        const btnModalCancelar = document.getElementById('btn-modal-vaciar-cancelar');
        const btnModalConfirmar = document.getElementById('btn-modal-vaciar-confirmar');
        const btnModalCerrar = document.getElementById('btn-modal-vaciar-cerrar');
        const backdropModal = document.getElementById('modal-vaciar-backdrop');

        const abrirModalVaciar = () => {
            if (!modalVaciar) return;
            modalVaciar.hidden = false;
            modalVaciar.classList.add('is-open');
            if (document.body) document.body.classList.add('modal-open', 'no-scroll');
            if (btnModalCancelar && typeof btnModalCancelar.focus === 'function') {
                try { btnModalCancelar.focus(); } catch (e) {}
            }
        };

        const cerrarModalVaciar = () => {
            if (!modalVaciar) return;
            modalVaciar.classList.remove('is-open');
            setTimeout(() => {
                if (!modalVaciar.classList.contains('is-open')) {
                    modalVaciar.hidden = true;
                }
            }, 250);
            if (document.body) document.body.classList.remove('modal-open', 'no-scroll');
        };

        if (btnVaciar) {
            btnVaciar.addEventListener('click', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                const items = obtenerProductos();
                if (!items || items.length === 0) return;

                if (modalVaciar) {
                    abrirModalVaciar();
                } else {
                    if (global.PreventaCart && typeof global.PreventaCart.vaciarReservaPreventa === 'function') {
                        global.PreventaCart.vaciarReservaPreventa();
                    }
                    renderizarPaginaReserva();
                }
            });
        }

        if (btnModalConfirmar) {
            btnModalConfirmar.addEventListener('click', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                if (global.PreventaCart && typeof global.PreventaCart.vaciarReservaPreventa === 'function') {
                    global.PreventaCart.vaciarReservaPreventa();
                }
                cerrarModalVaciar();
                renderizarPaginaReserva();
            });
        }

        if (btnModalCancelar) {
            btnModalCancelar.addEventListener('click', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                cerrarModalVaciar();
            });
        }

        if (btnModalCerrar) {
            btnModalCerrar.addEventListener('click', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                cerrarModalVaciar();
            });
        }

        if (backdropModal) {
            backdropModal.addEventListener('click', cerrarModalVaciar);
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modalVaciar && modalVaciar.classList.contains('is-open')) {
                    cerrarModalVaciar();
                }
            });
        }

        // Botón confirmar por WhatsApp (FASE P4.4: Generación y apertura oficial)
        if (btnWhatsApp) {
            btnWhatsApp.addEventListener('click', (e) => {
                e.preventDefault();
                generarMensajeWhatsAppReserva();
            });
        }

        // Escucha de eventos de actualización externa del carrito de preventa
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('dunes:preventa-cart-updated', () => {
                renderizarPaginaReserva();
            });
        }
    }

    // Inicialización automática en DOMContentLoaded
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                renderizarPaginaReserva();
                inicializarEventosReserva();
            });
        } else {
            renderizarPaginaReserva();
            inicializarEventosReserva();
        }
    }

    // API pública exportable
    const api = {
        WHATSAPP_NUMERO,
        formatearPrecio,
        formatearMonedaWhatsApp,
        resolverRutaImagen,
        obtenerProductos,
        obtenerResumen,
        construirTextoMensajeWhatsApp,
        prepararEstructuraMensajeWhatsApp: construirTextoMensajeWhatsApp,
        generarMensajeWhatsAppReserva,
        mostrarAvisoReservaVacia,
        validarStockAntesDeWhatsApp,
        renderizarPaginaReserva,
        inicializarEventosReserva
    };

    if (typeof global !== 'undefined') {
        global.PreventaReserva = api;
        global.generarMensajeWhatsAppReserva = generarMensajeWhatsAppReserva;
        global.validarStockAntesDeWhatsApp = validarStockAntesDeWhatsApp;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    return api;
})(typeof window !== 'undefined' ? window : globalThis);
