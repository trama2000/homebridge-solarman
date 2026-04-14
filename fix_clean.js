const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');
c = c.replace(
  "this.log.info('[Solarman] Raw API fields:', JSON.stringify(Object.keys(plant)));\r\n    this.log.info('[Solarman] Raw values:', JSON.stringify(plant, null, 0));\r\n    ",
  ""
);
fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Cleaned raw logs');
