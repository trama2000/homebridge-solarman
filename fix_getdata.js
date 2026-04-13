
const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Replace the entire getData method with a version that wraps everything
// including getPlantId in the retry logic

const oldGetData = c.substring(
  c.indexOf('async getData(): Promise<SolarData>'),
  c.indexOf('\n  }\n\n', c.indexOf('async getData(): Promise<SolarData>')) + 5
);

const newGetData = `async getData(): Promise<SolarData> {
    return this._getDataInner().catch(async (e) => {
      // If any API call returned 401, re-authenticate with OAuth and retry once
      const axios = require('axios');
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        this.log.warn('[Solarman] Token expired (401), re-authenticating with OAuth...');
        this.token = '';
        this.tokenExpiry = 0;
        this.plantId = undefined; // force re-fetch of plantId too
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

c = c.replace(oldGetData, newGetData);

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Replaced getData. Old length:', oldGetData.length, 'New length:', newGetData.length);
