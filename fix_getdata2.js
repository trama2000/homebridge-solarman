const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Find the getData method start and end
const getDataStart = c.indexOf('  async getData(): Promise<SolarData>');
if (getDataStart === -1) { console.log('ERROR: getData not found'); process.exit(1); }

// Find the end of getData - it ends with "  }\n\n" (closing brace of the last method before the class closing brace)
// The structure after getData is: closing "  }\n}" or "  }\n\n"
// Let's find the class closing brace
const classClose = c.lastIndexOf('}');
// getData's closing is the last "  }\n" before the class close
let pos = getDataStart;
let braceCount = 0;
let inString = false;
let getDataEnd = -1;

// Simple approach: count from the start of getData
// The method has nested try/catch, so we need to track braces
const methodBody = c.substring(getDataStart);
let depth = 0;
let started = false;
for (let i = 0; i < methodBody.length; i++) {
  if (methodBody[i] === '{') { depth++; started = true; }
  if (methodBody[i] === '}') { depth--; }
  if (started && depth === 0) {
    getDataEnd = getDataStart + i + 1;
    break;
  }
}

if (getDataEnd === -1) { console.log('ERROR: could not find end of getData'); process.exit(1); }

console.log('getData from', getDataStart, 'to', getDataEnd);
console.log('Old getData length:', getDataEnd - getDataStart);
console.log('Old getData preview:', c.substring(getDataStart, getDataStart + 80));

const newGetData = `  async getData(): Promise<SolarData> {
    return this._getDataInner().catch(async (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        this.log.warn('[Solarman] Token expired (401), re-authenticating with OAuth...');
        this.token = '';
        this.tokenExpiry = 0;
        this.plantId = undefined;
        await this.login(true);
        return this._getDataInner();
      }
      throw e;
    });
  }

  private async _getDataInner(): Promise<SolarData> {
    await this.ensureAuth();
    const plantId = await this.getPlantId();
    const res = await this.client.post(
      '/maintain-s/operating/station/search', { page: 1, size: 10 },
    );
    const plant = res.data?.data?.[0];
    if (!plant) {
      throw new Error('Plant not found: ' + plantId);
    }
    return {
      generationPower: plant.generationPower || 0,
      usePower: plant.usePower || 0,
      batterySoc: plant.batterySoc || 0,
      buyPower: plant.buyPower || 0,
      gridPower: plant.gridPower || 0,
      batteryPower: plant.batteryPower || 0,
      chargePower: plant.chargePower || 0,
      dischargePower: plant.dischargePower || 0,
      purchasePower: plant.purchasePower || 0,
      irradiateIntensity: plant.irradiateIntensity || 0,
    };
  }`;

c = c.substring(0, getDataStart) + newGetData + c.substring(getDataEnd);

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Written. New file length:', c.length);
console.log('Verify start:', c.substring(0, 50));
