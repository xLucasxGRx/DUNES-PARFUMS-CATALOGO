/**
 * Dunes Parfums - Motor de Validación y Cálculo Comercial de Cupones
 * 
 * Módulo puro desacoplado del DOM y del almacenamiento persistente.
 * Calcula elegibilidad, descuentos porcentuales y fijos, montos mínimos
 * y vigencia de cupones.
 */

const CuponesModulo = (function () {
    /**
     * Redondea un monto a 2 decimales evitando errores de imprecisión flotante
     * @param {number} monto 
     * @returns {number}
     */
    function redondearMoneda(monto) {
        const num = Number(monto);
        if (!Number.isFinite(num)) return 0;
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    /**
     * Parsea una cadena de fecha YYYY-MM-DD como Date local evitando desfasajes UTC
     * @param {string} fechaStr 
     * @param {boolean} esFinDeDia 
     * @returns {Date|null}
     */
    function parsearFechaLocal(fechaStr, esFinDeDia = false) {
        if (!fechaStr || typeof fechaStr !== 'string') return null;
        const match = fechaStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return null;
        const año = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1;
        const dia = parseInt(match[3], 10);

        if (isNaN(año) || isNaN(mes) || isNaN(dia)) return null;

        if (esFinDeDia) {
            return new Date(año, mes, dia, 23, 59, 59, 999);
        }
        return new Date(año, mes, dia, 0, 0, 0, 0);
    }

    /**
     * Obtiene el subtotal acumulado de los ítems del carrito que son elegibles para el cupón
     * @param {Object} cupon 
     * @param {Array} items 
     * @returns {number}
     */
    function obtenerSubtotalElegible(cupon, items = []) {
        if (!cupon || !Array.isArray(items) || items.length === 0) {
            return 0;
        }

        const alcance = String(cupon.alcance || 'todos').trim().toLowerCase();
        let subtotalElegible = 0;

        for (const item of items) {
            if (!item) continue;
            const precio = Number(item.precioUnitario ?? item.precio ?? 0);
            const cantidad = Number(item.cantidad || 0);
            if (precio <= 0 || cantidad <= 0) continue;

            const subtotalItem = redondearMoneda(precio * cantidad);

            if (alcance === 'todos') {
                subtotalElegible += subtotalItem;
            } else if (alcance === 'categorias') {
                const catItem = (typeof normalizarTexto === 'function' ? normalizarTexto(item.categoria) : String(item.categoria || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                const permitidas = (cupon.categoriasPermitidas || []).map(c => (typeof normalizarTexto === 'function' ? normalizarTexto(c) : String(c || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
                if (permitidas.includes(catItem)) {
                    subtotalElegible += subtotalItem;
                }
            } else if (alcance === 'productos') {
                const idProdItem = String(item.idProducto || item.id || '').trim().toLowerCase();
                const permitidos = (cupon.productosPermitidos || []).map(p => String(p).trim().toLowerCase());
                if (permitidos.includes(idProdItem)) {
                    subtotalElegible += subtotalItem;
                }
            }
        }

        return redondearMoneda(subtotalElegible);
    }

    /**
     * Calcula el monto final del descuento aplicable según el tipo y límites del cupón
     * @param {Object} cupon 
     * @param {number} subtotalElegible 
     * @returns {number}
     */
    function calcularDescuento(cupon, subtotalElegible) {
        const subtotal = redondearMoneda(subtotalElegible);
        if (!cupon || subtotal <= 0) return 0;

        const tipo = String(cupon.tipo || '').trim().toLowerCase();
        const valor = Number(cupon.valor || 0);
        if (valor <= 0) return 0;

        let descuentoBruto = 0;

        if (tipo === 'porcentaje') {
            if (valor > 100) return 0;
            descuentoBruto = redondearMoneda(subtotal * (valor / 100));
        } else if (tipo === 'monto_fijo') {
            descuentoBruto = redondearMoneda(valor);
        } else {
            return 0;
        }

        let descuentoFinal = Math.min(descuentoBruto, subtotal);

        if (cupon.descuentoMaximo !== null && cupon.descuentoMaximo !== undefined) {
            const maximo = Number(cupon.descuentoMaximo);
            if (Number.isFinite(maximo) && maximo > 0) {
                descuentoFinal = Math.min(descuentoFinal, maximo);
            }
        }

        return redondearMoneda(descuentoFinal);
    }

    /**
     * Valida un objeto de cupón contra un contexto de carrito y fecha
     * @param {Object} cupon 
     * @param {Object} contexto 
     * @returns {Object} Resultado estructurado de validación
     */
    function validarCupon(cupon, contexto = {}) {
        const items = Array.isArray(contexto.items) ? contexto.items : [];
        const fechaActual = contexto.fechaActual instanceof Date ? contexto.fechaActual : new Date();

        const subtotalBrutoCalculado = items.reduce((acc, item) => {
            if (!item) return acc;
            const p = Number(item.precioUnitario ?? item.precio ?? 0);
            const c = Number(item.cantidad || 0);
            return acc + (p * c);
        }, 0);

        const subtotalBruto = redondearMoneda(contexto.subtotalBruto ?? subtotalBrutoCalculado);

        const crearRespuesta = (valido, estado, mensaje, datosExtra = {}) => {
            const subElegible = datosExtra.subtotalElegible ?? 0;
            const desc = datosExtra.descuento ?? 0;
            const subNeto = redondearMoneda(Math.max(0, subtotalBruto - desc));
            const faltante = datosExtra.montoFaltante ?? 0;

            return {
                valido,
                codigo: cupon ? cupon.codigo : (contexto.codigo || ''),
                estado,
                mensaje,
                cupon: cupon || null,
                subtotalBruto: redondearMoneda(subtotalBruto),
                subtotalElegible: redondearMoneda(subElegible),
                descuento: redondearMoneda(desc),
                subtotalNeto: redondearMoneda(subNeto),
                montoFaltante: redondearMoneda(Math.max(0, faltante))
            };
        };

        if (!cupon) {
            return crearRespuesta(false, 'cupon_no_encontrado', 'El código de cupón ingresado no existe.');
        }

        if (cupon.activo !== true) {
            return crearRespuesta(false, 'cupon_inactivo', 'El cupón no se encuentra activo.');
        }

        if (cupon.fechaInicio) {
            const fInicio = parsearFechaLocal(cupon.fechaInicio, false);
            if (!fInicio) {
                return crearRespuesta(false, 'fecha_invalida', 'La fecha de inicio del cupón es inválida.');
            }
            if (fechaActual < fInicio) {
                return crearRespuesta(false, 'cupon_no_iniciado', 'El cupón aún no está disponible.');
            }
        }

        if (cupon.fechaVencimiento) {
            const fVenc = parsearFechaLocal(cupon.fechaVencimiento, true);
            if (!fVenc) {
                return crearRespuesta(false, 'fecha_invalida', 'La fecha de vencimiento del cupón es inválida.');
            }
            if (fechaActual > fVenc) {
                return crearRespuesta(false, 'cupon_vencido', 'El cupón ha expirado.');
            }
        }

        if (items.length === 0 || subtotalBruto <= 0) {
            return crearRespuesta(false, 'carrito_vacio', 'Tu carrito está vacío para aplicar un cupón.');
        }

        const tipo = String(cupon.tipo || '').trim().toLowerCase();
        if (tipo !== 'porcentaje' && tipo !== 'monto_fijo') {
            return crearRespuesta(false, 'tipo_invalido', 'El tipo de cupón no es válido.');
        }

        const valor = Number(cupon.valor || 0);
        if (valor <= 0 || (tipo === 'porcentaje' && valor > 100)) {
            return crearRespuesta(false, 'valor_invalido', 'El valor del cupón es inválido.');
        }

        const subtotalElegible = obtenerSubtotalElegible(cupon, items);
        if (subtotalElegible <= 0) {
            return crearRespuesta(false, 'sin_productos_elegibles', 'El cupón no es aplicable a los productos de tu carrito.');
        }

        const montoMinimo = Number(cupon.montoMinimo || 0);
        if (montoMinimo > 0 && subtotalElegible < montoMinimo) {
            const montoFaltante = redondearMoneda(montoMinimo - subtotalElegible);
            return crearRespuesta(
                false,
                'monto_minimo_no_alcanzado',
                `El cupón requiere una compra mínima de S/ ${montoMinimo.toFixed(2)} en productos elegibles.`,
                { subtotalElegible, montoFaltante }
            );
        }

        const descuento = calcularDescuento(cupon, subtotalElegible);

        return crearRespuesta(
            true,
            'cupon_valido',
            'Cupón aplicado correctamente.',
            { subtotalElegible, descuento }
        );
    }

    /**
     * Normaliza un código y busca su validación a través del servicio de cupones
     * @param {string} codigo 
     * @param {Object} contexto 
     * @returns {Promise<Object>}
     */
    async function validarCuponPorCodigo(codigo, contexto = {}) {
        if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
            return {
                valido: false,
                codigo: '',
                estado: 'codigo_vacio',
                mensaje: 'Por favor, ingresa un código de cupón.',
                cupon: null,
                subtotalBruto: Number(contexto.subtotalBruto || 0),
                subtotalElegible: 0,
                descuento: 0,
                subtotalNeto: Number(contexto.subtotalBruto || 0),
                montoFaltante: 0
            };
        }

        const codigoNormalizado = codigo.trim().toUpperCase();

        if (!window.cuponesService || typeof window.cuponesService.buscarCuponPorCodigo !== 'function') {
            return {
                valido: false,
                codigo: codigoNormalizado,
                estado: 'error_servicio',
                mensaje: 'El servicio de cupones no está disponible en este momento.',
                cupon: null,
                subtotalBruto: Number(contexto.subtotalBruto || 0),
                subtotalElegible: 0,
                descuento: 0,
                subtotalNeto: Number(contexto.subtotalBruto || 0),
                montoFaltante: 0
            };
        }

        try {
            const cupon = await window.cuponesService.buscarCuponPorCodigo(codigoNormalizado);
            if (!cupon) {
                return {
                    valido: false,
                    codigo: codigoNormalizado,
                    estado: 'cupon_no_encontrado',
                    mensaje: 'El código de cupón ingresado no es válido.',
                    cupon: null,
                    subtotalBruto: Number(contexto.subtotalBruto || 0),
                    subtotalElegible: 0,
                    descuento: 0,
                    subtotalNeto: Number(contexto.subtotalBruto || 0),
                    montoFaltante: 0
                };
            }

            const contextoConCodigo = { ...contexto, codigo: codigoNormalizado };
            return validarCupon(cupon, contextoConCodigo);
        } catch (err) {
            console.error('[CuponesModulo] Error al validar cupón por código:', err);
            return {
                valido: false,
                codigo: codigoNormalizado,
                estado: 'error_servicio',
                mensaje: 'Ocurrió un error al procesar el cupón.',
                cupon: null,
                subtotalBruto: Number(contexto.subtotalBruto || 0),
                subtotalElegible: 0,
                descuento: 0,
                subtotalNeto: Number(contexto.subtotalBruto || 0),
                montoFaltante: 0
            };
        }
    }

    return {
        validarCupon,
        validarCuponPorCodigo,
        obtenerSubtotalElegible,
        calcularDescuento
    };
})();

window.cuponesModulo = CuponesModulo;
