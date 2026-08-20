const fs = require('fs');
const path = require('path');

const files = [
    'client/src/components/layout/MainLayout.jsx',
    'client/src/components/CoursePDFExporter.jsx',
    'client/src/components/LessonPDFExporter.jsx',
    'client/src/pages/CourseView.jsx',
    'server/controllers/courseController.js',
    'client/src/components/blocks/MCQBlock.jsx',
    'client/src/components/blocks/CodeBlock.jsx',
    'client/src/components/blocks/LessonRenderer.jsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Simplify JSDoc comments to single line // comments
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

    // Remove numbered step comments
    content = content.replace(/^\s*\/\/\s*\d+[a-z]?\.\s+.*$\n/gm, '');

    // Target specific long comments
    content = content.replace(/\/\/ Deduplication:[\s\S]*?duplicate documents in the database\./g, '// Deduplication check');
    content = content.replace(/\/\/ Fetch the user's courses[\s\S]*?module → lesson structure\./g, '// Fetch user courses');
    content = content.replace(/\/\/ Delete a course by ID[\s\S]*?without a full page refresh\./g, '// Delete course by ID and update UI');
    content = content.replace(/\/\/ Prefer the verified JWT subject[\s\S]*?legacy \/ unauthenticated dev-mode calls\./g, '// Resolve creator ID');

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Cleanup complete');
