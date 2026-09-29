/**
 * Dunes Parfums - Motor Independiente de Reservas PREVENTA (FASE P4.1)
 *
 * Módulo puro desacoplado del carrito general, del catálogo y de compras regulares.
 * Gestiona el almacenamiento, cálculo y resumen de reservas de fragancias próximas a llegar.
 *
 * Regla comercial:
 * La separación de S/ 10.00 por unidad es un adelanto descontable del precio final de preventa:
 * - adelanto_total = cantidad * 10
 * - total_producto = cantidad * precio_preventa
 * - saldo_pendiente = total_producto - adelanto_total
 *
 * Storage independiente:
 * Clave localStorage: 'dunes_preventa_cart'
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'dunes_preventa_cart';
    const ADELANTO_UNITARIO = 10;

    /**
     * Redondea un valor numérico a 2 decimales para evitar imprecisiones de coma flotante
     * @param {number} val
     * @returns {number}
     */
    function redondearMoneda(val) {
        const num = Number(val);
        if (!Number.isFinite(num)) return 0;
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    /**
     * Obtiene el storage disponible (localStorage o fallback en entorno global)
     */
    function getStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                return localStorage;
            }
        } catch (e) {
            // Manejo de entornos con localStorage restringido
        }
        if (typeof global !== 'undefined' && global.localStorage) {
            return global.localStorage;
        }
        if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
            return globalThis.localStorage;
        }
        return null;
    }

    /**
     * Genera un identificador seguro y estable para el producto
     */
    function normalizarId(producto) {
        if (producto && producto.id) {
            return String(producto.id);
        }
        if (producto && producto.nombre) {
            const slug = String(producto.nombre)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return 'prev-' + slug;
        }
        return 'prev-' + Date.now();
    }

    /**
     * Construye y calcula los campos requeridos para un producto en reserva:
     * {
     *   id,
     *   nombre,
     *   marca,
     *   imagen,
     *   categoria,
     *   genero,
     *   ocasion,
     *   formato_presentacion,
     *   precio_regular,
     *   precio_preventa,
     *   cantidad,
     *   adelanto_unitario: 10,
     *   adelanto_total,
     *   total_producto,
     *   saldo_pendiente
     * }
     */
    /**
     * Construye el mensaje oficial cuando se supera el stock disponible (FASE P4.5).
     * @param {number} stock
     * @returns {string}
     */
    function obtenerMensajeStockSuperado(stock) {
        const s = Math.max(0, parseInt(stock, 10) || 0);
        const unidades = s === 1 ? 'unidad disponible' : 'unidades disponibles';
        return `Lo sentimos, solo tenemos ${s} ${unidades} para preventa.`;
    }

    /**
     * Construye y calcula los campos requeridos para un producto en reserva:
     * Guarda también cantidad, id interno, stock_validado, producto, precio (FASE P4.5).
     */
    function calcularValoresProducto(producto, cantidad = 1) {
        const cant = Math.max(1, parseInt(cantidad, 10) || 1);
        const precioPreventa = redondearMoneda(producto.precio_preventa ?? producto.precio ?? 0);
        const precioRegular = redondearMoneda(producto.precio_regular ?? precioPreventa);

        let stockVal = 999;
        if (producto.stock !== undefined && producto.stock !== null) {
            stockVal = Math.max(0, parseInt(producto.stock, 10) || 0);
        } else if (producto.stock_validado !== undefined && producto.stock_validado !== null) {
            stockVal = Math.max(0, parseInt(producto.stock_validado, 10) || 0);
        }

        const adelantoTotal = redondearMoneda(cant * ADELANTO_UNITARIO);
        const totalProducto = redondearMoneda(cant * precioPreventa);
        const saldoPendiente = redondearMoneda(totalProducto - adelantoTotal);
        const nombreProducto = String(producto.nombre || producto.producto || '').trim();

        return {
            id: normalizarId(producto),
            nombre: nombreProducto,
            producto: nombreProducto,
            marca: String(producto.marca || '').trim(),
            imagen: String(producto.imagen || '').trim(),
            categoria: String(producto.categoria || '').trim(),
            genero: String(producto.genero || '').trim(),
            ocasion: String(producto.ocasion || '').trim(),
            formato_presentacion: String(producto.formato_presentacion || '').trim(),
            precio_regular: precioRegular,
            precio_preventa: precioPreventa,
            precio: precioPreventa,
            stock: stockVal,
            stock_validado: stockVal,
            cantidad: cant,
            adelanto_unitario: ADELANTO_UNITARIO,
            adelanto_total: adelantoTotal,
            total_producto: totalProducto,
            saldo_pendiente: saldoPendiente
        };
    }

    /**
     * Valida si un producto puede ser reservado o si excede el stock disponible (FASE P4.5).
     * @param {Object} producto
     * @param {number} [cantidadAAgregar=1]
     * @returns {{ valido: boolean, motivo?: string, stock: number, cantidadActual: number, nuevaCantidad?: number, mensaje?: string }}
     */
    function validarStockProducto(producto, cantidadAAgregar = 1) {
        if (!producto || typeof producto !== 'object') {
            return { valido: false, motivo: 'invalido', stock: 0, cantidadActual: 0, mensaje: 'Producto inválido' };
        }

        const idBuscado = normalizarId(producto);
        const reserva = obtenerReservaPreventa();
        const itemActual = reserva.find(item => String(item.id) === idBuscado);
        const cantActual = itemActual ? (parseInt(itemActual.cantidad, 10) || 0) : 0;
        const cantDeseada = Math.max(1, parseInt(cantidadAAgregar, 10) || 1);

        let stockMaximo = 999;
        if (producto.stock !== undefined && producto.stock !== null) {
            stockMaximo = Math.max(0, parseInt(producto.stock, 10) || 0);
        } else if (producto.stock_validado !== undefined && producto.stock_validado !== null) {
            stockMaximo = Math.max(0, parseInt(producto.stock_validado, 10) || 0);
        } else if (itemActual && itemActual.stock !== undefined && itemActual.stock !== null) {
            stockMaximo = Math.max(0, parseInt(itemActual.stock, 10) || 0);
        }

        // Producto con stock 0 o no disponible: bloquea reserva
        if (producto.disponible === false || stockMaximo <= 0) {
            return {
                valido: false,
                motivo: 'agotado',
                stock: stockMaximo,
                cantidadActual: cantActual,
                mensaje: 'PREVENTA CERRADA'
            };
        }

        // Si la suma supera el stock disponible
        if (cantActual + cantDeseada > stockMaximo) {
            return {
                valido: false,
                motivo: 'stock_superado',
                stock: stockMaximo,
                cantidadActual: cantActual,
                nuevaCantidad: cantActual + cantDeseada,
                mensaje: obtenerMensajeStockSuperado(stockMaximo)
            };
        }

        return {
            valido: true,
            stock: stockMaximo,
            cantidadActual: cantActual,
            nuevaCantidad: cantActual + cantDeseada
        };
    }

    /**
     * Muestra una notificación visual boutique cuando se supera el stock de preventa (FASE P4.5).
     * @param {string} mensaje
     */
    function mostrarAlertaStockPreventa(mensaje) {
        if (typeof document === 'undefined') return;

        let toast = document.getElementById('preventa-stock-toast');
        if (!toast) {
            toast = document.createElement('aside');
            toast.id = 'preventa-stock-toast';
            toast.className = 'preventa-stock-toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="preventa-stock-toast-body">
                <svg class="preventa-stock-toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="preventa-stock-toast-text">${mensaje}</span>
            </div>
        `;

        toast.classList.add('is-visible');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 4000);
    }

    /**
     * Obtiene todos los productos reservados desde el localStorage independiente
     * @returns {Array} Lista de productos en reserva preventa
     */
    function obtenerReservaPreventa() {
        const storage = getStorage();
        if (!storage) return [];

        try {
            const raw = storage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.warn('[PreventaCart] Error al leer dunes_preventa_cart desde storage:', e);
            return [];
        }
    }

    /**
     * Guarda la lista de reservas en el localStorage independiente
     * @param {Array} items
     * @returns {Array}
     */
    function guardarReserva(items) {
        const lista = Array.isArray(items) ? items : [];
        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(lista));
            } catch (e) {
                console.warn('[PreventaCart] Error al escribir en dunes_preventa_cart:', e);
            }
        }

        // Notificación opcional por evento para componentes reactivos
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('dunes:preventa-cart-updated', {
                    detail: { items: lista }
                }));
            } catch (e) {}
        }

        return lista;
    }

    /**
     * Agrega un producto a la reserva de preventa.
     * - Valida stock máximo disponible (FASE P4.5).
     * - Si supera stock: no agrega y muestra aviso boutique.
     * - Si está disponible: añade o incrementa cantidad y recalcula montos.
     * - Guarda en dunes_preventa_cart.
     *
     * @param {Object} producto Datos del producto a reservar
     * @param {number} [cantidad=1] Cantidad a agregar
     * @param {Object} [opciones={}] Opciones auxiliares (ej. silencioso: true para omitir modal)
     * @returns {Array} Lista actualizada de reservas
     */
    function agregarProductoPreventa(producto, cantidad = 1, opciones = {}) {
        if (!producto || typeof producto !== 'object') {
            return obtenerReservaPreventa();
        }

        const validacion = validarStockProducto(producto, cantidad);
        if (!validacion.valido) {
            if (typeof document !== 'undefined' && (!opciones || opciones.silencioso !== true)) {
                try {
                    mostrarAlertaStockPreventa(validacion.mensaje);
                } catch (e) {
                    console.warn('[PreventaCart] No se pudo mostrar alerta de stock:', e);
                }
            }
            return obtenerReservaPreventa();
        }

        const cantAAgregar = Math.max(1, parseInt(cantidad, 10) || 1);
        const idBuscado = normalizarId(producto);
        const reserva = obtenerReservaPreventa();

        const index = reserva.findIndex(item => String(item.id) === idBuscado);
        let itemGuardado = null;

        if (index >= 0) {
            // El producto ya existe en la reserva: aumentar cantidad y recalcular
            const itemActual = reserva[index];
            if (producto.stock !== undefined && producto.stock !== null) {
                itemActual.stock = producto.stock;
            }
            const nuevaCantidad = itemActual.cantidad + cantAAgregar;
            itemGuardado = calcularValoresProducto(itemActual, nuevaCantidad);
            reserva[index] = itemGuardado;
        } else {
            // Nuevo producto en la reserva
            itemGuardado = calcularValoresProducto(producto, cantAAgregar);
            reserva.push(itemGuardado);
        }

        const listaActualizada = guardarReserva(reserva);

        // FASE P4.2: Confirmación visual inmediata al agregar producto a PREVENTA
        if (typeof document !== 'undefined' && (!opciones || opciones.silencioso !== true)) {
            try {
                mostrarConfirmacionPreventa(itemGuardado);
            } catch (e) {
                console.warn('[PreventaCart] No se pudo mostrar confirmación visual:', e);
            }
        }

        return listaActualizada;
    }

    /**
     * Actualiza la cantidad de un producto en la reserva de preventa.
     * No permite superar el stock disponible (FASE P4.5).
     * Si la cantidad es <= 0, elimina el producto de la reserva.
     * Recalcula automáticamente total_producto, adelanto_total y saldo_pendiente.
     *
     * @param {string|number} id Identificador del producto
     * @param {number} cantidad Nueva cantidad
     * @returns {Array} Lista actualizada de reservas
     */
    function actualizarCantidadPreventa(id, cantidad) {
        const idStr = String(id ?? '').trim();
        if (!idStr) return obtenerReservaPreventa();

        const nuevaCant = parseInt(cantidad, 10);
        if (isNaN(nuevaCant) || nuevaCant <= 0) {
            return eliminarProductoPreventa(idStr);
        }

        const reserva = obtenerReservaPreventa();
        const index = reserva.findIndex(item => String(item.id) === idStr);

        if (index >= 0) {
            const itemActual = reserva[index];
            const stockMaximo = (itemActual.stock !== undefined && itemActual.stock !== null)
                ? Math.max(0, parseInt(itemActual.stock, 10) || 0)
                : 999;

            const cantFinal = Math.min(nuevaCant, stockMaximo);
            reserva[index] = calcularValoresProducto(itemActual, cantFinal);
            return guardarReserva(reserva);
        }

        return reserva;
    }

    /**
     * Elimina un producto específico únicamente de la reserva de preventa
     * @param {string|number} id Identificador del producto a eliminar
     * @returns {Array} Lista actualizada de reservas
     */
    function eliminarProductoPreventa(id) {
        const idStr = String(id ?? '').trim();
        if (!idStr) return obtenerReservaPreventa();

        const reserva = obtenerReservaPreventa();
        const filtrados = reserva.filter(item => String(item.id) !== idStr);

        return guardarReserva(filtrados);
    }

    /**
     * Vacía completamente el contenido de la reserva de preventa
     * @returns {Array} Array vacío []
     */
    function vaciarReservaPreventa() {
        const storage = getStorage();
        if (storage) {
            try {
                storage.removeItem(STORAGE_KEY);
            } catch (e) {
                try {
                    storage.setItem(STORAGE_KEY, JSON.stringify([]));
                } catch (err) {}
            }
        }
        return guardarReserva([]);
    }

    /**
     * Calcula el resumen financiero y de cantidades de la reserva de preventa
     * @returns {{
     *   totalProductos: number,
     *   totalUnidades: number,
     *   totalAdelanto: number,
     *   saldoPendiente: number
     * }}
     */
    function calcularResumenPreventa() {
        const reserva = obtenerReservaPreventa();

        let totalProductos = 0;
        let totalUnidades = 0;
        let totalAdelanto = 0;

        reserva.forEach(item => {
            const cant = Math.max(0, parseInt(item.cantidad, 10) || 0);
            const totProd = redondearMoneda(item.total_producto ?? (cant * (Number(item.precio_preventa) || 0)));
            const adelTot = redondearMoneda(item.adelanto_total ?? (cant * ADELANTO_UNITARIO));

            totalUnidades += cant;
            totalProductos += totProd;
            totalAdelanto += adelTot;
        });

        totalProductos = redondearMoneda(totalProductos);
        totalAdelanto = redondearMoneda(totalAdelanto);
        const saldoPendiente = redondearMoneda(totalProductos - totalAdelanto);

        return {
            totalProductos,
            totalUnidades,
            totalAdelanto,
            saldoPendiente
        };
    }

    /**
     * Obtiene el total de unidades reservadas para el contador visual
     * @returns {number} Cantidad total de frascos/unidades reservadas
     */
    function obtenerCantidadReservaPreventa() {
        const resumen = calcularResumenPreventa();
        return resumen.totalUnidades;
    }

    /**
     * Resuelve de forma segura la ruta de imagen para la mini tarjeta de confirmación
     * @param {string} url
     * @returns {string}
     */
    function resolverRutaImagenPreventa(url) {
        if (!url || typeof url !== 'string') {
            return '../img/logo/logohorizontaldunesparfums.png';
        }
        const limpia = url.trim();
        if (limpia.startsWith('http://') || limpia.startsWith('https://') || limpia.startsWith('//') || limpia.startsWith('../') || limpia.startsWith('data:')) {
            return limpia;
        }
        return '../' + limpia.replace(/^\//, '');
    }

    /**
     * Obtiene el elemento modal de confirmación o lo crea dinámicamente si no existe en el DOM
     * @returns {HTMLElement|null}
     */
    function obtenerOCrearModalConfirmacion() {
        if (typeof document === 'undefined') return null;

        let modal = document.getElementById('preventa-confirm-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'preventa-confirm-modal';
        modal.className = 'preventa-confirm-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'preventa-confirm-title');
        modal.setAttribute('aria-describedby', 'preventa-confirm-subtitle');
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="preventa-confirm-backdrop" id="preventa-confirm-backdrop"></div>
            <div class="preventa-confirm-dialog" id="preventa-confirm-dialog" role="document">
                <button type="button" class="preventa-confirm-close" id="preventa-confirm-close" aria-label="Cerrar confirmación de reserva">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="preventa-confirm-header">
                    <div class="preventa-confirm-icon-box" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <div class="preventa-confirm-headings">
                        <h3 class="preventa-confirm-title" id="preventa-confirm-title">¡Reserva agregada correctamente!</h3>
                        <p class="preventa-confirm-subtitle" id="preventa-confirm-subtitle">Tu fragancia fue guardada en tu reserva preventiva.</p>
                    </div>
                </div>

                <div class="preventa-confirm-product-card" id="preventa-confirm-product-card">
                    <div class="preventa-confirm-product-media">
                        <img id="preventa-confirm-img" src="" alt="Perfume reservado" class="preventa-confirm-img" onerror="this.onerror=null; this.src='../img/logo/logohorizontaldunesparfums.png';">
                    </div>
                    <div class="preventa-confirm-product-info">
                        <span class="preventa-confirm-brand" id="preventa-confirm-brand"></span>
                        <h4 class="preventa-confirm-name" id="preventa-confirm-name"></h4>
                        <div class="preventa-confirm-price-row">
                            <span class="preventa-confirm-price-label">Precio preventa:</span>
                            <span class="preventa-confirm-price" id="preventa-confirm-price"></span>
                        </div>
                        <div class="preventa-confirm-qty-row">
                            <span class="preventa-confirm-qty-badge" id="preventa-confirm-qty">Cantidad: 1</span>
                        </div>
                    </div>
                </div>

                <div class="preventa-confirm-deposit-box">
                    <div class="preventa-confirm-deposit-main">
                        <div class="preventa-confirm-deposit-col">
                            <span class="preventa-confirm-deposit-label">Adelanto requerido</span>
                            <span class="preventa-confirm-deposit-val" id="preventa-confirm-deposit">S/ 10.00</span>
                        </div>
                        <div class="preventa-confirm-deposit-col text-right">
                            <span class="preventa-confirm-balance-label">Saldo restante al recibir</span>
                            <span class="preventa-confirm-balance-val" id="preventa-confirm-balance">S/ 0.00</span>
                        </div>
                    </div>
                    <div class="preventa-confirm-deposit-note">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Solo abonas el adelanto para congelar el precio. El saldo se cancela contra entrega.</span>
                    </div>
                </div>

                <div class="preventa-confirm-actions">
                    <a href="reserva/" class="preventa-confirm-btn preventa-confirm-btn-primary" id="preventa-confirm-btn-view">
                        <span>VER MI RESERVA</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 12h14"></path>
                            <path d="m12 5 7 7-7 7"></path>
                        </svg>
                    </a>

                    <button type="button" class="preventa-confirm-btn preventa-confirm-btn-secondary" id="preventa-confirm-btn-continue">
                        <span>SEGUIR EXPLORANDO</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        vincularEventosModalConfirmacion(modal);
        return modal;
    }

    /**
     * Vincula los listeners de interacción del modal de confirmación
     * @param {HTMLElement} modal
     */
    function vincularEventosModalConfirmacion(modal) {
        if (!modal || modal.dataset.eventsBound === 'true') return;
        modal.dataset.eventsBound = 'true';

        const btnCerrar = modal.querySelector('#preventa-confirm-close');
        const btnContinuar = modal.querySelector('#preventa-confirm-btn-continue');
        const backdrop = modal.querySelector('#preventa-confirm-backdrop');
        const btnView = modal.querySelector('#preventa-confirm-btn-view');

        const handlerCerrar = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            ocultarConfirmacionPreventa();
        };

        if (btnCerrar) btnCerrar.addEventListener('click', handlerCerrar);
        if (btnContinuar) btnContinuar.addEventListener('click', handlerCerrar);
        if (backdrop) backdrop.addEventListener('click', handlerCerrar);

        // Escape para cerrar el modal
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                    ocultarConfirmacionPreventa();
                }
            });
        }

        // Preparar navegación futura hacia /preventa/reserva/ sin romper si no existe
        if (btnView) {
            btnView.addEventListener('click', (e) => {
                if (typeof fetch === 'function') {
                    e.preventDefault();
                    fetch('reserva/', { method: 'HEAD' })
                        .then(res => {
                            if (res.ok) {
                                window.location.href = 'reserva/';
                            } else {
                                const spanText = btnView.querySelector('span') || btnView;
                                const originalText = spanText.textContent;
                                spanText.textContent = 'PRÓXIMAMENTE DISPONIBLE';
                                setTimeout(() => { spanText.textContent = originalText; }, 2000);
                            }
                        })
                        .catch(() => {
                            const spanText = btnView.querySelector('span') || btnView;
                            const originalText = spanText.textContent;
                            spanText.textContent = 'PRÓXIMAMENTE DISPONIBLE';
                            setTimeout(() => { spanText.textContent = originalText; }, 2000);
                        });
                }
            });
        }
    }

    /**
     * Muestra la confirmación visual boutique con los datos del producto agregado
     * @param {Object} item Producto reservado
     */
    function mostrarConfirmacionPreventa(item) {
        if (typeof document === 'undefined' || !item) return;

        const modal = obtenerOCrearModalConfirmacion();
        if (!modal) return;

        vincularEventosModalConfirmacion(modal);

        const imgEl = modal.querySelector('#preventa-confirm-img');
        const brandEl = modal.querySelector('#preventa-confirm-brand');
        const nameEl = modal.querySelector('#preventa-confirm-name');
        const priceEl = modal.querySelector('#preventa-confirm-price');
        const qtyEl = modal.querySelector('#preventa-confirm-qty');
        const depositEl = modal.querySelector('#preventa-confirm-deposit');
        const balanceEl = modal.querySelector('#preventa-confirm-balance');

        if (imgEl) {
            imgEl.src = resolverRutaImagenPreventa(item.imagen);
            imgEl.alt = item.nombre || 'Perfume en preventa';
        }
        if (brandEl) brandEl.textContent = (item.marca || 'DUNES PARFUMS').toUpperCase();
        if (nameEl) nameEl.textContent = item.nombre || 'Fragancia Preventa';
        if (priceEl) priceEl.textContent = 'S/ ' + redondearMoneda(item.precio_preventa).toFixed(2);
        if (qtyEl) qtyEl.textContent = 'Cantidad: ' + (item.cantidad || 1);
        if (depositEl) depositEl.textContent = 'S/ ' + redondearMoneda(item.adelanto_total).toFixed(2);
        if (balanceEl) balanceEl.textContent = 'S/ ' + redondearMoneda(item.saldo_pendiente).toFixed(2);

        // Mostrar con reflow y animación suave
        modal.style.display = 'flex';
        modal.removeAttribute('aria-hidden');

        void modal.offsetWidth;

        modal.classList.remove('is-closing');
        modal.classList.add('is-open');

        if (document.body) {
            document.body.classList.add('preventa-confirm-open');
        }

        const btnContinuar = modal.querySelector('#preventa-confirm-btn-continue');
        if (btnContinuar && typeof btnContinuar.focus === 'function') {
            try { btnContinuar.focus(); } catch (err) {}
        }
    }

    /**
     * Oculta la confirmación visual de preventa con animación suave de salida
     */
    function ocultarConfirmacionPreventa() {
        if (typeof document === 'undefined') return;

        const modal = document.getElementById('preventa-confirm-modal');
        if (!modal || !modal.classList.contains('is-open')) return;

        modal.classList.add('is-closing');
        modal.classList.remove('is-open');

        if (document.body) {
            document.body.classList.remove('preventa-confirm-open');
        }

        setTimeout(() => {
            if (!modal.classList.contains('is-open')) {
                modal.classList.remove('is-closing');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        }, 350);
    }

    /**
     * Sincroniza los contadores visuales del header y del menú drawer en la experiencia de preventa (FASE P4.8).
     */
    function actualizarBadgesHeaderPreventa() {
        if (typeof document === 'undefined') return;
        const total = obtenerCantidadReservaPreventa();
        const headerBadge = document.getElementById('reserva-header-count');
        if (headerBadge) {
            headerBadge.textContent = String(total);
            headerBadge.style.display = total > 0 ? 'inline-flex' : 'none';
        }
        const navBadge = document.getElementById('reserva-nav-badge');
        if (navBadge) {
            navBadge.textContent = String(total);
            navBadge.style.display = total > 0 ? 'inline-flex' : 'none';
        }
    }

    // Exportación pública
    const api = {
        STORAGE_KEY,
        ADELANTO_UNITARIO,
        agregarProductoPreventa,
        obtenerReservaPreventa,
        actualizarCantidadPreventa,
        eliminarProductoPreventa,
        vaciarReservaPreventa,
        calcularResumenPreventa,
        obtenerCantidadReservaPreventa,
        actualizarBadgesHeaderPreventa,
        mostrarConfirmacionPreventa,
        ocultarConfirmacionPreventa,
        mostrarConfirmacion: mostrarConfirmacionPreventa,
        ocultarConfirmacion: ocultarConfirmacionPreventa,
        validarStockProducto,
        obtenerMensajeStockSuperado,
        mostrarAlertaStockPreventa
    };

    // Registro en global/window para uso directo en navegador
    if (typeof global !== 'undefined') {
        global.PreventaCart = api;
        global.agregarProductoPreventa = agregarProductoPreventa;
        global.obtenerReservaPreventa = obtenerReservaPreventa;
        global.actualizarCantidadPreventa = actualizarCantidadPreventa;
        global.eliminarProductoPreventa = eliminarProductoPreventa;
        global.vaciarReservaPreventa = vaciarReservaPreventa;
        global.calcularResumenPreventa = calcularResumenPreventa;
        global.obtenerCantidadReservaPreventa = obtenerCantidadReservaPreventa;
        global.actualizarBadgesHeaderPreventa = actualizarBadgesHeaderPreventa;
        global.mostrarConfirmacionPreventa = mostrarConfirmacionPreventa;
        global.ocultarConfirmacionPreventa = ocultarConfirmacionPreventa;
        global.mostrarConfirmacion = mostrarConfirmacionPreventa;
        global.ocultarConfirmacion = ocultarConfirmacionPreventa;
        global.validarStockProducto = validarStockProducto;
        global.obtenerMensajeStockSuperado = obtenerMensajeStockSuperado;
        global.mostrarAlertaStockPreventa = mostrarAlertaStockPreventa;
    }

    // Auto-sincronización en entorno de navegador
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', actualizarBadgesHeaderPreventa);
        } else {
            actualizarBadgesHeaderPreventa();
        }
        window.addEventListener('dunes:preventa-cart-updated', actualizarBadgesHeaderPreventa);
    }

    // Compatibilidad CommonJS para Node.js y pruebas unitarias
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    return api;
})(typeof window !== 'undefined' ? window : globalThis);
