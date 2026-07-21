/**
 * Dunes Parfums - WhatsApp Integration Module
 * Define el número de contacto de la tienda y proporciona utilidades
 * para construir enlaces de comunicación directa.
 */

// Número oficial de WhatsApp en formato internacional (Perú: 51986510573)
const WHATSAPP_PHONE = '51986510573';

/**
 * Obtiene el enlace directo de WhatsApp con un mensaje opcional
 * @param {string} mensaje - Mensaje codificado para enviar
 * @returns {string} - URL de WhatsApp
 */
function obtenerEnlaceWhatsApp(mensaje = '') {
    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${textoCodificado}`;
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
    const mensaje = `Hola, Dunes Parfums 👋\nMe gustaría consultar la disponibilidad del perfume:\nMarca: ${marca}\nNombre: ${nombre}\nPresentación: ${presentacion}.`;
    enviarMensajeWhatsApp(mensaje);
}

/**
 * Construye el mensaje estructurado de checkout y redirige al chat oficial de WhatsApp
 * Soporta tanto el objeto de pedido consolidado de la Fase 8/9 como los parámetros heredados.
 */
function enviarPedidoWhatsApp(itemsOrPedido, total, cliente) {
    let items, subtotalProductos, datosEntrega, costoEntrega, totalFinal;
    
    if (itemsOrPedido && itemsOrPedido.productos) {
        // Consolidated object format from Phase 8/9
        const pedido = itemsOrPedido;
        items = pedido.productos;
        subtotalProductos = pedido.subtotalProductos;
        datosEntrega = pedido.datosEntrega;
        costoEntrega = pedido.costoEntrega;
        totalFinal = pedido.totalFinal;
    } else {
        // Fallback backward compatible format
        items = itemsOrPedido;
        subtotalProductos = total;
        datosEntrega = cliente;
        costoEntrega = cliente ? cliente.costoEntrega : 0;
        totalFinal = cliente ? cliente.totalFinal : total;
    }
    
    // Validation before opening WhatsApp
    const showCheckoutError = () => {
        const errorContainer = document.getElementById('checkout-error-msg');
        if (errorContainer) {
            errorContainer.textContent = "No fue posible abrir WhatsApp. Revisa los datos del pedido e inténtalo nuevamente.";
            errorContainer.style.display = 'block';
        } else if (window.carritoModulo && typeof window.carritoModulo.mostrarToastPremium === 'function') {
            window.carritoModulo.mostrarToastPremium("No fue posible abrir WhatsApp. Revisa los datos del pedido e inténtalo nuevamente.", true);
        }
    };

    if (!items || items.length === 0 || !datosEntrega || !datosEntrega.tipoEntrega ||
        typeof subtotalProductos !== 'number' || isNaN(subtotalProductos) ||
        typeof totalFinal !== 'number' || isNaN(totalFinal)) {
        console.error("No se puede abrir WhatsApp: Datos del pedido inválidos o incompletos.");
        showCheckoutError();
        return;
    }

    let mensaje = `Hola, *Dunes Parfums* 👋\n\n`;
    mensaje += `Deseo realizar el siguiente pedido:\n\n`;
    
    // SECTION: Products
    mensaje += `*🛍️ PRODUCTOS*\n\n`;
    items.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        let presentacionTexto = `${item.tamanoMl}`;
        if (item.presentacion) {
            const match = item.presentacion.match(/(\d+)\s*ml/i);
            if (match) {
                presentacionTexto = `${match[1]}`;
            } else {
                presentacionTexto = item.presentacion.replace('Sellado / ', '').replace('Decant ', '').replace(' ml', '');
            }
        }
        presentacionTexto = presentacionTexto.trim();
        if (!presentacionTexto.toLowerCase().endsWith('ml')) {
            presentacionTexto += ' ml';
        }
        mensaje += `• ${item.cantidad} x ${item.nombre} — ${presentacionTexto} — S/${subtotal.toFixed(2)}\n`;
    });
    mensaje += `\n`;
    
    // SECTION: Delivery/Entrega
    if (datosEntrega.tipoEntrega === 'delivery-local') {
        mensaje += `*🚚 ENTREGA*\n\n`;
        mensaje += `Delivery local\n`;
        let nombreZona = datosEntrega.nombreZona;
        if (!nombreZona && datosEntrega.zona) {
            const zonaFormateada = datosEntrega.zona.charAt(0).toUpperCase() + datosEntrega.zona.slice(1).replace('-', ' ');
            nombreZona = datosEntrega.zona === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
        }
        mensaje += `Zona: ${nombreZona}\n`;
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        mensaje += `Dirección: ${datosEntrega.direccion}\n`;
        
        // Reference is optional and only printed if set
        if (datosEntrega.referencia && datosEntrega.referencia.trim()) {
            mensaje += `Referencia: ${datosEntrega.referencia.trim()}\n`;
        }
        
        const costoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Costo de delivery: ${costoTexto}\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'agencia') {
        mensaje += `*📦 ENTREGA*\n\n`;
        mensaje += `Envío por agencia\n`;
        const cargoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Embalaje y llevada: ${cargoTexto}\n\n`;
        mensaje += `_Coordinaremos los datos del envío por WhatsApp._\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'recojo-local') {
        mensaje += `*📍 ENTREGA*\n\n`;
        mensaje += `Recojo en local\n`;
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        
        const costoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Costo de entrega: ${costoTexto}\n\n`;
        mensaje += `_Coordinaremos el horario de recojo por WhatsApp._\n\n`;
    }
    
    // SECTION: Total and footer
    mensaje += `*💰 TOTAL A PAGAR: S/${totalFinal.toFixed(2)}*\n\n`;
    mensaje += `_Quedo atento para confirmar mi pedido._`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    if (!mensaje || !mensaje.trim() || !mensajeCodificado) {
        console.error("No se puede abrir WhatsApp: Mensaje vacío.");
        showCheckoutError();
        return;
    }
    const urlWhatsapp = `https://wa.me/51986510573?text=${mensajeCodificado}`;
    
    try {
        const win = window.open(urlWhatsapp, "_blank", "noopener,noreferrer");
        if (!win) {
            window.location.href = urlWhatsapp;
        }
    } catch (e) {
        window.location.href = urlWhatsapp;
    }
}

// Hacer disponibles las funciones en el ámbito global
window.whatsappConfig = {
    phone: WHATSAPP_PHONE,
    obtenerEnlaceWhatsApp,
    enviarMensajeWhatsApp,
    consultarDisponibilidad,
    enviarPedidoWhatsApp
};
