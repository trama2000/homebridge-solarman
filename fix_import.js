
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'solarmanApi.ts');
let content = fs.readFileSync(filePath, 'utf8');
// Remove BOM if present
if (content.charCodeAt(0) === 0xFEFF) content = content.substring(1);
// Insert Logger import after crypto import
content = content.replace(
  "import * as crypto from 'crypto';",
  "import * as crypto from 'crypto';\n"
);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. First 4 lines:');
console.log(content.split('\n').slice(0, 4).join('\n'));
