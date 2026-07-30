/**
 * Dunes Parfums - Servicio Centralizado de Favoritos (js/favoritos-service.js - FASE M14)
 * Maneja el almacenamiento persistente en localStorage bajo la clave 'dunes_favoritos'
 */
(function(window) {
    'use strict';

    const STORAGE_KEY = 'dunes_favoritos';

    /**
     * Normaliza un ID a string limpio
     * @param {string|number} id
     * @returns {string}
     */
    function normalizarId(id) {
        if (id === null || id === undefined) return '';
        return String(id).trim();
    }

    /**
     * Notifica a la ventana sobre cambios en favoritos
     * @param {Array<string>} favoritos
     */
    function notificarCambios(favoritos) {
        try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                const event = new CustomEvent('dunes:favoritos:updated', {
                    detail: {
                        count: favoritos.length,
                        ids: favoritos
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (err) {
            console.warn('[FavoritosService] Error al emitir evento de actualización:', err);
        }
    }

    const FavoritosService = {
        /**
         * Obtiene la lista actual de IDs de favoritos
         * @returns {Array<string>}
         */
        obtenerFavoritos: function() {
            try {
                if (typeof localStorage === 'undefined') return [];
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return [];

                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) {
                    localStorage.removeItem(STORAGE_KEY);
                    return [];
                }

                // Filtrar nulos/vacíos, normalizar a string y eliminar duplicados
                const unicos = [];
                for (let i = 0; i < parsed.length; i++) {
                    const idStr = normalizarId(parsed[i]);
                    if (idStr && !unicos.includes(idStr)) {
                        unicos.push(idStr);
                    }
                }
                return unicos;
            } catch (err) {
                console.warn('[FavoritosService] Error al leer favoritos de localStorage:', err);
                try {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (e) {}
                return [];
            }
        },

        /**
         * Verifica si un ID de producto está en favoritos
         * @param {string|number} id
         * @returns {boolean}
         */
        esFavorito: function(id) {
            const targetId = normalizarId(id);
            if (!targetId) return false;
            const favs = this.obtenerFavoritos();
            return favs.includes(targetId);
        },

        /**
         * Guarda el array de favoritos en localStorage y emite evento
         * @param {Array<string>} favoritos
         * @private
         */
        _guardar: function(favoritos) {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
                }
            } catch (err) {
                console.warn('[FavoritosService] Error al guardar favoritos en localStorage:', err);
            }
            notificarCambios(favoritos);
        },

        /**
         * Agrega un producto a favoritos
         * @param {string|number} id
         * @returns {boolean} True si se agregó correctamente
         */
        agregarFavorito: function(id) {
            const targetId = normalizarId(id);
            if (!targetId) return false;

            const favs = this.obtenerFavoritos();
            if (!favs.includes(targetId)) {
                favs.push(targetId);
                this._guardar(favs);
            }
            return true;
        },

        /**
         * Quita un producto de favoritos
         * @param {string|number} id
         * @returns {boolean} False (indicando que ya no es favorito)
         */
        quitarFavorito: function(id) {
            const targetId = normalizarId(id);
            if (!targetId) return false;

            const favs = this.obtenerFavoritos();
            const index = favs.indexOf(targetId);
            if (index !== -1) {
                favs.splice(index, 1);
                this._guardar(favs);
            }
            return false;
        },

        /**
         * Alterna el estado de un producto en favoritos
         * @param {string|number} id
         * @returns {boolean} True si ahora es favorito, False si se quitó
         */
        alternarFavorito: function(id) {
            const targetId = normalizarId(id);
            if (!targetId) return false;

            if (this.esFavorito(targetId)) {
                this.quitarFavorito(targetId);
                return false;
            } else {
                this.agregarFavorito(targetId);
                return true;
            }
        },

        /**
         * Limpia todos los favoritos
         */
        limpiarFavoritos: function() {
            this._guardar([]);
        },

        /**
         * Obtiene la cantidad total de favoritos guardados
         * @returns {number}
         */
        obtenerCantidadFavoritos: function() {
            return this.obtenerFavoritos().length;
        },

        /**
         * Elimina de favoritos los IDs que ya no existen en el catálogo válido
         * @param {Array<string|number>} idsValidos
         */
        limpiarFavoritosInexistentes: function(idsValidos) {
            if (!Array.isArray(idsValidos)) return;
            const validosStr = idsValidos.map(normalizarId);
            const favs = this.obtenerFavoritos();
            const filtrados = favs.filter(id => validosStr.includes(id));

            if (filtrados.length !== favs.length) {
                this._guardar(filtrados);
            }
        }
    };

    // Escuchar eventos de sincronización entre pestañas
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('storage', function(e) {
            if (e.key === STORAGE_KEY) {
                const favs = FavoritosService.obtenerFavoritos();
                notificarCambios(favs);
            }
        });
    }

    // Exponer globalmente
    window.FavoritosService = FavoritosService;
    window.favoritosService = FavoritosService;

})(typeof window !== 'undefined' ? window : globalThis);
