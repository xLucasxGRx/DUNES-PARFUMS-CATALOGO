/**
 * Dunes Parfums - Lógica de Interacción para Ayuda, Galería de Confianza, Lightbox & FAQ (ayuda.js)
 * FASE AYUDA 2 - REORGANIZACIÓN DE GALERÍA Y RUTAS DE CATEGORÍAS
 */

const TIPOS_REFERENCIAS = {
    entrega: 'Entregas',
    envio: 'Envíos',
    decant: 'Decants',
    perfume: 'Nuestros perfumes'
};

let estadoReferencias = {
    todas: [],
    destacadas: [],
    actualLightboxIndex: 0,
    listaLightboxActual: []
};

document.addEventListener('DOMContentLoaded', () => {
    inicializarAcordeonFAQ();
    inicializarBuscadorFAQ();
    cargarYRenderizarReferencias();
});

/**
 * Carga de datos desde data/referencias.json e inicialización de carrusel y modal
 */
async function cargarYRenderizarReferencias() {
    try {
        const resp = await fetch('data/referencias.json');
        if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
        const data = await resp.json();
        
        estadoReferencias.todas = (Array.isArray(data) ? data : [])
            .filter(item => item && item.visible !== false)
            .sort((a, b) => (a.orden || 99) - (b.orden || 99));

        estadoReferencias.destacadas = estadoReferencias.todas.filter(item => item.destacada === true);

        if (estadoReferencias.destacadas.length > 0) {
            renderizarCarruselReferencias();
            inicializarControlesCarrusel();
        } else {
            renderizarEstadoVacioCarrusel();
        }

        inicializarModalTodasReferencias();
    } catch (err) {
        console.warn('[Ayuda] No se pudieron cargar las referencias desde JSON, mostrando estado de error:', err.message);
        renderizarEstadoVacioCarrusel("No pudimos cargar la galería en este momento.");
        inicializarModalTodasReferencias();
    }
}

/**
 * Renderiza el carrusel horizontal con las referencias destacadas
 */
function renderizarCarruselReferencias() {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    if (estadoReferencias.destacadas.length === 0) {
        renderizarEstadoVacioCarrusel();
        return;
    }

    track.innerHTML = estadoReferencias.destacadas.map((ref, index) => `
        <div class="reference-card" data-id="${ref.id}" data-tipo="${ref.tipo || 'entrega'}">
            <div class="reference-img-wrapper">
                <img src="${ref.imagen}" alt="${ref.alt || 'Producto o entrega de Dunes Parfums'}" class="reference-img" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async" onerror="this.closest('.reference-card').style.display='none';">
                <div class="reference-zoom-overlay">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    <span>Ver ampliada</span>
                </div>
            </div>
            <div class="reference-caption">
                <span class="reference-desc">${ref.descripcion || 'Galería de confianza'}</span>
                <span class="reference-type">${TIPOS_REFERENCIAS[ref.tipo] || 'Galeria'}</span>
            </div>
        </div>
    `).join('');

    // Eventos de clic para abrir Lightbox
    const cards = track.querySelectorAll('.reference-card');
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            abrirLightboxConLista(estadoReferencias.destacadas, index);
        });
    });

    actualizarContadorYSrollCarrusel();
}

/**
 * Renderiza un estado vacío o de error si no hay referencias registradas
 */
function renderizarEstadoVacioCarrusel(mensajeError) {
    const wrapper = document.getElementById('carousel-wrapper');
    const footerBar = document.querySelector('.carousel-footer-bar');
    if (!wrapper) return;

    const texto = mensajeError || "Estamos preparando nuestra galería de entregas, envíos y productos reales.";

    wrapper.innerHTML = `
        <div class="references-empty-state">
            <svg class="references-empty-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <h3 class="references-empty-title">Galería de confianza</h3>
            <p class="references-empty-text">${texto}</p>
        </div>
    `;
    if (footerBar) footerBar.style.display = 'none';
}

/**
 * Inicializa la navegación del carrusel por botones y toque táctil (swipe)
 */
function inicializarControlesCarrusel() {
    const container = document.getElementById('carousel-track-container');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');

    if (!container || !prevBtn || !nextBtn) return;

    const scrollAmount = () => {
        const card = container.querySelector('.reference-card');
        return card ? card.offsetWidth + 16 : container.clientWidth * 0.8;
    };

    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    container.addEventListener('scroll', () => {
        actualizarContadorYSrollCarrusel();
    }, { passive: true });
}

