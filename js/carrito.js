/**
 * Dunes Parfums - módulo del carrito de compras (Fase Completa)
 * Maneja el estado en localStorage con validación estricta de stock
 * e interactividad completa de cantidades y subtotales.
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
 * Actualiza el contador numérico visible en el icono del carrito de toda la página
 */
function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll('.cart-count');
    const carrito = obtenerCarrito();
    const cantidadTotal = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    
    contadores.forEach(contador => {
        if (contador) {
            contador.textContent = cantidadTotal;
            if (cantidadTotal > 0) {
                contador.style.display = 'flex';
                contador.classList.add('pulse-anim');
                // Quitar clase después de que termine la animación para permitir repeticiones
                setTimeout(() => {
                    contador.classList.remove('pulse-anim');
                }, 400);
            } else {
                contador.style.display = 'none';
            }
        }
    });
}

/**
 * Agrega un producto al carrito controlando estrictamente el stock real
 * @param {string} id - ID del producto
 * @param {number} cantidadAAgregar - Cantidad a añadir
 */
async function agregarAlCarrito(id, cantidadAAgregar = 1) {
    try {
        // Cargar detalles del producto para validar stock
        const producto = await window.productosModulo.obtenerProductoPorId(id);
        if (!producto) {
            mostrarToastPremium('Error: Producto no encontrado.', true);
            return;
        }

        if (!producto.disponible || producto.stock <= 0) {
            mostrarToastPremium(`Agotado: ${producto.nombre} no está disponible.`, true);
            return;
        }

        let carrito = obtenerCarrito();
        const itemExistente = carrito.find(item => item.id === id);
        const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
        const nuevaCantidad = cantidadActual + cantidadAAgregar;

        if (nuevaCantidad > producto.stock) {
            mostrarToastPremium(`Límite alcanzado: Solo hay ${producto.stock} unidades de ${producto.nombre}.`, true);
            if (itemExistente) {
                itemExistente.cantidad = producto.stock;
            } else {
                carrito.push({ id: id, cantidad: producto.stock });
            }
            guardarCarrito(carrito);
            actualizarContadorCarrito();
            if (window.renderizarCarritoDOM) window.renderizarCarritoDOM();
            return;
        }

        if (itemExistente) {
            itemExistente.cantidad = nuevaCantidad;
        } else {
            carrito.push({ id: id, cantidad: cantidadAAgregar });
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        mostrarToastPremium(`S/ ${producto.precio.toFixed(2)} - ${producto.nombre} agregado.`);
        
        // Si estamos en la página del carrito, volver a renderizar
        if (window.renderizarCarritoDOM) {
            window.renderizarCarritoDOM();
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarToastPremium('Error al procesar el carrito.', true);
    }
}

/**
 * Actualiza la cantidad de un ítem ya existente en el carrito
 * @param {string} id - ID del producto
 * @param {number} nuevaCantidad - Cantidad deseada
 */
async function actualizarCantidadItem(id, nuevaCantidad) {
    try {
        const producto = await window.productosModulo.obtenerProductoPorId(id);
        if (!producto) return;

        let carrito = obtenerCarrito();
        const item = carrito.find(i => i.id === id);
        if (!item) return;

        if (nuevaCantidad <= 0) {
            eliminarItem(id);
            return;
        }

        if (nuevaCantidad > producto.stock) {
            mostrarToastPremium(`Stock máximo alcanzado (${producto.stock} unidades).`, true);
            item.cantidad = producto.stock;
        } else {
            item.cantidad = nuevaCantidad;
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        if (window.renderizarCarritoDOM) window.renderizarCarritoDOM();
    } catch (e) {
        console.error(e);
    }
}

/**
 * Elimina un producto del carrito
 * @param {string} id - ID del producto a eliminar
 */
function eliminarItem(id) {
    let carrito = obtenerCarrito();
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarToastPremium('Producto eliminado del pedido.');
    
    if (window.renderizarCarritoDOM) {
        window.renderizarCarritoDOM();
    }
}

/**
 * Limpia por completo el carrito de compras
 */
function vaciarCarrito() {
    guardarCarrito([]);
    actualizarContadorCarrito();
    mostrarToastPremium('Carrito vaciado.');
    
    if (window.renderizarCarritoDOM) {
        window.renderizarCarritoDOM();
    }
}

/**
 * Combina la lista del carrito con los detalles completos del producto de la DB
 * @returns {Promise<Array>} - Lista de objetos de compra listos para facturar
 */
async function obtenerItemsCarritoDetallados() {
    const carrito = obtenerCarrito();
    const detallados = [];
    
    for (const item of carrito) {
        const prod = await window.productosModulo.obtenerProductoPorId(item.id);
        if (prod) {
            detallados.push({
                ...prod,
                cantidad: item.cantidad
            });
        }
    }
    
    return detallados;
}

/**
 * Muestra una notificación emergente de la marca
 * @param {string} mensaje 
 * @param {boolean} esAdvertencia - Si es true, el toast tendrá bordes de alerta
 */
function mostrarToastPremium(mensaje, esAdvertencia = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-premium';
    if (esAdvertencia) {
        toast.style.borderColor = '#FF3B30'; // Rojo de advertencia elegante
        toast.style.boxShadow = '0 0 10px rgba(255, 59, 48, 0.2)';
    }
    
    const icono = esAdvertencia ? '⚠️' : '✨';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icono}</span>
            <span class="toast-text">${mensaje}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
});

// Hacer las funciones globales
window.carritoModulo = {
    obtenerCarrito,
    guardarCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    eliminarItem,
    vaciarCarrito,
    obtenerItemsCarritoDetallados,
    mostrarToastPremium
};
