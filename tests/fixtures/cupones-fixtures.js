/**
 * Dunes Parfums - Test Fixtures for Coupon System (FASE C7)
 */
const FIXTURE_CUPONES = [
    {
        codigo: "TIODUNES",
        tipo: "monto_fijo",
        valor: 10,
        montoMinimo: 160,
        descuentoMaximo: null,
        fechaInicio: "2026-07-10",
        fechaVencimiento: "2026-07-30",
        activo: true,
        alcance: "todos",
        categoriasPermitidas: [],
        productosPermitidos: [],
        descripcion: "Descuento por lanzamiento de la web",
        orden: 1
    },
    {
        codigo: "DUNES10",
        tipo: "porcentaje",
        valor: 5,
        montoMinimo: 140,
        descuentoMaximo: null,
        fechaInicio: "2026-07-11",
        fechaVencimiento: "2026-07-31",
        activo: true,
        alcance: "todos",
        categoriasPermitidas: [],
        productosPermitidos: [],
        descripcion: "Descuento del 5%",
        orden: 2
    },
    {
        codigo: "DESCUENTOMAX",
        tipo: "porcentaje",
        valor: 50,
        montoMinimo: 100,
        descuentoMaximo: 20,
        fechaInicio: "2026-01-01",
        fechaVencimiento: "2026-12-31",
        activo: true,
        alcance: "todos",
        orden: 3
    },
    {
        codigo: "SOLOARABE",
        tipo: "monto_fijo",
        valor: 15,
        montoMinimo: 100,
        descuentoMaximo: null,
        fechaInicio: "2026-01-01",
        fechaVencimiento: "2026-12-31",
        activo: true,
        alcance: "categorias",
        categoriasPermitidas: ["arabe"],
        orden: 4
    },
    {
        codigo: "SOLODECANTS",
        tipo: "porcentaje",
        valor: 10,
        montoMinimo: 50,
        descuentoMaximo: null,
        fechaInicio: "2026-01-01",
        fechaVencimiento: "2026-12-31",
        activo: true,
        alcance: "categorias",
        categoriasPermitidas: ["decants"],
        orden: 5
    },
    {
        codigo: "SOLOESPECIAL",
        tipo: "monto_fijo",
        valor: 20,
        montoMinimo: 80,
        descuentoMaximo: null,
        fechaInicio: "2026-01-01",
        fechaVencimiento: "2026-12-31",
        activo: true,
        alcance: "productos",
        productosPermitidos: ["p12", "12"],
        orden: 6
    },
    {
        codigo: "INACTIVO",
        tipo: "monto_fijo",
        valor: 10,
        montoMinimo: 0,
        fechaInicio: "2026-01-01",
        fechaVencimiento: "2026-12-31",
        activo: false,
        alcance: "todos",
        orden: 7
    },
    {
        codigo: "VENCIDO",
        tipo: "monto_fijo",
        valor: 10,
        montoMinimo: 0,
        fechaInicio: "2025-01-01",
        fechaVencimiento: "2025-12-31",
        activo: true,
        alcance: "todos",
        orden: 8
    },
    {
        codigo: "FUTURO",
        tipo: "monto_fijo",
        valor: 10,
        montoMinimo: 0,
        fechaInicio: "2027-01-01",
        fechaVencimiento: "2027-12-31",
        activo: true,
        alcance: "todos",
        orden: 9
    }
];

const CSV_SAMPLE_VALID = `codigo,tipo,valor,monto_minimo,descuento_maximo,fecha_inicio,fecha_vencimiento,activo,alcance,categorias_permitidas,productos_permitidos,descripcion,orden
tiodunes,monto_fijo,10,160,,2026-07-10,2026-07-30,TRUE,todos,,,Descuento por lanzamiento de la web,1
DUNES10,porcentaje,5,140,,2026-07-11,2026-07-31,1,todos,,,Descuento del 5%,2
SOLOARABE,monto_fijo,15,100,,2026-01-01,2026-12-31,true,categorias,arabe | Árabe,,,3
SOLOESPECIAL,monto_fijo,20,80,,2026-01-01,2026-12-31,TRUE,productos,,p12 | 12,,4
INACTIVO,monto_fijo,10,0,,2026-01-01,2026-12-31,FALSE,todos,,,Inactivo,5
VENCIDO,monto_fijo,10,0,,2025-01-01,2025-12-31,0,todos,,,Vencido,6
`;

module.exports = {
    FIXTURE_CUPONES,
    CSV_SAMPLE_VALID
};
