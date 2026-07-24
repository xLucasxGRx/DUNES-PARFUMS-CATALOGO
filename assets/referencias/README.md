# Galería de Confianza - Dunes Parfums

Carpeta organizada para las fotografías y capturas de pantalla de la Galería de Confianza.

## Subcarpetas por Categoría

1. `assets/referencias/entregas/`
   - Fotografías de entregas locales realizadas a clientes.
   - Tipo en JSON: `"tipo": "entrega"`

2. `assets/referencias/envios/`
   - Comprobantes y fotografias de paquetes enviados por agencia a provincia.
   - Tipo en JSON: `"tipo": "envio"`

3. `assets/referencias/decants/`
   - Fotografías de frascos atomizadores de decants (3ml, 5ml, 10ml) preparados.
   - Tipo en JSON: `"tipo": "decant"`

4. `assets/referencias/nuestros-perfumes/`
   - Fotografías reales de frascos de perfumes sellados en stock.
   - Tipo en JSON: `"tipo": "perfume"`

## Formato del archivo `data/referencias.json`

```json
[
  {
    "id": 1,
    "imagen": "assets/referencias/entregas/entrega-001.webp",
    "alt": "Entrega realizada en Tarapoto",
    "tipo": "entrega",
    "descripcion": "Entrega confirmada en Tarapoto",
    "visible": true,
    "destacada": true,
    "orden": 1
  }
]
```
