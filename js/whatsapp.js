/**
 * Dunes Parfums - WhatsApp Integration Module
 * Define el número de contacto de la tienda y proporciona utilidades
 * para construir enlaces de comunicación directa.
 */

// Número oficial de WhatsApp en formato internacional (Perú: 51986510573)
const WHATSAPP_PHONE = '51986510573';

// Secuencias de escape UTF-8 URL exactas para los emojis (reemplazo post-encodeURIComponent)
const EMOJIS_URL = Object.freeze({
    SALUDO: "%F0%9F%91%8B",            // 👋
    PRODUCTOS: "%F0%9F%9B%8D%EF%B8%8F", // 🛍️
    DELIVERY: "%F0%9F%9A%9A",         // 🚚
    AGENCIA: "%F0%9F%93%A6",          // 📦
    RECOJO: "%F0%9F%93%8D",           // 📍
    TOTAL: "%F0%9F%92%B0"             // 💰
});

/**
 * Reemplaza los marcadores ASCII codificados por sus secuencias UTF-8 URL exactas
 * @param {string} textoCodificado 
 * @returns {string}
 */
function insertarEmojisEnMensajeCodificado(textoCodificado) {
    return textoCodificado
        .replaceAll(encodeURIComponent("{{SALUDO}}"), EMOJIS_URL.SALUDO)
        .replaceAll(encodeURIComponent("{{PRODUCTOS}}"), EMOJIS_URL.PRODUCTOS)
        .replaceAll(encodeURIComponent("{{DELIVERY}}"), EMOJIS_URL.DELIVERY)
        .replaceAll(encodeURIComponent("{{AGENCIA}}"), EMOJIS_URL.AGENCIA)
        .replaceAll(encodeURIComponent("{{RECOJO}}"), EMOJIS_URL.RECOJO)
        .replaceAll(encodeURIComponent("{{TOTAL}}"), EMOJIS_URL.TOTAL);
}

/**
 * Obtiene el enlace directo de WhatsApp con un mensaje opcional
 * @param {string} mensaje - Mensaje codificado o texto plano
 * @returns {string} - URL de WhatsApp
 */
function obtenerEnlaceWhatsApp(mensaje = '') {
    const textoCodificado = encodeURIComponent(mensaje);
    const textoConEmojis = insertarEmojisEnMensajeCodificado(textoCodificado);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${textoConEmojis}`;
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
    const mensaje = `Hola, Dunes Parfums {{SALUDO}}\nMe gustaría consultar la disponibilidad del perfume:\nMarca: ${marca}\nNombre: ${nombre}\nPresentación: ${presentacion}.`;
    enviarMensajeWhatsApp(mensaje);
}

/**
 * Genera el cuerpo de texto del mensaje de pedido formateado para WhatsApp usando marcadores ASCII.
 * @param {Object} pedido 
 * @returns {string}
 */
function generarMensajeWhatsAppConMarcadores(pedido) {
    let items, subtotalProductos, datosEntrega, costoEntrega, totalFinal;
    
    if (pedido && pedido.productos) {
        items = pedido.productos;
        subtotalProductos = pedido.subtotalProductos;
        datosEntrega = pedido.datosEntrega;
        costoEntrega = pedido.costoEntrega;
        totalFinal = pedido.totalFinal;
    } else {
        return '';
    }
    
    if (!items || items.length === 0 || !datosEntrega || !datosEntrega.tipoEntrega) {
        return '';
    }
    
    let mensaje = `Hola, *Dunes Parfums* {{SALUDO}}\n\n`;
    mensaje += `Deseo realizar el siguiente pedido:\n\n`;
    
    // SECTION: Products
    mensaje += `*{{PRODUCTOS}} PRODUCTOS*\n\n`;
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
        mensaje += `*{{DELIVERY}} ENTREGA*\n\n`;
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
        
        if (datosEntrega.referencia && datosEntrega.referencia.trim()) {
            mensaje += `Referencia: ${datosEntrega.referencia.trim()}\n`;
        }
        
        const costoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Costo de delivery: ${costoTexto}\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'agencia') {
        mensaje += `*{{AGENCIA}} ENTREGA*\n\n`;
        mensaje += `Envío por agencia\n`;
        const cargoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Embalaje y llevada: ${cargoTexto}\n\n`;
        mensaje += `_Coordinaremos los datos del envío por WhatsApp._\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'recojo-local') {
        mensaje += `*{{RECOJO}} ENTREGA*\n\n`;
        mensaje += `Recojo en local\n`;
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        
        const costoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Costo de entrega: ${costoTexto}\n\n`;
        mensaje += `_Coordinaremos el horario de recojo por WhatsApp._\n\n`;
    }
    
    // SECTION: Total and footer
    mensaje += `*{{TOTAL}} TOTAL A PAGAR: S/${totalFinal.toFixed(2)}*\n\n`;
    mensaje += `_Quedo atento para confirmar mi pedido._`;
    
    return mensaje;
}

