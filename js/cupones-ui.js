/**
 * Dunes Parfums - Interfaz de Usuario para Cupones de Descuento
 * 
 * Gestiona la interacción visual del usuario con el bloque de cupones,
 * la aplicación por botón / Enter, estados de carga, mensajes de feedback
 * y sincronización con el checkout.
 */

const CuponesUI = (function () {
    let inicializado = false;
    let esAplicando = false;

    /**
     * Mapea los estados técnicos devueltos por el motor C2 en mensajes claros para el usuario
     * @param {Object} resultado 
     * @returns {string}
     */
    function obtenerMensajeUsuario(resultado) {
        if (!resultado) return '';
        const estado = resultado.estado;

        switch (estado) {
            case 'codigo_vacio':
                return 'Ingresa un código de cupón.';
            case 'cupon_no_encontrado':
                return 'El código ingresado no es válido.';
            case 'cupon_inactivo':
                return 'Este cupón no se encuentra disponible.';
            case 'cupon_no_iniciado':
                return 'Este cupón todavía no está disponible.';
            case 'cupon_vencido':
                return 'Este cupón ya venció.';
            case 'fecha_invalida':
            case 'tipo_invalido':
            case 'valor_invalido':
                return 'No pudimos validar este cupón.';
            case 'carrito_vacio':
                return 'Agrega productos antes de aplicar un cupón.';
            case 'sin_productos_elegibles':
                return 'Este cupón no aplica a los productos de tu pedido.';
            case 'monto_minimo_no_alcanzado':
                if (resultado.montoFaltante && resultado.montoFaltante > 0) {
                    return `Te falta${resultado.montoFaltante === 1 ? '' : 'n'} S/ ${resultado.montoFaltante.toFixed(2)} en productos elegibles para usar este cupón.`;
                }
                return 'El pedido no alcanza la compra mínima para este cupón.';
            case 'error_servicio':
                return 'No pudimos consultar los cupones. Inténtalo nuevamente.';
            case 'cupon_valido':
                return 'Cupón aplicado correctamente.';
            default:
                return resultado.mensaje || 'Ocurrió una novedad con el cupón.';
        }
    }

    /**
     * Sincroniza la interfaz gráfica con el estado actual del cupón
     * @param {Object} [estadoCheckout] 
     */
    function sincronizarInterfazCupon(estadoCheckout = null) {
        const inputCode = document.getElementById('coupon-code');
        const applyBtn = document.getElementById('coupon-apply-btn');
        const feedbackBox = document.getElementById('coupon-feedback');
        const appliedStateBox = document.getElementById('coupon-applied-state');
        const appliedCodeSpan = document.getElementById('coupon-applied-code');
        const appliedSavingSpan = document.getElementById('coupon-applied-saving');
        const entryRow = document.getElementById('coupon-entry-row');

        if (!inputCode || !applyBtn) return;

        const estado = estadoCheckout || (window.cuponesCheckout ? window.cuponesCheckout.obtenerEstado() : null);
        if (!estado) return;

        const resultado = estado.resultado;
        const estaAplicado = estado.aplicado && resultado && resultado.valido;

        if (estaAplicado) {
            // Estado: CUPÓN VÁLIDO Y APLICADO
            if (entryRow) entryRow.style.display = 'none';
            if (appliedStateBox) appliedStateBox.style.display = 'flex';

            if (appliedCodeSpan) appliedCodeSpan.textContent = resultado.codigo;
            if (appliedSavingSpan) {
                appliedSavingSpan.textContent = resultado.descuento > 0
                    ? `(Ahorras S/ ${resultado.descuento.toFixed(2)})`
                    : '';
            }

            if (feedbackBox) {
                feedbackBox.style.display = 'none';
                feedbackBox.className = 'coupon-feedback';
            }

            inputCode.value = resultado.codigo;
        } else if (resultado && ['monto_minimo_no_alcanzado', 'sin_productos_elegibles', 'cupon_no_iniciado', 'error_servicio'].includes(resultado.estado)) {
            // Estado: CUPÓN PERSISTIDO O INGRESADO PERO TEMPORALMENTE INVÁLIDO
            if (entryRow) entryRow.style.display = 'flex';
            if (appliedStateBox) appliedStateBox.style.display = 'none';

            inputCode.value = resultado.codigo || estado.codigo || '';

            if (feedbackBox) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'coupon-feedback feedback-warning';
                feedbackBox.textContent = obtenerMensajeUsuario(resultado);
            }
        } else if (resultado && !resultado.valido && resultado.estado !== 'codigo_vacio') {
            // Estado: ERROR O INVÁLIDO PERMANENTE TRAS INTENTO DE APLICACIÓN
            if (entryRow) entryRow.style.display = 'flex';
            if (appliedStateBox) appliedStateBox.style.display = 'none';

            inputCode.value = resultado.codigo || '';

            if (feedbackBox) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'coupon-feedback feedback-error';
                feedbackBox.textContent = obtenerMensajeUsuario(resultado);
            }
        } else {
            // Estado: SIN CUPÓN O CÓDIGO VACÍO
            if (entryRow) entryRow.style.display = 'flex';
            if (appliedStateBox) appliedStateBox.style.display = 'none';

            if (!estado.codigo) {
                inputCode.value = '';
            }

            if (feedbackBox) {
                feedbackBox.style.display = 'none';
                feedbackBox.className = 'coupon-feedback';
                feedbackBox.textContent = '';
            }
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    /**
     * Ejecuta el proceso de validación al presionar el botón o tecla Enter
     */
    async function ejecutarAplicacionCupon() {
        if (esAplicando) return;

        const inputCode = document.getElementById('coupon-code');
        const applyBtn = document.getElementById('coupon-apply-btn');
        const feedbackBox = document.getElementById('coupon-feedback');

        if (!inputCode || !applyBtn) return;

        const codigo = inputCode.value.trim();
        if (!codigo) {
            sincronizarInterfazCupon({
                aplicado: false,
                resultado: { valido: false, estado: 'codigo_vacio', mensaje: 'Ingresa un código de cupón.' }
            });
            return;
        }

        esAplicando = true;
        inputCode.disabled = true;
        applyBtn.disabled = true;
        const textoOriginalBtn = applyBtn.textContent;
        applyBtn.textContent = 'Validando...';
        applyBtn.setAttribute('aria-busy', 'true');

        if (feedbackBox) {
            feedbackBox.style.display = 'none';
        }

        try {
            if (window.cuponesCheckout && typeof window.cuponesCheckout.aplicarCupon === 'function') {
                const resultado = await window.cuponesCheckout.aplicarCupon(codigo);
                const estadoActual = window.cuponesCheckout.obtenerEstado();
                sincronizarInterfazCupon(estadoActual);
            }
        } catch (error) {
            console.error('[CuponesUI] Error al aplicar el cupón:', error);
            if (feedbackBox) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'coupon-feedback feedback-error';
                feedbackBox.textContent = 'No pudimos validar el cupón. Inténtalo nuevamente.';
            }
        } finally {
            esAplicando = false;
            inputCode.disabled = false;
            applyBtn.disabled = false;
            applyBtn.textContent = textoOriginalBtn;
            applyBtn.removeAttribute('aria-busy');
        }
    }

    /**
     * Inicializa los listeners y componentes de la interfaz de cupones una sola vez
     */
    function inicializar() {
        if (inicializado) return;

        const couponSection = document.getElementById('coupon-section');
        const inputCode = document.getElementById('coupon-code');
        const applyBtn = document.getElementById('coupon-apply-btn');
        const removeBtn = document.getElementById('coupon-remove-btn');

        if (!couponSection || !inputCode || !applyBtn) return;

        inicializado = true;

        // Convertir automáticamente a mayúsculas mientras se escribe
        inputCode.addEventListener('input', (e) => {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.toUpperCase();
            e.target.setSelectionRange(start, end);
        });

        // Aplicar con Clic en Botón
        applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ejecutarAplicacionCupon();
        });

        // Aplicar con Tecla Enter en Input
        inputCode.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                ejecutarAplicacionCupon();
            }
        });

        // Quitar Cupón con Clic en Botón Quitar
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.cuponesCheckout && typeof window.cuponesCheckout.quitarCupon === 'function') {
                    const nuevoEstado = window.cuponesCheckout.quitarCupon();
                    sincronizarInterfazCupon(nuevoEstado);
                }
            });
        }

        // Sincronización inicial
        sincronizarInterfazCupon();
    }

    return {
        inicializar,
        sincronizarInterfazCupon
    };
})();

window.cuponesUI = CuponesUI;

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coupon-section')) {
        window.cuponesUI.inicializar();
    }
});
