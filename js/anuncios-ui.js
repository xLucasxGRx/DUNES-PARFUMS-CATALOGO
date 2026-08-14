/**
 * Dunes Parfums - Interfaz y Rotación de Barra Superior de Anuncios (anuncios-ui.js)
 * FASE M23.2 - Ocultar por completo la barra superior cuando hay 0 anuncios activos o error.
 */

const AnunciosUI = (function() {
    let listaAnuncios = [];
    let indiceActual = 0;
    let timerRotacion = null;
    const TIEMPO_ROTACION_MS = 4000;

    /**
     * Obtiene o crea la estructura DOM de la barra de anuncios
     * Se inserta en la parte superior del header principal (.header-main)
     */
    function obtenerOCrearBarraDOM() {
        if (typeof document === 'undefined') return null;

        let barra = document.getElementById('announcement-bar');
        if (barra) return barra;

        const headerMain = document.getElementById('header-main') || document.querySelector('.header-main');
        if (!headerMain) return null;

        barra = document.createElement('aside');
        barra.className = 'announcement-bar';
        barra.id = 'announcement-bar';
        barra.setAttribute('role', 'region');
        barra.setAttribute('aria-label', 'Anuncios importantes de Dunes Parfums');

        barra.innerHTML = `
            <div class="announcement-container">
                <div class="announcement-wrapper" id="announcement-wrapper">
                    <span class="announcement-text" id="announcement-text"></span>
                </div>
            </div>
        `;

        // Insertar al inicio de header-main
        headerMain.insertBefore(barra, headerMain.firstChild);
        return barra;
    }

    /**
     * Oculta completamente la barra superior de anuncios y limpia temporizadores y estados
     */
    function ocultarBarraSuperior() {
        detenerRotacion();
        listaAnuncios = [];
        indiceActual = 0;

        if (typeof document === 'undefined') return;

        const textEl = document.getElementById('announcement-text');
        if (textEl) textEl.textContent = '';

        const wrapper = document.getElementById('announcement-wrapper');
        if (wrapper) wrapper.classList.remove('fade-out', 'fade-in');

        const barra = document.getElementById('announcement-bar');
        if (barra) {
            barra.hidden = true;
            barra.classList.add('is-hidden');
            barra.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Muestra la barra superior con el listado de anuncios activos suministrados
     */
    function mostrarBarraSuperior(anuncios) {
        if (!Array.isArray(anuncios) || anuncios.length === 0) {
            ocultarBarraSuperior();
            return;
        }

        listaAnuncios = anuncios;
        indiceActual = 0;

        const barra = obtenerOCrearBarraDOM();
        if (!barra) return;

        barra.hidden = false;
        barra.classList.remove('is-hidden');
        barra.removeAttribute('aria-hidden');

        const textEl = document.getElementById('announcement-text');
        if (textEl && listaAnuncios[0]) {
            textEl.textContent = listaAnuncios[0].texto;
        }

        if (listaAnuncios.length > 1) {
            iniciarRotacion();
        } else {
            detenerRotacion();
        }
    }

    /**
     * Muestra el anuncio correspondiente al índice especificado con animación elegante
     */
    function mostrarAnuncio(index) {
        if (!listaAnuncios || listaAnuncios.length === 0) {
            ocultarBarraSuperior();
            return;
        }

        const wrapper = document.getElementById('announcement-wrapper');
        const textEl = document.getElementById('announcement-text');
        if (!textEl || !wrapper) return;

        const item = listaAnuncios[index];
        if (!item || !item.texto) return;

        wrapper.classList.remove('fade-in');
        wrapper.classList.add('fade-out');

        setTimeout(() => {
            textEl.textContent = item.texto;
            wrapper.classList.remove('fade-out');
            wrapper.classList.add('fade-in');
        }, 300);
    }

    /**
     * Avanza al siguiente anuncio en la lista
     */
    function siguienteAnuncio() {
        if (!listaAnuncios || listaAnuncios.length <= 1) return;
        indiceActual = (indiceActual + 1) % listaAnuncios.length;
        mostrarAnuncio(indiceActual);
    }

    /**
     * Inicia el temporizador de rotación automática si hay 2 o más anuncios
     */
    function iniciarRotacion() {
        detenerRotacion();
        if (!listaAnuncios || listaAnuncios.length <= 1) return;

        timerRotacion = setInterval(() => {
            siguienteAnuncio();
        }, TIEMPO_ROTACION_MS);
    }

    /**
     * Detiene la rotación activa
     */
    function detenerRotacion() {
        if (timerRotacion) {
            clearInterval(timerRotacion);
            timerRotacion = null;
        }
    }

    /**
     * Inicializa el módulo de barra superior de anuncios
     */
    async function inicializar() {
        try {
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            const service = window.AnunciosService || (typeof AnunciosService !== 'undefined' ? AnunciosService : null);
            if (!service || typeof service.cargarAnuncios !== 'function') {
                ocultarBarraSuperior();
                return;
            }

            const anunciosActivos = await service.cargarAnuncios();
            if (!Array.isArray(anunciosActivos) || anunciosActivos.length === 0) {
                ocultarBarraSuperior();
                return;
            }

            mostrarBarraSuperior(anunciosActivos);
        } catch (err) {
            console.error('[AnunciosUI] Error al consultar Google Sheets:', err.message);
            ocultarBarraSuperior();
        }
    }

    // Auto-inicializar cuando el DOM esté listo
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializar);
        } else {
            inicializar();
        }
    }

    const uiObj = {
        inicializar: inicializar,
        mostrarBarraSuperior: mostrarBarraSuperior,
        ocultarBarraSuperior: ocultarBarraSuperior,
        mostrarAnuncio: mostrarAnuncio,
        siguienteAnuncio: siguienteAnuncio,
        iniciarRotacion: iniciarRotacion,
        detenerRotacion: detenerRotacion,
        _obtenerOCrearBarraDOM: obtenerOCrearBarraDOM
    };

    if (typeof window !== 'undefined') {
        window.AnunciosUI = uiObj;
    }
    if (typeof global !== 'undefined') {
        global.AnunciosUI = uiObj;
    }

    return uiObj;
})();
