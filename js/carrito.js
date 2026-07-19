/**
 * Dunes Parfums - módulo del carrito de compras (Fase Inicial)
 * Maneja el estado en localStorage, actualiza el contador de la cabecera
 * y provee funciones para agregar productos.
 */

// Inicializar el carrito en localStorage si no existe
function obtenerCarrito() {
    try {
        const carrito = localStorage.getItem('dunes_cart');
        return carrito ? JSON.parse(carrito) : [];
    } catch (e) {
        console.error('Error al acceder al localStorage:', e);
        return [];
    }
}

function guardarCarrito(carrito) {
    try {
        localStorage.setItem('dunes_cart', JSON.stringify(carrito));
    } catch (e) {
        console.error('Error al guardar en el localStorage:', e);
    }
}

/**
 * Actualiza el contador numérico visible en el icono del carrito
 */
function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll('.cart-count');
    const carrito = obtenerCarrito();
    // Suma la cantidad total de artículos
    const cantidadTotal = carrito.reduce((acc, item) => acc + (item.cantidad || 1), 0);
    
    contadores.forEach(contador => {
        if (contador) {
            contador.textContent = cantidadTotal;
            // Ocultar o mostrar según cantidad
            if (cantidadTotal > 0) {
                contador.style.display = 'flex';
                contador.classList.add('pulse-anim');
            } else {
                contador.style.display = 'none';
            }
        }
    });
}

/**
 * Agrega un producto al carrito
 * @param {string} id - ID del producto
 * @param {string} nombre - Nombre del producto (para el aviso)
 */
function agregarAlCarrito(id, nombre) {
    let carrito = obtenerCarrito();
    const existe = carrito.find(item => item.id === id);
    
    if (existe) {
        existe.cantidad = (existe.cantidad || 1) + 1;
    } else {
        carrito.push({ id, cantidad: 1 });
    }
    
    guardarCarrito(carrito);
    actualizarContadorCarrito();
    
    // Feedback visual premium (Toast Notification)
    mostrarToastPremium(`${nombre} se agregó al carrito.`);
}

/**
 * Muestra una notificación emergente con estilo premium de la marca
 * @param {string} mensaje 
 */
function mostrarToastPremium(mensaje) {
    // Buscar o crear contenedor de toasts
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-premium';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✨</span>
            <span class="toast-text">${mensaje}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Forzar reflow para animación de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
});

// Hacer las funciones globales
window.carritoModulo = {
    obtenerCarrito,
    guardarCarrito,
    agregarAlCarrito,
    actualizarContadorCarrito,
    mostrarToastPremium
};
