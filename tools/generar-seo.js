const fs = require('fs');
const path = require('path');

const SITE_URL = "https://xlucasxgrx.github.io/DUNES-PARFUMS-CATALOGO";

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function generarSitemap() {
    console.log("--- GENERANDO SITEMAP.XML ---");
    
    // Main static indexable pages
    const staticPages = [
        { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${SITE_URL}/catalogo.html`, priority: '0.9', changefreq: 'daily' },
        { loc: `${SITE_URL}/ayuda.html`, priority: '0.7', changefreq: 'weekly' }
    ];

    let productUrls = [];
    const productsJsonPath = path.join(__dirname, '..', 'data', 'productos.json');
    
    if (fs.existsSync(productsJsonPath)) {
        try {
            const raw = fs.readFileSync(productsJsonPath, 'utf-8');
            const products = JSON.parse(raw);
            const visibleProducts = products.filter(p => p && p.visible !== false && p.id);
            
            productUrls = visibleProducts.map(p => {
                const cleanId = String(p.id).trim();
                return {
                    loc: `${SITE_URL}/producto.html?id=${encodeURIComponent(cleanId)}`,
                    priority: '0.8',
                    changefreq: 'weekly'
                };
            });
            console.log(`Cargados ${productUrls.length} productos visibles para el sitemap.`);
        } catch (e) {
            console.warn("Error al leer data/productos.json para sitemap:", e.message);
        }
    }

    const allUrls = [...staticPages, ...productUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    allUrls.forEach(urlObj => {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(urlObj.loc)}</loc>\n`;
        xml += `    <changefreq>${urlObj.changefreq}</changefreq>\n`;
        xml += `    <priority>${urlObj.priority}</priority>\n`;
        xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    const outputPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');
    console.log(`[EXITO] sitemap.xml generado con ${allUrls.length} URLs en: ${outputPath}`);
}

function verificarSeo() {
    console.log("\n--- VERIFICANDO METADATOS SEO ---");
    const rootDir = path.join(__dirname, '..');
    const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

    let errors = 0;
    htmlFiles.forEach(file => {
        const fp = path.join(rootDir, file);
        const content = fs.readFileSync(fp, 'utf-8');

        // Check lang="es-PE"
        if (!content.includes('lang="es-PE"')) {
            console.warn(`[WARN] ${file}: Faltante lang="es-PE"`);
            errors++;
        }

        // Check noindex on private pages
        if (['carrito.html', 'favoritos.html', '404.html'].includes(file)) {
            if (!content.includes('name="robots"') || !content.includes('noindex')) {
                console.warn(`[ERROR] ${file}: Debería tener <meta name="robots" content="noindex...">`);
                errors++;
            }
        }
    });

    if (errors === 0) {
        console.log("[EXITO] Todos los archivos HTML pasaron la verificación SEO.");
    } else {
        console.log(`[ADVERTENCIA] Se encontraron ${errors} observaciones SEO.`);
    }
}

// Command execution
const mode = process.argv[2];
if (mode === '--verificar') {
    verificarSeo();
} else {
    generarSitemap();
    verificarSeo();
}
