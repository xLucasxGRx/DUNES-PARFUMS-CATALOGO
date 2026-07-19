/**
 * Dunes Parfums - WhatsApp Integration Module
 * Define el número de contacto de la tienda y proporciona utilidades
 * para construir enlaces de comunicación directa.
 */

// Cambiar por el número real del cliente (con código de país, sin espacios ni símbolos)
// Ejemplo: '5491123456789' (Argentina), '573001234567' (Colombia), etc.
const WHATSAPP_PHONE = '5491100000000'; // NÚMERO DE PRUEBA (Etapa 1)

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
    const mensaje = `Hola Dunes Parfums! Me gustaría consultar la disponibilidad del perfume: ${marca} - ${nombre} (${presentacion}).`;
    enviarMensajeWhatsApp(mensaje);
}

// Hacer disponibles las funciones en el ámbito global para simplificar en esta etapa
window.whatsappConfig = {
    phone: WHATSAPP_PHONE,
    obtenerEnlaceWhatsApp,
    enviarMensajeWhatsApp,
    consultarDisponibilidad
};
