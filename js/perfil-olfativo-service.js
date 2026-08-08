/**
 * Dunes Parfums - Servicio de Perfil Olfativo
 * Carga de forma segura data/perfumes-olfativos.json sin realizar peticiones externas
 */

const PerfilOlfativoService = (function() {
    let _cachePerfiles = null;
    let _cargandoPromise = null;

    /**
     * Carga el archivo JSON local de perfiles olfativos en memoria
     * @returns {Promise<Object>}
     */
    async function cargarPerfilesOlfativos() {
        if (_cachePerfiles) return _cachePerfiles;
        if (_cargandoPromise) return _cargandoPromise;

        _cargandoPromise = (async () => {
            try {
                const res = await fetch('data/perfumes-olfativos.json');
                if (!res.ok) {
                    _cachePerfiles = {};
                    return _cachePerfiles;
                }
                const data = await res.json();
                _cachePerfiles = data || {};
                return _cachePerfiles;
            } catch (err) {
                console.warn('[PerfilOlfativoService] No se pudo cargar el archivo local de perfiles olfativos:', err);
                _cachePerfiles = {};
                return _cachePerfiles;
            } finally {
                _cargandoPromise = null;
            }
        })();

        return _cargandoPromise;
    }

    /**
     * Obtiene el perfil olfativo de un perfume por su Dunes ID
     * @param {string|number} dunesId 
     * @returns {Promise<Object|null>}
     */
    async function obtenerPerfilOlfativo(dunesId) {
        if (!dunesId) return null;
        const idClean = String(dunesId).trim();
        const perfiles = await cargarPerfilesOlfativos();

        const perfil = perfiles[idClean];
        if (perfil && perfil.estado === 'ENCONTRADO') {
            return perfil;
        }

        return null;
    }

    return {
        cargarPerfilesOlfativos,
        obtenerPerfilOlfativo
    };
})();

if (typeof window !== 'undefined') {
    window.PerfilOlfativoService = PerfilOlfativoService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerfilOlfativoService;
}
