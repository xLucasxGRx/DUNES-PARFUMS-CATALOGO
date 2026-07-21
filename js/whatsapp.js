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
    if (!items || items.length === 0) {
        console.error("No se puede abrir WhatsApp: El carrito está vacío.");
        return;
    }
    if (!datosEntrega || !datosEntrega.tipoEntrega) {
        console.error("No se puede abrir WhatsApp: Modalidad no seleccionada o inválida.");
        return;
    }
    if (typeof subtotalProductos !== 'number' || isNaN(subtotalProductos) ||
        typeof totalFinal !== 'number' || isNaN(totalFinal)) {
        console.error("No se puede abrir WhatsApp: Totales inválidos.");
        return;
    }

    let mensaje = `Hola, *Dunes Parfums* 👋\n\n`;
    mensaje += `Deseo realizar el siguiente pedido:\n\n`;
    
    mensaje += `*DETALLE DEL PEDIDO*\n`;
    mensaje += `--------------------\n\n`;
    
    items.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        const presentacionTexto = item.categoria === 'decants'
            ? `${item.tamanoMl} ml`
            : `Sellado / ${item.tamanoMl} ml`;
            
        mensaje += `*${index + 1}. ${item.nombre}*\n`;
        mensaje += `Marca: ${item.marca}\n`;
        mensaje += `Presentación: ${presentacionTexto}\n`;
        mensaje += `Cantidad: ${item.cantidad}\n`;
        mensaje += `Precio unitario: S/${item.precio.toFixed(2)}\n`;
        mensaje += `Subtotal: *S/${subtotal.toFixed(2)}*\n\n`;
    });
    
    mensaje += `*RESUMEN DEL PEDIDO*\n`;
    mensaje += `--------------------\n\n`;
    mensaje += `Subtotal de productos: S/${subtotalProductos.toFixed(2)}\n`;
    
    if (datosEntrega.tipoEntrega === 'delivery-local') {
        const costoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Delivery local: ${costoTexto}\n\n`;
        mensaje += `*TOTAL A PAGAR: S/${totalFinal.toFixed(2)}*\n\n`;
        
        mensaje += `*TIPO DE ENTREGA*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `🚚 Delivery local\n`;
        
        let nombreZona = datosEntrega.nombreZona;
        if (!nombreZona && datosEntrega.zona) {
            const zonaFormateada = datosEntrega.zona.charAt(0).toUpperCase() + datosEntrega.zona.slice(1).replace('-', ' ');
            nombreZona = datosEntrega.zona === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
        }
        mensaje += `Zona: ${nombreZona}\n\n`;
        
        mensaje += `*DATOS DEL CLIENTE*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n`;
        mensaje += `Dirección: ${datosEntrega.direccion}\n`;
        mensaje += `Referencia: ${datosEntrega.referencia}\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'agencia') {
        const cargoTexto = costoEntrega === 0 ? '*GRATIS*' : `S/${costoEntrega.toFixed(2)}`;
        mensaje += `Embalaje y llevada a la agencia: ${cargoTexto}\n\n`;
        mensaje += `*TOTAL A PAGAR: S/${totalFinal.toFixed(2)}*\n\n`;
        
        mensaje += `*TIPO DE ENTREGA*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `📦 Envío por agencia de transporte\n\n`;
        mensaje += `_Deseo coordinar por WhatsApp los datos necesarios para el envío._\n\n`;
        
    } else if (datosEntrega.tipoEntrega === 'recojo-local') {
        mensaje += `Recojo en local: *GRATIS*\n\n`;
        mensaje += `*TOTAL A PAGAR: S/${totalFinal.toFixed(2)}*\n\n`;
        
        mensaje += `*TIPO DE ENTREGA*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `📍 Recojo en local\n`;
        mensaje += `Ubicación: Cacatachi, Tarapoto\n\n`;
        
        mensaje += `*DATOS DEL CLIENTE*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `Nombre: ${datosEntrega.nombre}\n`;
        mensaje += `Celular: ${datosEntrega.celular}\n\n`;
        mensaje += `_Deseo coordinar el horario de recojo por WhatsApp._\n\n`;
    }
    
    if (datosEntrega.comentario) {
        mensaje += `*COMENTARIOS*\n`;
        mensaje += `--------------------\n\n`;
        mensaje += `${datosEntrega.comentario}\n\n`;
    }
    
    mensaje += `_Quedo atento para confirmar la disponibilidad y coordinar mi pedido._`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsapp = `https://wa.me/51986510573?text=${mensajeCodificado}`;
    
    window.open(urlWhatsapp, "_blank", "noopener,noreferrer");
}

// Hacer disponibles las funciones en el ámbito global
window.whatsappConfig = {
    phone: WHATSAPP_PHONE,
    obtenerEnlaceWhatsApp,
    enviarMensajeWhatsApp,
    consultarDisponibilidad,
    enviarPedidoWhatsApp
};
