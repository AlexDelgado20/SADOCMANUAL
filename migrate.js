const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'SADOC_CONTABILIDAD');
const destImgDir = path.join(__dirname, 'assets', 'img');
const outputJsPath = path.join(__dirname, 'docContent.js');

if (!fs.existsSync(destImgDir)) {
    fs.mkdirSync(destImgDir, { recursive: true });
}

const docMap = {};
const menuSchema = [];

function ensureArrayOrString(val) {
    return Array.isArray(val) ? val : (val ? [val] : []);
}

function normalizeTitle(str) {
    if (!str) return 'Untitled';
    return str.replace(' - Soft Solution', '').trim();
}

// Function to recursively walk directory
function walkDir(dir, treeNode) {
    const items = fs.readdirSync(dir);

    // Sort items: folders first, then files
    const folders = [];
    const files = [];
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            if (item.toUpperCase() !== 'IMGPARAMETROS' && !item.toUpperCase().includes('IMAGENES')) {
                folders.push(item);
            }
        } else if (item.endsWith('.cshtml')) {
            files.push(item);
        }
    }

    // Process files here
    for (const file of files) {
        const fullPath = path.join(dir, file);
        let content = fs.readFileSync(fullPath, 'utf8');

        // Extract title from <h1> or <title>
        let titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (!titleMatch) {
            titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
        }
        const extractedTitle = normalizeTitle(titleMatch ? titleMatch[1] : path.basename(file, '.cshtml'));

        // Extract partial HTML
        let htmlFragment = '';
        const sectionMatch = content.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

        if (sectionMatch) {
            htmlFragment = `<section class="doc-section">${sectionMatch[1]}</section>`;
        } else if (bodyMatch) {
            htmlFragment = bodyMatch[1];
            // Remove preloader & scripts
            htmlFragment = htmlFragment.replace(/<div id="preloader"[^>]*>[\s\S]*?<\/div>/gi, '');
            htmlFragment = htmlFragment.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else {
            console.log("No body/section found in " + fullPath);
            continue;
        }

        // Fix image paths
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let imgMatch;
        let modifiedHtml = htmlFragment;

        while ((imgMatch = imgRegex.exec(htmlFragment)) !== null) {
            const originalSrc = imgMatch[1];
            if (originalSrc.includes('SADOC_CONTABILIDAD')) {
                // Determine original file system path assuming /Pages is mapped to site root
                // originalSrc could be /Pages/SADOC_CONTABILIDAD/Configuración_del_Sistema/Parametros/IMGParametros/PaCon.jpeg
                let relPath = originalSrc;
                if (relPath.startsWith('/Pages/SADOC_CONTABILIDAD')) {
                    relPath = relPath.replace('/Pages/SADOC_CONTABILIDAD', '');
                } else if (relPath.startsWith('SADOC_CONTABILIDAD')) {
                    relPath = relPath.replace('SADOC_CONTABILIDAD', '');
                }

                const absSrcPath = path.join(srcDir, relPath.replace(/\//g, path.sep));
                const imgFileName = path.basename(absSrcPath);
                // Basic avoid collision strategy
                const newImgName = Date.now().toString().slice(-4) + '_' + imgFileName;
                const finalImgPath = path.join(destImgDir, newImgName);

                if (fs.existsSync(absSrcPath)) {
                    fs.copyFileSync(absSrcPath, finalImgPath);
                    modifiedHtml = modifiedHtml.replace(originalSrc, `./assets/img/${newImgName}`);
                } else {
                    console.log(`Warning: Image not found locally: ${absSrcPath}`);
                }
            }
        }

        // Let's add external styles into it? better just remove inline style ref
        // Wait, some pages load CSS. E.g., <link rel="stylesheet" href="...cshtml.css">
        // It's probably better to load these files statically if needed or just let the main css handle it.
        // We will assume the main stylesheet will handle basic formatting.

        // Store
        docMap[extractedTitle] = modifiedHtml;
        treeNode.children.push({ text: extractedTitle });
    }

    // Process sub folders
    for (const folder of folders) {
        // Humanize folder name for menu (e.g. Configuración_del_Sistema -> Configuración del Sistema)
        const folderName = folder.replace(/_/g, ' ');
        const newBranch = { text: folderName, children: [] };
        treeNode.children.push(newBranch);

        walkDir(path.join(dir, folder), newBranch);

        // Remove branch if empty
        if (newBranch.children.length === 0) {
            treeNode.children.pop();
        }
    }
}

const rootTree = { children: [] };
walkDir(srcDir, rootTree);

// Now write out the JS
const finalJs = `
// Auto-generated by migrate.js
window.docMap = ${JSON.stringify(docMap, null, 2)};
window.generatedNavigationData = ${JSON.stringify(rootTree.children, null, 2)};
`;

fs.writeFileSync(outputJsPath, finalJs, 'utf8');
console.log("Migration complete. Built " + outputJsPath);
