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
 * @param {Array} items - Lista de ítems en el carrito con detalles cargados del producto
 * @param {number} total - Costo total acumulado
 * @param {Object} cliente - Datos del formulario del comprador (nombre, distrito, entrega, comentario)
 */
function enviarPedidoWhatsApp(items, total, cliente) {
    let mensaje = `Hola, Dunes Parfums 👋\n\nDeseo realizar el siguiente pedido:\n\n`;
    
    items.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        const presentacionTexto = item.categoria === 'decants' 
            ? `${item.tamanoMl} ml` 
            : `Sellado / ${item.tamanoMl} ml`;
            
        mensaje += `${index + 1}. ${item.nombre}\n`;
        mensaje += `Presentación: ${presentacionTexto}\n`;
        mensaje += `Cantidad: ${item.cantidad}\n`;
        mensaje += `Precio unitario: S/ ${item.precio.toFixed(2)}\n`;
        mensaje += `Subtotal: S/ ${subtotal.toFixed(2)}\n\n`;
    });
    
    mensaje += `TOTAL DEL PEDIDO: S/ ${total.toFixed(2)}\n\n`;
    mensaje += `Nombre: ${cliente.nombre || ''}\n`;
    mensaje += `Ciudad o distrito: ${cliente.distrito || ''}\n`;
    mensaje += `Tipo de entrega: ${cliente.entrega || ''}\n`;
    mensaje += `Comentario: ${cliente.comentario || ''}\n\n`;
    mensaje += `Quedo atento para confirmar disponibilidad y coordinar el pago.`;
    
    enviarMensajeWhatsApp(mensaje);
}

// Hacer disponibles las funciones en el ámbito global
window.whatsappConfig = {
    phone: WHATSAPP_PHONE,
    obtenerEnlaceWhatsApp,
    enviarMensajeWhatsApp,
    consultarDisponibilidad,
    enviarPedidoWhatsApp
};