/**
 * Actualiza el texto del contador y el estado de habilitación de flechas en el carrusel
 */
function actualizarContadorYSrollCarrusel() {
    const container = document.getElementById('carousel-track-container');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');
    const counterText = document.getElementById('carousel-counter-text');

    if (!container) return;

    const totalCards = estadoReferencias.destacadas.length;
    if (totalCards === 0) return;

    const card = container.querySelector('.reference-card');
    const cardWidth = card ? card.offsetWidth + 16 : container.clientWidth;
    const scrollLeft = container.scrollLeft;

    const activeIndex = Math.min(
        totalCards,
        Math.max(1, Math.round(scrollLeft / cardWidth) + 1)
    );

    if (counterText) {
        counterText.textContent = `${activeIndex} de ${totalCards}`;
    }

    if (prevBtn) prevBtn.disabled = scrollLeft <= 10;
    if (nextBtn) nextBtn.disabled = scrollLeft + container.clientWidth >= container.scrollWidth - 10;
}

/**
 * Inicializa el modal "Galería completa" con filtros por categoría
 */
function inicializarModalTodasReferencias() {
    const openBtn = document.getElementById('btn-open-all-references');
    const modal = document.getElementById('all-references-modal');
    const closeBtn = document.getElementById('all-references-close');
    const grid = document.getElementById('all-references-grid');
    const filterChips = document.querySelectorAll('#all-references-filters .filter-chip');

    if (!openBtn || !modal || !grid) return;

    const abrirModal = () => {
        modal.classList.add('is-active');
        document.body.classList.add('no-scroll');
        renderizarGridModal('todos');
    };

    const cerrarModal = () => {
        modal.classList.remove('is-active');
        document.body.classList.remove('no-scroll');
    };

    openBtn.addEventListener('click', abrirModal);
    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const filterType = chip.dataset.filter || 'todos';
            renderizarGridModal(filterType);
        });
    });
}

/**
 * Renderiza la cuadrícula de la galería completa según el filtro de categoría activo
 */
function renderizarGridModal(filtro) {
    const grid = document.getElementById('all-references-grid');
    if (!grid) return;

    const filtradas = filtro === 'todos' 
        ? estadoReferencias.todas 
        : estadoReferencias.todas.filter(item => item.tipo === filtro);

    if (filtradas.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px 20px; font-family: var(--font-body, 'Montserrat', sans-serif); font-size: 0.9rem;">Estamos preparando nuestra galería de entregas, envíos y productos reales.</div>`;
        return;
    }

    grid.innerHTML = filtradas.map(ref => `
        <div class="reference-card" data-id="${ref.id}" data-tipo="${ref.tipo || 'entrega'}">
            <div class="reference-img-wrapper">
                <img src="${ref.imagen}" alt="${ref.alt || 'Referencia'}" class="reference-img" loading="lazy" decoding="async" onerror="this.closest('.reference-card').style.display='none';">
                <div class="reference-zoom-overlay">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    <span>Ver ampliada</span>
                </div>
            </div>
            <div class="reference-caption">
                <span class="reference-desc">${ref.descripcion || 'Galería de confianza'}</span>
                <span class="reference-type">${TIPOS_REFERENCIAS[ref.tipo] || 'Galeria'}</span>
            </div>
        </div>
    `).join('');

    const cards = grid.querySelectorAll('.reference-card');
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            abrirLightboxConLista(filtradas, index);
        });
    });
}

/**
 * Abre el Visor Lightbox con soporte para navegación entre elementos de una lista
 */
