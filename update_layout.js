const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const referenceFile = path.join(rootDir, 'ant-exterminator-worcester-ma', 'index.html');

const content = fs.readFileSync(referenceFile, 'utf8');

// Extract Header
const headerRegex = /<div class="sticky top-0 z-50 flex flex-col w-full shadow-sm">[\s\S]*?<\/header>\r?\n  <\/div>\r?\n\r?\n  <script>[\s\S]*?<\/script>/;
const headerMatch = content.match(headerRegex);
const newHeader = headerMatch ? headerMatch[0] : null;

// Extract Footer
const footerRegex = /<!-- Footer -->\r?\n  <footer[\s\S]*?<\/footer>/;
const footerMatch = content.match(footerRegex);
const newFooter = footerMatch ? footerMatch[0] : null;

if (!newHeader || !newFooter) {
    console.error("Could not extract header or footer from reference file.");
    process.exit(1);
}

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.html') && !file.startsWith('google')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const htmlFiles = walkDir(rootDir);

let updatedCount = 0;

htmlFiles.forEach(file => {
    let fileContent = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace header
    const fileHeaderMatch = fileContent.match(/<div class="sticky top-0 z-50 flex flex-col w-full shadow-sm">[\s\S]*?<\/header>\r?\n  <\/div>(\r?\n\r?\n  <script>[\s\S]*?<\/script>)?/);
    if (fileHeaderMatch) {
        if (fileHeaderMatch[0] !== newHeader) {
            fileContent = fileContent.replace(fileHeaderMatch[0], newHeader);
            changed = true;
        }
    } else {
        console.warn(`Header not found in ${file}`);
    }

    // Replace footer
    const fileFooterMatch = fileContent.match(/<!-- Footer -->[\s\S]*?<footer[\s\S]*?<\/footer>/);
    if (fileFooterMatch) {
        if (fileFooterMatch[0] !== newFooter) {
            fileContent = fileContent.replace(fileFooterMatch[0], newFooter);
            changed = true;
        }
    } else {
        console.warn(`Footer not found in ${file}`);
    }

    if (changed) {
        fs.writeFileSync(file, fileContent, 'utf8');
        updatedCount++;
    }
});

console.log(`Updated ${updatedCount} files.`);
