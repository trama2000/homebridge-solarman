import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { Logger } from 'homebridge';

export interface SolarData {
  generationPower: number; // W
  usePower: number;        // W
  batterySoc: number;      // %
  buyPower: number;        // W (negative = selling)
  gridPower: number;       // W
}

export class SolarmanApi {
  private client: AxiosInstance;
  private token = '';
  private tokenExpiry = 0;
  private plantId: number | undefined;
  private preToken: string;

  constructor(
    private readonly email: string,
    private readonly password: string,
    plantId: number | undefined,
    private readonly log: Logger,
    preToken?: string,
  ) {
    this.plantId = plantId;
    this.preToken = preToken || '';
    this.client = axios.create({
      baseURL: 'https://globalpro.solarmanpv.com',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd).digest('hex');
  }

  async login(): Promise<void> {
    // If a pre-configured token is provided, use it directly (skip OAuth)
    if (this.preToken) {
      this.token = this.preToken;
      this.tokenExpiry = Date.now() + 86400000 * 30; // 30 days
      this.client.defaults.headers.common['Authorization'] = 'Bearer ' + this.token;
      this.log.info('[Solarman] Using pre-configured token');
      return;
    }
    try {
      this.log.info('[Solarman] Attempting login to globalpro.solarmanpv.com...');
      const res = await this.client.post('/oauth-s/oauth/token', null, {
        params: {
          grant_type: 'mdc_password',
          username: this.email,
          clear_text_pwd: this.password,
          password: this.hashPassword(this.password),
          identity_type: 2,
          client_id: 'test',
          mdc: 'FOREIGN_1',
        },
      });
      this.token = res.data.access_token;
      this.tokenExpiry = Date.now() + (res.data.expires_in || 86400) * 1000;
      this.client.defaults.headers.common['Authorization'] = 'Bearer ' + this.token;
      this.log.info('[Solarman] Authenticated successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error('[Solarman] Login failed -', msg);
      throw e;
    }
  }

  private async ensureAuth(): Promise<void> {
    if (!this.token || Date.now() > this.tokenExpiry - 60000) {
      await this.login();
    }
  }

  private async getPlantId(): Promise<number> {
    if (this.plantId) return this.plantId;
    await this.ensureAuth();
    const res = await this.client.post(
      '/maintain-s/operating/station/search?page=1&size=10', {},
    );
    const plants = res.data?.data;
    if (!plants || plants.length === 0) {
      throw new Error('No plants found in SOLARMAN account');
    }
    this.plantId = plants[0].id as number;
    this.log.info('[Solarman] Auto-detected plant:', plants[0].name, '(ID:', this.plantId, ')');
    return this.plantId!;
  }

  async getData(): Promise<SolarData> {
    await this.ensureAuth();
    const plantId = await this.getPlantId();
    const res = await this.client.post(
      '/maintain-s/operating/station/search?page=1&size=10', {},
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
    };
  }
}