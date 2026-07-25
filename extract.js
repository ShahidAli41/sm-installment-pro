const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let targetScript = '';
for (const match of scripts) {
  if (match[1].includes('calcIC')) {
    targetScript = match[1];
    break;
  }
}
if (targetScript) {
  fs.writeFileSync('test.js', targetScript);
  console.log('Extracted main script to test.js');
} else {
  console.log('Main script not found');
}
