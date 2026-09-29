/**
 * Dunes Parfums - Test Fixtures para el Módulo PREVENTA (FASE P1)
 * Estructura de 12 columnas exactas de Google Sheets:
 * nombre,marca,categoria,genero,formato_presentacion,precio_regular,precio_preventa,stock,disponible,visible,imagen,ocasion
 */

const CSV_SAMPLE_PREVENTA = `nombre,marca,categoria,genero,formato_presentacion,precio_regular,precio_preventa,stock,disponible,visible,imagen,ocasion
"Khamrah Qahwa","Lattafa","Árabe","Unisex","100 ml","230.00","195.00","8","true","true","https://dunesparfums.com/img/preventa/khamrah-qahwa.webp","Citas,Noche"
"Club de Nuit Iconic","Armaf","Árabe","Hombre","105 ml","220.00","185.00","5","si","true","https://dunesparfums.com/img/preventa/cdni-iconic.webp","Versátil,Diario,Citas"
"Yara Moi","Lattafa","Árabe","Mujer","100 ml","180.00","149.00","0","false","true","https://dunesparfums.com/img/preventa/yara-moi.webp","Diario,Citas"
"Sauvage Elixir (Borrador Incompleto)","Dior","Diseñador","Hombre","60 ml","650.00","590.00","3","1","false","","Noche,Formal"
"Oud Maracujá","Maison Crivelli","Nicho","Unisex","50 ml","1100.00","950.00","2","true","si","https://dunesparfums.com/img/preventa/oud-maracuja.webp","Noche,Formal"
"Producto Oculto Descontinuado","Marca X","Nicho","Unisex","100 ml","300.00","250.00","0","0","0","","Diario"`;

const FIXTURE_PREVENTA_JSON = [
    {
        nombre: "Khamrah Qahwa",
        marca: "Lattafa",
        categoria: "Árabe",
        genero: "Unisex",
        formato_presentacion: "100 ml",
        precio_regular: 230,
        precio_preventa: 195,
        stock: 8,
        disponible: true,
        visible: true,
        imagen: "https://dunesparfums.com/img/preventa/khamrah-qahwa.webp",
        ocasion: "Citas,Noche"
    },
    {
        nombre: "Club de Nuit Iconic",
        marca: "Armaf",
        categoria: "Árabe",
        genero: "Hombre",
        formato_presentacion: "105 ml",
        precio_regular: 220,
        precio_preventa: 185,
        stock: 5,
        disponible: true,
        visible: true,
        imagen: "https://dunesparfums.com/img/preventa/cdni-iconic.webp",
        ocasion: "Versátil,Diario,Citas"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CSV_SAMPLE_PREVENTA,
        FIXTURE_PREVENTA_JSON
    };
}
