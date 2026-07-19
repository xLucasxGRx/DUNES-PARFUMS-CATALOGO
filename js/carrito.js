/**
 * Dunes Parfums - módulo del carrito de compras (Fase Variantes)
 * Soporta variantes de decants (3ml, 5ml, 10ml) diferenciándolas en el pedido
 * y controlando el stock basado en los mililitros totales disponibles de la marca.
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
 * Agrega un producto al carrito controlando estrictamente el stock real (unidades para sellados, ml para decants)
 * @param {string} idProducto - ID base del producto
 * @param {number} cantidadAAgregar - Cantidad a añadir
 * @param {number|null} tamanoMl - Tamaño en ml si es decant (3, 5 o 10)
 */
async function agregarAlCarrito(idProducto, cantidadAAgregar = 1, tamanoMl = null) {
    try {
        const product = await window.productosModulo.obtenerProductoPorId(idProducto);
        if (!product) {
            mostrarToastPremium('Error: Producto no encontrado.', true);
            return;
        }

        if (!product.disponible) {
            mostrarToastPremium(`Agotado: ${product.nombre} no está disponible.`, true);
            return;
        }

        let carrito = obtenerCarrito();
        const esDecant = product.categoria === 'decants';
        
        // Clave única en carrito
        const key = idProducto + (esDecant ? `-${tamanoMl}` : '');
        const itemExistente = carrito.find(item => item.id === key);
        const qtyInCart = itemExistente ? itemExistente.cantidad : 0;
        const nuevaCantidadPropuesta = qtyInCart + cantidadAAgregar;

        let cantidadFinal = nuevaCantidadPropuesta;
        let limiteAlcanzado = false;
        let stockMaximo = 0;

        if (esDecant) {
            // Validar presentación
            if (!tamanoMl || ![3, 5, 10].includes(tamanoMl)) {
                mostrarToastPremium('Error: Presentación de decant no válida.', true);
                return;
            }

            // Calcular mililitros ocupados por OTRAS presentaciones de este mismo decant
            const mlOtros = carrito
                .filter(item => item.idProducto === idProducto && item.id !== key)
                .reduce((acc, item) => acc + (item.tamanoMl * item.cantidad), 0);

            // Calcular capacidad restante de mililitros para este ítem
            const mlDisponiblesParaItem = product.mililitrosDisponibles - mlOtros;
            stockMaximo = Math.floor(mlDisponiblesParaItem / tamanoMl);

            if (nuevaCantidadPropuesta > stockMaximo) {
                cantidadFinal = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            }
        } else {
            // Perfume Sellado
            stockMaximo = product.stock;
            if (nuevaCantidadPropuesta > stockMaximo) {
                cantidadFinal = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            }
        }

        if (limiteAlcanzado) {
            const mensajeAviso = esDecant 
                ? `Límite alcanzado: ml insuficientes para agregar más (${stockMaximo} unid. máx.).`
                : `Límite alcanzado: solo hay ${stockMaximo} unidades de ${product.nombre}.`;
            mostrarToastPremium(mensajeAviso, true);
            
            if (cantidadFinal <= 0) {
                // Si no se puede agregar nada, salir sin modificar carrito
                return;
            }
        }

        // Obtener precio unitario
        let precioUnitario = product.precio;
        let presentacionTexto = `Sellado / ${product.presentacion}`;
        let mlItem = 100;

        if (esDecant) {
            const presInfo = product.presentaciones.find(p => p.ml === tamanoMl);
            precioUnitario = presInfo ? presInfo.precio : 30.00;
            presentacionTexto = `Decant ${tamanoMl} ml`;
            mlItem = tamanoMl;
        }

        if (itemExistente) {
            itemExistente.cantidad = cantidadFinal;
            itemExistente.subtotal = itemExistente.precioUnitario * cantidadFinal;
        } else {
            carrito.push({
                id: key,
                idProducto: idProducto,
                nombre: product.nombre,
                marca: product.marca,
                imagen: product.imagen,
                tipo: product.tipo,
                categoria: product.categoria,
                presentacion: presentacionTexto,
                tamanoMl: mlItem,
                precioUnitario: precioUnitario,
                cantidad: cantidadFinal,
                subtotal: precioUnitario * cantidadFinal
            });
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        
        if (!limiteAlcanzado) {
            mostrarToastPremium(`S/ ${precioUnitario.toFixed(2)} - ${product.nombre} (${mlItem}ml) agregado.`);
        }

        if (window.renderizarCarritoDOM) {
            window.renderizarCarritoDOM();
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarToastPremium('Error al procesar el carrito.', true);
    }
}

/**
 * Actualiza la cantidad de un ítem ya existente en el carrito con chequeo estricto
 * @param {string} id - ID único del ítem en carrito (ej: "p1" o "d1-3")
 * @param {number} nuevaCantidad - Cantidad deseada
 */
async function actualizarCantidadItem(id, nuevaCantidad) {
    try {
        let carrito = obtenerCarrito();
        const item = carrito.find(i => i.id === id);
        if (!item) return;

        if (nuevaCantidad <= 0) {
            eliminarItem(id);
            return;
        }

        const product = await window.productosModulo.obtenerProductoPorId(item.idProducto);
        if (!product) return;

        const esDecant = item.categoria === 'decants';
        let stockMaximo = 0;
        let limiteAlcanzado = false;

        if (esDecant) {
            // Calcular mililitros de otras variantes del mismo perfume
            const mlOtros = carrito
                .filter(i => i.idProducto === item.idProducto && i.id !== id)
                .reduce((acc, i) => acc + (i.tamanoMl * i.cantidad), 0);

            const mlDisponiblesParaItem = product.mililitrosDisponibles - mlOtros;
            stockMaximo = Math.floor(mlDisponiblesParaItem / item.tamanoMl);

            if (nuevaCantidad > stockMaximo) {
                item.cantidad = Math.max(0, stockMaximo);
                limiteAlcanzado = true;
            } else {
                item.cantidad = nuevaCantidad;
            }
        } else {
            // Sellado
            stockMaximo = product.stock;
            if (nuevaCantidad > stockMaximo) {
                item.cantidad = stockMaximo;
                limiteAlcanzado = true;
            } else {
                item.cantidad = nuevaCantidad;
            }
        }

        item.subtotal = item.precioUnitario * item.cantidad;

        if (limiteAlcanzado) {
            mostrarToastPremium(`Stock máximo alcanzado (${stockMaximo} unidades).`, true);
        }

        // Si la cantidad es 0 por falta de ml, eliminarlo
        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id !== id);
        }

        guardarCarrito(carrito);
        actualizarContadorCarrito();
        if (window.renderizarCarritoDOM) window.renderizarCarritoDOM();
    } catch (e) {
        console.error('Error al actualizar cantidad:', e);
    }
}

/**
 * Elimina un producto del carrito
 * @param {string} id - ID único del ítem a eliminar
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
 * Retorna los ítems detallados del carrito
 * @returns {Promise<Array>}
 */
async function obtenerItemsCarritoDetallados() {
    const carrito = obtenerCarrito();
    const detallados = [];
    
    for (const item of carrito) {
        // Mapear con nombres de propiedades consistentes
        detallados.push({
            id: item.id,
            idProducto: item.idProducto,
            nombre: item.nombre,
            marca: item.marca,
            imagen: item.imagen,
            tipo: item.tipo,
            categoria: item.categoria,
            presentacion: item.presentacion,
            formato: item.categoria === 'decants' ? 'Decant' : 'Sellado',
            tamanoMl: item.tamanoMl,
            precio: item.precioUnitario,
            cantidad: item.cantidad,
            subtotal: item.subtotal
        });
    }
    
    return detallados;
}

/**
 * Muestra una notificación emergente de la marca
 * @param {string} mensaje 
 * @param {boolean} esAdvertencia 
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
        toast.style.borderColor = '#FF3B30';
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
