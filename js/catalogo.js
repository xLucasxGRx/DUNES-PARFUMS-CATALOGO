/**
 * Dunes Parfums - módulo de catálogo (Fase Inicial)
 * Maneja los filtros, búsquedas y renderizado de la página catalogo.html en etapas posteriores.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página del catálogo
    const catalogoContainer = document.getElementById('catalogo-productos-grid');
    if (!catalogoContainer) return;

    console.log('Dunes Parfums: Módulo de catálogo cargado en la página.');
    
    // Aquí se implementará la lógica de filtros y ordenamiento en la Etapa 2
    inicializarFiltrosCatalogo();
});

/**
 * Prepara los contenedores de filtros de la interfaz
 */
function inicializarFiltrosCatalogo() {
    const searchInput = document.getElementById('search-perfume');
    const categoryFilters = document.querySelectorAll('.filter-category-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Buscando perfume:', e.target.value);
            // Lógica de filtrado en tiempo real en la siguiente etapa
        });
    }
    
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const categoria = e.currentTarget.dataset.categoria;
            console.log('Filtrando por categoría:', categoria);
            // Lógica de filtrado en la siguiente etapa
        });
    });
}

// Exportar funciones placeholder
window.catalogoModulo = {
    inicializarFiltrosCatalogo
};
