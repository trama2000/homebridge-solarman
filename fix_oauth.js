
const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Fix 1: Change login signature to accept forceOAuth parameter
c = c.replace(
  'async login(): Promise<void> {',
  'async login(forceOAuth = false): Promise<void> {'
);

// Fix 2: Change preToken check to respect forceOAuth  
c = c.replace(
  'if (this.preToken) {',
  'if (this.preToken && !forceOAuth) {'
);

// Fix 3: Change 401 retry to use forceOAuth=true
c = c.replace(
  "re-authenticating...');",
  "re-authenticating with OAuth...');"
);
c = c.replace(
  'await this.login();',
  'await this.login(true);'
);

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Done');
