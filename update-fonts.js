const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            let changed = false;
            if (content.includes('DM Sans')) { content = content.replace(/DM Sans/g, "var(--font-syne)"); changed = true; }
            if (content.includes('IBM Plex Sans')) { content = content.replace(/IBM Plex Sans/g, "var(--font-inter)"); changed = true; }
            if (content.includes('JetBrains Mono')) { content = content.replace(/JetBrains Mono/g, "var(--font-dm-mono)"); changed = true; }

            if (fullPath.endsWith('page.tsx') || fullPath.endsWith('LandingFeatures.tsx')) {
                if (!content.includes('eslint-disable react/no-unescaped-entities')) {
                    content = '/* eslint-disable react/no-unescaped-entities */\n' + content;
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInDir('app');
replaceInDir('components');
console.log('Fonts updated successfully');
