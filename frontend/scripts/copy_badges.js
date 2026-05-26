/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\YUSIF\\.gemini\\antigravity-ide\\brain\\bb225ef9-d411-4255-a8f1-51da52388f47';
const destDir = path.join(__dirname, '..', 'public', 'badges');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(file => {
    if (file.startsWith('badge_') && file.endsWith('.png')) {
        let newName = file;
        if (file.includes('newcomer')) newName = 'badge_newcomer.png';
        if (file.includes('first_ride')) newName = 'badge_first_ride.png';
        if (file.includes('veteran')) newName = 'badge_veteran.png';
        if (file.includes('5_star')) newName = 'badge_5_star.png';
        if (file.includes('chatterbox')) newName = 'badge_chatterbox.png';
        
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, newName));
        console.log(`Copied ${file} to ${newName}`);
    }
});
