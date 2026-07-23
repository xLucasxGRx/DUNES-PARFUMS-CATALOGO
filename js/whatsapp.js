/**
 * Dunes Parfums - WhatsApp Integration Module
 * Define el número de contacto de la tienda y proporciona utilidades
 * para construir enlaces de comunicación directa.
 */

// Número oficial de WhatsApp en formato internacional (Perú: 51986510573)
const WHATSAPP_PHONE = '51986510573';

/**
 * Obtiene el enlace directo de WhatsApp con un mensaje opcional
 * @param {string} mensaje - Mensaje codificado o texto plano
 * @returns {string} - URL de WhatsApp
 */
function obtenerEnlaceWhatsApp(mensaje = '') {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Redirige a WhatsApp con un mensaje personalizado
 * @param {string} mensaje - Mensaje a enviar
 */
function enviarMensajeWhatsApp(mensaje) {
    const enlace = obtenerEnlaceWhatsApp(mensaje);
    window.open(enlace, '_blank', 'noopener,noreferrer');
}

/**
 * Construye y envía una consulta para un perfume específico
 * @param {string} nombre - Nombre del perfume
 * @param {string} marca - Marca del perfume
 * @param {string} presentacion - Tamaño o presentación
 */
function consultarDisponibilidad(nombre, marca, presentacion) {
    const mensaje = `Hola, Dunes Parfums\nMe gustaría consultar la disponibilidad del perfume:\nMarca: ${marca}\nNombre: ${nombre}\nPresentación: ${presentacion}.`;
    enviarMensajeWhatsApp(mensaje);
}

/**
 * Genera el cuerpo de texto del mensaje de pedido formateado para WhatsApp (sin emojis).
 * @param {Object} pedido 
 * @returns {string}
 */
function generarMensajeWhatsApp(pedido) {
    if (!pedido || !pedido.productos || pedido.productos.length === 0 || !pedido.datosEntrega) {
        return '';
    }

    const { productos: items, datosEntrega } = pedido;
    const subtotalBruto = typeof pedido.subtotalBruto === 'number'
        ? pedido.subtotalBruto
        : (typeof pedido.subtotalProductos === 'number' ? pedido.subtotalProductos : 0);

    const cuponAplicado = (pedido.cuponAplicado && (pedido.descuento > 0)) ? pedido.cuponAplicado : null;
    const descuento = cuponAplicado ? (Number(pedido.descuento) || 0) : 0;
    const subtotalNeto = cuponAplicado ? Math.max(0, subtotalBruto - descuento) : subtotalBruto;
    const costoEntrega = Number(pedido.costoEntrega) || 0;
    const totalFinal = typeof pedido.totalFinal === 'number' ? pedido.totalFinal : (subtotalNeto + costoEntrega);

    let mensaje = `Hola, *Dunes Parfums*\n\n`;
    mensaje += `Deseo realizar el siguiente pedido:\n\n`;

    // SECCIÓN: PRODUCTOS
    mensaje += `*PRODUCTOS*\n\n`;
    items.forEach(item => {
        const cant = Number(item.cantidad) || 1;
        const precioUnit = Number(item.precioUnitario ?? item.precio) || 0;
        const subtotal = cant * precioUnit;
        let presentacionTexto = item.tamanoMl ? `${item.tamanoMl}` : '';
        if (item.presentacion) {
            const match = item.presentacion.match(/(\d+)\s*ml/i);
            if (match) {
                presentacionTexto = `${match[1]}`;
            } else {
                presentacionTexto = item.presentacion.replace('Sellado / ', '').replace('Decant ', '').replace(' ml', '');
            }
        }
        presentacionTexto = presentacionTexto.trim();
        if (presentacionTexto && !presentacionTexto.toLowerCase().endsWith('ml')) {
            presentacionTexto += ' ml';
        }
        const detallePres = presentacionTexto ? ` — ${presentacionTexto}` : '';
        mensaje += `• ${cant} x ${item.nombre}${detallePres} — S/${subtotal.toFixed(2)}\n`;
    });
    mensaje += `\n`;

    // SECCIÓN: RESUMEN Y CUPÓN
    mensaje += `*RESUMEN DEL PEDIDO*\n\n`;
    mensaje += `Subtotal de productos: S/${subtotalBruto.toFixed(2)}\n`;

    if (cuponAplicado && descuento > 0) {
        mensaje += `Cupón aplicado: ${cuponAplicado.codigo}\n`;
        mensaje += `Descuento: -S/${descuento.toFixed(2)}\n`;
        mensaje += `Subtotal con descuento: S/${subtotalNeto.toFixed(2)}\n`;
    }

    const costoTexto = costoEntrega === 0 ? 'GRATIS' : `S/${costoEntrega.toFixed(2)}`;

    if (datosEntrega.tipoEntrega === 'delivery-local') {
        let nombreZona = datosEntrega.nombreZona;
        if (!nombreZona && datosEntrega.zona) {
            const zonaFormateada = datosEntrega.zona.charAt(0).toUpperCase() + datosEntrega.zona.slice(1).replace('-', ' ');
            nombreZona = datosEntrega.zona === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
        }
        mensaje += `Tipo de entrega: Delivery local (${nombreZona || 'Local'})\n`;
        mensaje += `Costo de entrega: ${costoTexto}\n`;
    } else if (datosEntrega.tipoEntrega === 'agencia') {
        mensaje += `Tipo de entrega: Envío por agencia\n`;
        mensaje += `Embalaje y llevada: ${costoTexto}\n`;
    } else if (datosEntrega.tipoEntrega === 'recojo-local') {
        mensaje += `Tipo de entrega: Recojo en local\n`;
        mensaje += `Costo de entrega: ${costoTexto}\n`;
    }

    mensaje += `*TOTAL DEL PEDIDO: S/${totalFinal.toFixed(2)}*\n\n`;

    // SECCIÓN: DATOS DEL CLIENTE
    mensaje += `*DATOS DEL CLIENTE*\n\n`;
    if (datosEntrega.tipoEntrega === 'delivery-local') {
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        mensaje += `Dirección: ${datosEntrega.direccion}\n`;
        if (datosEntrega.referencia && datosEntrega.referencia.trim()) {
            mensaje += `Referencia: ${datosEntrega.referencia.trim()}\n`;
        }
    } else if (datosEntrega.tipoEntrega === 'agencia') {
        mensaje += `_Coordinaremos los datos del envío por agencia por WhatsApp._\n`;
    } else if (datosEntrega.tipoEntrega === 'recojo-local') {
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        mensaje += `_Coordinaremos el horario de recojo por WhatsApp._\n`;
    }

    mensaje += `\n_Quedo atento para confirmar mi pedido._`;

    return mensaje;
}

/**
 * Construye el mensaje estructurado de checkout y redirige al chat oficial de WhatsApp
 * @param {Object} itemsOrPedido 
 * @param {number} [total] 
 * @param {Object} [cliente] 
 */
function enviarPedidoWhatsApp(itemsOrPedido, total, cliente) {
    let pedido;

    if (itemsOrPedido && itemsOrPedido.productos) {
        pedido = itemsOrPedido;
    } else {
        const items = itemsOrPedido;
        const datosEntrega = cliente;
        const subtotalBruto = total;
        const costoEntrega = cliente ? (cliente.costoEntrega || 0) : 0;
        const totalFinal = cliente ? (cliente.totalFinal || total) : total;

        pedido = {
            productos: items,
            subtotalBruto,
            subtotalProductos: subtotalBruto,
            costoEntrega,
            totalFinal,
            datosEntrega
        };
    }

    const showCheckoutError = (msg = "No fue posible abrir WhatsApp. Revisa los datos del pedido e inténtalo nuevamente.") => {
        const errorContainer = document.getElementById('checkout-error-msg');
        if (errorContainer) {
            errorContainer.textContent = msg;
            errorContainer.style.display = 'block';
        } else if (window.carritoModulo && typeof window.carritoModulo.mostrarToastPremium === 'function') {
            window.carritoModulo.mostrarToastPremium(msg, true);
        }
    };

    if (!pedido || !pedido.productos || pedido.productos.length === 0 || !pedido.datosEntrega || !pedido.datosEntrega.tipoEntrega) {
        console.error("No se puede abrir WhatsApp: Datos del pedido inválidos o incompletos.");
        showCheckoutError();
        return;
    }

    const mensaje = generarMensajeWhatsApp(pedido);
    if (!mensaje || !mensaje.trim()) {
        console.error("No se puede abrir WhatsApp: Mensaje vacío.");
        showCheckoutError();
        return;
    }

    const urlWhatsapp = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`;

    if (urlWhatsapp.includes("%EF%BF%BD") || urlWhatsapp.includes("\uFFFD")) {
        console.error("La URL contiene el carácter de reemplazo Unicode corrupto %EF%BF%BD / U+FFFD");
        showCheckoutError("No fue posible preparar correctamente el mensaje.");
        return;
    }

    try {
        const win = window.open(urlWhatsapp, "_blank", "noopener,noreferrer");
        if (!win) {
            window.location.href = urlWhatsapp;
        }
    } catch (e) {
        window.location.href = urlWhatsapp;
    }
}

// Export global variables & methods
window.whatsappConfig = {
    phone: WHATSAPP_PHONE,
    obtenerEnlaceWhatsApp,
    enviarMensajeWhatsApp,
    consultarDisponibilidad,
    enviarPedidoWhatsApp,
    generarMensajeWhatsApp
};