function abrirLightboxConLista(lista, indexInicial) {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const modalCaption = document.getElementById('lightbox-caption');
    const modalCounter = document.getElementById('lightbox-counter');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');

    if (!modal || !modalImg || !lista || lista.length === 0) return;

    estadoReferencias.listaLightboxActual = lista;
    estadoReferencias.actualLightboxIndex = Math.max(0, Math.min(indexInicial, lista.length - 1));

    const actualizarVistaLightbox = () => {
        const item = estadoReferencias.listaLightboxActual[estadoReferencias.actualLightboxIndex];
        if (!item) return;

        modalImg.src = item.imagen;
        if (modalCaption) modalCaption.textContent = item.descripcion || item.alt || 'Galería de confianza - Dunes Parfums';
        if (modalCounter) modalCounter.textContent = `${estadoReferencias.actualLightboxIndex + 1} de ${estadoReferencias.listaLightboxActual.length}`;
        
        if (prevBtn) prevBtn.style.display = estadoReferencias.actualLightboxIndex > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = estadoReferencias.actualLightboxIndex < estadoReferencias.listaLightboxActual.length - 1 ? 'flex' : 'none';
    };

    const cerrarLightbox = () => {
        modal.classList.remove('is-active');
        document.body.classList.remove('no-scroll');
        modalImg.src = '';
    };

    actualizarVistaLightbox();
    modal.classList.add('is-active');
    document.body.classList.add('no-scroll');

    // Asignación limpia de eventos (sin duplicados)
    if (closeBtn) {
        closeBtn.onclick = (e) => { e.stopPropagation(); cerrarLightbox(); };
    }
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            if (estadoReferencias.actualLightboxIndex > 0) {
                estadoReferencias.actualLightboxIndex--;
                actualizarVistaLightbox();
            }
        };
    }
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            if (estadoReferencias.actualLightboxIndex < estadoReferencias.listaLightboxActual.length - 1) {
                estadoReferencias.actualLightboxIndex++;
                actualizarVistaLightbox();
            }
        };
    }

    modal.onclick = (e) => {
        if (e.target === modal) cerrarLightbox();
    };

    const handleKeydown = (e) => {
        if (!modal.classList.contains('is-active')) return;
        if (e.key === 'Escape') cerrarLightbox();
        if (e.key === 'ArrowLeft' && estadoReferencias.actualLightboxIndex > 0) {
            estadoReferencias.actualLightboxIndex--;
            actualizarVistaLightbox();
        }
        if (e.key === 'ArrowRight' && estadoReferencias.actualLightboxIndex < estadoReferencias.listaLightboxActual.length - 1) {
            estadoReferencias.actualLightboxIndex++;
            actualizarVistaLightbox();
        }
    };

    document.removeEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', handleKeydown);
}

/**
 * Inicializa el comportamiento de acordeón para las Preguntas Frecuentes
 */
function inicializarAcordeonFAQ() {
    const faqBlocks = document.querySelectorAll('.faq-category-block');

    faqBlocks.forEach(block => {
        const buttons = block.querySelectorAll('.faq-button');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const item = button.closest('.faq-item');
                const answerWrapper = item.querySelector('.faq-answer-wrapper');
                const isOpen = item.classList.contains('is-open');

                // Cerrar otras preguntas abiertas dentro del mismo grupo de categoría
                const siblingItems = block.querySelectorAll('.faq-item');
                siblingItems.forEach(sibling => {
                    if (sibling !== item) {
                        sibling.classList.remove('is-open');
                        const sibBtn = sibling.querySelector('.faq-button');
                        const sibWrapper = sibling.querySelector('.faq-answer-wrapper');
                        if (sibBtn) sibBtn.setAttribute('aria-expanded', 'false');
                        if (sibWrapper) sibWrapper.setAttribute('aria-hidden', 'true');
                    }
                });

                // Alternar estado de la pregunta actual
                if (isOpen) {
                    item.classList.remove('is-open');
                    button.setAttribute('aria-expanded', 'false');
                    if (answerWrapper) answerWrapper.setAttribute('aria-hidden', 'true');
                } else {
                    item.classList.add('is-open');
                    button.setAttribute('aria-expanded', 'true');
                    if (answerWrapper) answerWrapper.setAttribute('aria-hidden', 'false');
                }
            });
        });
    });
}

/**
 * Filtra las preguntas frecuentes según el término de búsqueda ingresado
 */
function inicializarBuscadorFAQ() {
    const searchInput = document.getElementById('faq-search-input');
    const categoryBlocks = document.querySelectorAll('.faq-category-block');
    const noResults = document.getElementById('faq-no-results');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let totalMatches = 0;

        categoryBlocks.forEach(block => {
            let blockMatches = 0;
            const itemsInBlock = block.querySelectorAll('.faq-item');

            itemsInBlock.forEach(item => {
                const questionText = (item.querySelector('.faq-question-text')?.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const answerText = (item.querySelector('.faq-answer-content')?.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                if (!query || questionText.includes(query) || answerText.includes(query)) {
                    item.style.display = 'block';
                    blockMatches++;
                    totalMatches++;
                } else {
                    item.style.display = 'none';
                }
            });

            if (blockMatches > 0) {
                block.style.display = 'block';
            } else {
                block.style.display = 'none';
            }
        });

        if (noResults) {
            if (totalMatches === 0 && query.length > 0) {
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
        }
    });
}
