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

    mensaje += `SUBTOTAL DE PRODUCTOS: S/ ${total.toFixed(2)}\n`;

    if (cliente.tipoEntrega === 'delivery-local') {
        mensaje += `TIPO DE ENTREGA: Delivery local\n`;
        const zonaFormateada = cliente.zona.charAt(0).toUpperCase() + cliente.zona.slice(1).replace('-', ' ');
        const zonaDisplay = cliente.zona === 'banda-shilcayo' ? 'La Banda de Shilcayo' : zonaFormateada;
        mensaje += `ZONA: ${zonaDisplay}\n`;
        mensaje += `Nombre: ${cliente.nombre}\n`;
        mensaje += `Celular: ${cliente.celular}\n`;
        mensaje += `Dirección: ${cliente.direccion}\n`;
        mensaje += `Referencia: ${cliente.referencia}\n`;
        const costoTexto = cliente.costoEntrega === 0 ? 'GRATIS' : `S/ ${cliente.costoEntrega.toFixed(2)}`;
        mensaje += `COSTO DE DELIVERY: ${costoTexto}\n`;
        mensaje += `TOTAL DEL PEDIDO: S/ ${cliente.totalFinal.toFixed(2)}\n`;
    } else if (cliente.tipoEntrega === 'agencia') {
        mensaje += `TIPO DE ENTREGA: Envío por agencia de transporte\n`;
        const cargoTexto = cliente.costoEntrega === 0 ? 'GRATIS' : `S/ ${cliente.costoEntrega.toFixed(2)}`;
        mensaje += `EMBALAJE Y LLEVADA A LA AGENCIA: ${cargoTexto}\n`;
        mensaje += `TOTAL DEL PEDIDO: S/ ${cliente.totalFinal.toFixed(2)}\n`;
        mensaje += `Deseo coordinar el envío por agencia mediante WhatsApp.\n`;
    } else if (cliente.tipoEntrega === 'recojo-local') {
        mensaje += `TIPO DE ENTREGA: Recojo en local\n`;
        mensaje += `COSTO DE ENTREGA: GRATIS\n`;
        mensaje += `TOTAL DEL PEDIDO: S/ ${cliente.totalFinal.toFixed(2)}\n\n`;
        mensaje += `DATOS DEL CLIENTE:\n`;
        mensaje += `Nombre: ${cliente.nombre}\n`;
        mensaje += `Celular: ${cliente.celular}\n\n`;
        mensaje += `Deseo coordinar el horario de recojo en su local de Cacatachi, Tarapoto.\n`;
    } else {
        mensaje += `TOTAL DEL PEDIDO: S/ ${cliente.totalFinal.toFixed(2)}\n`;
    }

    if (cliente.comentario) {
        mensaje += `Comentario: ${cliente.comentario}\n`;
    }

    mensaje += `\nQuedo atento para confirmar disponibilidad y coordinar el pago.`;

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