/**
 * Construye el mensaje estructurado de checkout y redirige al chat oficial de WhatsApp
 * @param {Object} itemsOrPedido 
 * @param {number} [total] 
 * @param {Object} [cliente] 
 */
function enviarPedidoWhatsApp(itemsOrPedido, total, cliente) {
    let items, subtotalProductos, datosEntrega, costoEntrega, totalFinal;
    
    if (itemsOrPedido && itemsOrPedido.productos) {
        const pedido = itemsOrPedido;
        items = pedido.productos;
        subtotalProductos = pedido.subtotalProductos;
        datosEntrega = pedido.datosEntrega;
        costoEntrega = pedido.costoEntrega;
        totalFinal = pedido.totalFinal;
    } else {
        items = itemsOrPedido;
        subtotalProductos = total;
        datosEntrega = cliente;
        costoEntrega = cliente ? cliente.costoEntrega : 0;
        totalFinal = cliente ? cliente.totalFinal : total;
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

    if (!items || items.length === 0 || !datosEntrega || !datosEntrega.tipoEntrega ||
        typeof subtotalProductos !== 'number' || isNaN(subtotalProductos) ||
        typeof totalFinal !== 'number' || isNaN(totalFinal)) {
        console.error("No se puede abrir WhatsApp: Datos del pedido inválidos o incompletos.");
        showCheckoutError();
        return;
    }

    const pedido = {
        productos: items,
        subtotalProductos,
        datosEntrega,
        costoEntrega,
        totalFinal
    };

    const mensajeConMarcadores = generarMensajeWhatsAppConMarcadores(pedido);
    if (!mensajeConMarcadores || !mensajeConMarcadores.trim()) {
        console.error("No se puede abrir WhatsApp: Mensaje vacío.");
        showCheckoutError();
        return;
    }

    // 1. Encode main text to URI percent-encoding
    const mensajeCodificado = encodeURIComponent(mensajeConMarcadores);

    // 2. Replace ASCII placeholders with exact byte UTF-8 hex sequences
    const mensajeFinalCodificado = insertarEmojisEnMensajeCodificado(mensajeCodificado);

    // 3. Construct WhatsApp URL directly (WITHOUT double encoding / URLSearchParams)
    const urlWhatsapp = `https://wa.me/${WHATSAPP_PHONE}?text=${mensajeFinalCodificado}`;

    // 4. Strict validation checks before opening WhatsApp
    if (urlWhatsapp.includes("%EF%BF%BD") || urlWhatsapp.includes("\uFFFD")) {
        console.error("La URL contiene el carácter de reemplazo Unicode corrupto %EF%BF%BD / U+FFFD");
        showCheckoutError("No fue posible preparar correctamente el mensaje.");
        return;
    }

    if (urlWhatsapp.includes("%7B%7B") || urlWhatsapp.includes("%7D%7D")) {
        console.error("La URL contiene marcadores sin reemplazar");
        showCheckoutError("No fue posible completar el formato del mensaje.");
        return;
    }

    if (urlWhatsapp.includes("%25F0%259F")) {
        console.error("Se detectó doble codificación URI en la URL de WhatsApp");
        showCheckoutError("Error al codificar el enlace del pedido.");
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
    insertarEmojisEnMensajeCodificado,
    generarMensajeWhatsAppConMarcadores
};
