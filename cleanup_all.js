const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (let file of list) {
        file = path.resolve(dir, file);
        if (file.includes('node_modules')) continue;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            walk(file, files);
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                files.push(file);
            }
        }
    }
    return files;
}

const files = walk('d:/Downloads/Text_to_Learn Project');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Simplify JSDoc comments
    content = content.replace(/\/\*\*([\s\S]*?)\*\//g, (match, inner) => {
        const lines = inner.split('\n');
        for (const line of lines) {
            const trimmed = line.replace(/^\s*\*\s?/, '').trim();
            if (trimmed && trimmed.length > 0 && !trimmed.startsWith('Props:') && !trimmed.startsWith('Route:') && !trimmed.startsWith('Body:')) {
                return '// ' + trimmed;
            }
        }
        return '';
    });

    // Simplify fancy separator comments
    content = content.replace(/\{\/\*\s*──\s*([^─]+)─*\s*\*\/\}/g, '{/*  */}');
    content = content.replace(/\/\/\s*──\s*([^─\n]+)─*/g, '// ');

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Cleanup complete');
