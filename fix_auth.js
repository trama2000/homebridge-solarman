const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Fix 1: ensureAuth should only forceOAuth when there's no token
// If token exists but expired, that's when we force OAuth
c = c.replace(
  'async ensureAuth(): Promise<void> {\r\n    if (!this.token || Date.now() > this.tokenExpiry - 60000) {\r\n      await this.login(true);\r\n    }\r\n  }',
  'async ensureAuth(): Promise<void> {\r\n    if (!this.token || Date.now() > this.tokenExpiry - 60000) {\r\n      await this.login();\r\n    }\r\n  }'
);

// Fix 2: Add Authorization header in the interceptor alongside query param
c = c.replace(
  "config.params.token = this.token;",
  "config.params.token = this.token;\r\n        config.headers = config.headers || {};\r\n        config.headers['Authorization'] = 'Bearer ' + this.token;"
);

// Fix 3: Add diagnostic logging after login to show token length
c = c.replace(
  "this.log.info('[Solarman] Authenticated successfully');",
  "this.log.info('[Solarman] Authenticated successfully, token length:', this.token?.length, 'expires in:', Math.round((this.tokenExpiry - Date.now()) / 1000), 's');"
);

// Fix 4: Add logging in _getDataInner to show what token is being used
c = c.replace(
  'private async _getDataInner(): Promise<SolarData> {',
  'private async _getDataInner(): Promise<SolarData> {\r\n    this.log.info("[Solarman] _getDataInner using token length:", this.token?.length, "plantId:", this.plantId);'
);

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Done');
