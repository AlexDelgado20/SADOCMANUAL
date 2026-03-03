const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/alexa/source/repos/SADOCMANUALWEB2/SADOC_CONTABILIDAD/Mantenimiento_General';
const newDocs = {};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.resolve(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.cshtml')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk(baseDir);

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const startIdx = content.indexOf('<section class="doc-section">');
    if (startIdx !== -1) {
        const endIdx = content.lastIndexOf('</section>');
        if (endIdx !== -1) {
            const htmlChunk = content.substring(startIdx, endIdx + 10);

            // Clean up backslashes and quotes to be plain string
            const cleanHtml = htmlChunk.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();

            let filename = path.basename(f, '.cshtml').replace(/_/g, ' ');

            // Normalize names
            if (filename === 'Definir Caja por Personal') filename = 'Definir Caja por Personal';
            if (filename === 'Generales de la Caja') filename = 'Cajas';
            if (filename === 'Catalogo Ciudad') filename = 'Catálogo de Ciudad';
            if (filename === 'Catalogo Cliente') filename = 'Catálogo del Cliente';
            if (filename === 'Catalogo de Unidad Radio') filename = 'Catálogo de Unidad de Radio';
            if (filename === 'Clasificacion Cliente') filename = 'Clasificación de Cliente';
            if (filename === 'Generales del Itbm') filename = 'Generales del ITBM';
            if (filename === 'Generales del Pers') filename = 'Generales del Personal';
            if (filename === 'Generales del Tipo de Pers') filename = 'Generales del Tipo de Personal';
            if (filename === 'Generales del Vdo') filename = 'Generales del Vendedor';
            if (filename === 'Generales de la Bdga') filename = 'Generales de la Bodega';
            if (filename === 'Generales de la Cía') filename = 'Generales de la Compañía';
            if (filename === 'Catalogo del Inventario Reducido') filename = 'Generales del Inventario Reducido';
            if (filename === 'Catalogo de Inventario Detallado') filename = 'Generales del Inventario Detallado';
            if (filename === 'Definir Conversion') filename = 'Definir Conversiones';
            if (filename === 'Definir Descuentos Venta') filename = 'Definir Descuento para la Venta';
            if (filename === 'Definir Ganancia por Inventario') filename = 'Definir Ganancia por Inventario';
            if (filename === 'Definir Ganancia por Inventario Porcentajes Indeterminado') filename = 'Definir Ganancia por Inventario - Porcentajes Indeterminados';
            if (filename === 'Definir Inventario Excel') filename = 'Definir Inventario desde Excel';
            if (filename === 'Definir Precio de Venta Fijo por Inventario') filename = 'Definir Precio de Venta Fijo por Inventario';
            if (filename === 'Generales del Inventario Impresion') filename = 'Generales del Inventario - Impresión';
            if (filename === 'Generales de la Ganancia') filename = 'Generales de la Ganancia';
            if (filename === 'Catalogo del Banco') filename = 'Catálogo de Banco';
            if (filename === 'Catalogo del Proveedor') filename = 'Catálogo del Proveedor';
            if (filename === 'Catalogo de Ciudades') filename = 'Catálogo de Ciudades';
            if (filename === 'Clasificacion de Proveedor') filename = 'Clasificación de Proveedor';

            newDocs[filename] = cleanHtml;
        }
    }
});

fs.writeFileSync('C:/tmp/extraDocs.json', JSON.stringify(newDocs, null, 2));
console.log('Docs extracted to C:/tmp/extraDocs.json');
