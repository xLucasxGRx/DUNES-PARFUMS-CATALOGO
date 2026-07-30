# Guía de Gestión y Conversión de Imágenes de Productos (WebP) - Dunes Parfums

Este documento describe la rutina oficial para agregar y mantener imágenes de productos en formato ultra-liviano **WebP**.

---

## Procedimiento para Agregar Nuevas Imágenes de Productos

1. **Guardar la Imagen Original**:
   Guarda el archivo original en formato PNG o JPG en la carpeta:
   `img/productos/`
   *(Ejemplo: `img/productos/LattafaAsadBourbon.png`)*

2. **Ejecutar el Comando de Conversión a WebP**:
   Ejecuta desde la terminal en la raíz del proyecto:
   ```bash
   npm run imagenes:webp
   ```
   *(Este comando procesa automáticamente las imágenes de `img/productos/`, redimensiona a un máximo de 800px si es necesario, conserva la transparencia y genera el archivo `.webp` con calidad 88%).*

3. **Registrar la Ruta `.webp` en Google Sheets**:
   En la columna **`imagen`** de Google Sheets, registra directamente la ruta con extensión `.webp`:
   `img/productos/LattafaAsadBourbon.webp`

4. **Verificar en el Navegador**:
   Abre la web localmente o tras sincronizar para confirmar que el producto carga limpiamente sin errores 404.

5. **Eliminar el Archivo Original PNG/JPG**:
   Una vez verificado que el producto carga correctamente desde la ruta `.webp`, puedes eliminar la versión `.png` o `.jpg` original de la carpeta `img/productos/`.

---

## Estructura de Reportes
El archivo `tools/rutas-productos-webp.csv` contiene el mapa completo de migración de PNG a WebP para soporte en la actualización manual de Google Sheets.
