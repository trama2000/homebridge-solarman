import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SolarmanApi } from './solarmanApi';
import { SolarSensor, SensorType } from './solarSensor';

const SENSOR_TYPES: SensorType[] = ['generation', 'consumption', 'battery', 'surplus', 'batteryPower', 'chargePower', 'dischargePower', 'purchasePower', 'gridExport'];

export class SolarmanPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public solarApi!: SolarmanApi;
  private pollingInterval: number;
  private sensors: SolarSensor[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.pollingInterval = (config.pollingInterval || 60) * 1000;
    this.api.on('didFinishLaunching', () => this.onReady());
  }

  private readonly cachedAccessories: PlatformAccessory[] = [];

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Restoring cached accessory:', accessory.displayName);
    this.cachedAccessories.push(accessory);
  }

  private async onReady(): Promise<void> {
    if (!this.config.email || !this.config.password) {
      this.log.error('Missing email or password in config');
      return;
    }
    this.solarApi = new SolarmanApi(
      this.config.email,
      this.config.password,
      this.config.plantId,
      this.log,
      this.config.token,
    );

    try {
      await this.solarApi.login();
    } catch {
      this.log.error('Failed to connect to SOLARMAN');
      return;
    }

    // Register or restore 4 sensor accessories
    const newAccessories: PlatformAccessory[] = [];
    for (const sType of SENSOR_TYPES) {
      const uuid = this.api.hap.uuid.generate(PLUGIN_NAME + '-' + sType);
      let accessory = this.cachedAccessories.find(a => a.UUID === uuid);
      if (!accessory) {
        accessory = new this.api.platformAccessory('Solar ' + sType, uuid);
        newAccessories.push(accessory);
        this.log.info('Creating new accessory:', sType);
      } else {
        this.log.info('Restoring cached accessory:', sType);
      }
      const sensor = new SolarSensor(this, accessory, sType);
      this.sensors.push(sensor);
    }
    if (newAccessories.length > 0) {
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, newAccessories);
    }
    // Remove obsolete cached accessories (e.g. old 'irradiance' sensor)
    const validSubtypes = new Set(SENSOR_TYPES.map(t => 'Solar ' + t));
    const orphans = this.cachedAccessories.filter(a => !validSubtypes.has(a.context?.subtype || ''));
    if (orphans.length > 0) {
      this.log.info('Removing ' + orphans.length + ' obsolete cached accessories');
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, orphans);
    }

    this.log.info('Total solar sensors: ' + this.sensors.length);

    // Start polling
    this.poll();
    setInterval(() => this.poll(), this.pollingInterval);
  }

  private async poll(): Promise<void> {
    try {
      const data = await this.solarApi.getData();
      const genKW = data.generationPower / 1000;
      const useKW = data.usePower / 1000;
      const surplusKW = Math.max(0, genKW - useKW);
      for (const s of this.sensors) {
        switch (s.sensorType) {
          case 'generation': s.updateValue(genKW); break;
          case 'consumption': s.updateValue(useKW); break;
          case 'battery': s.updateValue(data.batterySoc); break;
          case 'surplus': s.updateValue(surplusKW); break;
          case 'batteryPower': s.updateValue(data.batteryPower / 1000); break;
          case 'chargePower': s.updateValue(data.chargePower / 1000); break;
          case 'dischargePower': s.updateValue(data.dischargePower / 1000); break;
          case 'purchasePower': s.updateValue(data.purchasePower / 1000); break;
          case 'gridExport': s.updateValue(Math.max(0, data.gridPower) / 1000); break;
        }
      }
      this.log.info(`[Solarman] Poll: gen=${genKW}kW use=${useKW}kW bat=${data.batterySoc}% surplus=${surplusKW}kW batPwr=${(data.batteryPower/1000).toFixed(1)}kW charge=${(data.chargePower/1000).toFixed(1)}kW discharge=${(data.dischargePower/1000).toFixed(1)}kW grid=${(data.gridPower/1000).toFixed(2)}kW buy=${(data.purchasePower/1000).toFixed(1)}kW${data.irradiateIntensity ? ' irrad=' + data.irradiateIntensity + 'W/m2' : ''}`);
    } catch (e) {
      this.log.error('Polling failed:', String(e));
    }
  }
}