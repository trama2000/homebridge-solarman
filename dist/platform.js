"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarmanPlatform = void 0;
const settings_1 = require("./settings");
const solarmanApi_1 = require("./solarmanApi");
const solarSensor_1 = require("./solarSensor");
const SENSOR_TYPES = ['generation', 'consumption', 'battery', 'surplus', 'batteryPower', 'chargePower', 'dischargePower', 'purchasePower', 'gridExport'];
class SolarmanPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.sensors = [];
        this.cachedAccessories = [];
        this.pollingInterval = (config.pollingInterval || 60) * 1000;
        this.api.on('didFinishLaunching', () => this.onReady());
    }
    configureAccessory(accessory) {
        this.log.info('Restoring cached accessory:', accessory.displayName);
        this.cachedAccessories.push(accessory);
    }
    async onReady() {
        if (!this.config.email || !this.config.password) {
            this.log.error('Missing email or password in config');
            return;
        }
        this.solarApi = new solarmanApi_1.SolarmanApi(this.config.email, this.config.password, this.config.plantId, this.log, this.config.token);
        try {
            await this.solarApi.login();
        }
        catch {
            this.log.error('Failed to connect to SOLARMAN');
            return;
        }
        // Register or restore 4 sensor accessories
        const newAccessories = [];
        for (const sType of SENSOR_TYPES) {
            const uuid = this.api.hap.uuid.generate(settings_1.PLUGIN_NAME + '-' + sType);
            let accessory = this.cachedAccessories.find(a => a.UUID === uuid);
            if (!accessory) {
                accessory = new this.api.platformAccessory('Solar ' + sType, uuid);
                newAccessories.push(accessory);
                this.log.info('Creating new accessory:', sType);
            }
            else {
                this.log.info('Restoring cached accessory:', sType);
            }
            const sensor = new solarSensor_1.SolarSensor(this, accessory, sType);
            this.sensors.push(sensor);
        }
        if (newAccessories.length > 0) {
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, newAccessories);
        }
        // Remove obsolete cached accessories (e.g. old 'irradiance' sensor)
        const validSubtypes = new Set(SENSOR_TYPES.map(t => 'Solar ' + t));
        const orphans = this.cachedAccessories.filter(a => !validSubtypes.has(a.context?.subtype || ''));
        if (orphans.length > 0) {
            this.log.info('Removing ' + orphans.length + ' obsolete cached accessories');
            this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, orphans);
        }
        this.log.info('Total solar sensors: ' + this.sensors.length);
        // Start polling
        this.poll();
        setInterval(() => this.poll(), this.pollingInterval);
    }
    async poll() {
        try {
            const data = await this.solarApi.getData();
            const genKW = data.generationPower / 1000;
            const useKW = data.usePower / 1000;
            const surplusKW = parseFloat(Math.max(0, genKW - useKW).toFixed(2));
            for (const s of this.sensors) {
                switch (s.sensorType) {
                    case 'generation':
                        s.updateValue(genKW);
                        break;
                    case 'consumption':
                        s.updateValue(useKW);
                        break;
                    case 'battery':
                        s.updateValue(data.batterySoc);
                        break;
                    case 'surplus':
                        s.updateValue(surplusKW);
                        break;
                    case 'batteryPower':
                        s.updateValue(data.batteryPower / 1000);
                        break;
                    case 'chargePower':
                        s.updateValue(data.chargePower / 1000);
                        break;
                    case 'dischargePower':
                        s.updateValue(data.dischargePower / 1000);
                        break;
                    case 'purchasePower':
                        s.updateValue(data.purchasePower / 1000);
                        break;
                    case 'gridExport':
                        s.updateValue(Math.max(0, data.gridPower) / 1000);
                        break;
                }
            }
            this.log.info(`[Solarman] Poll: gen=${genKW}kW use=${useKW}kW bat=${data.batterySoc}% surplus=${surplusKW}kW batPwr=${(data.batteryPower / 1000).toFixed(1)}kW charge=${(data.chargePower / 1000).toFixed(1)}kW discharge=${(data.dischargePower / 1000).toFixed(1)}kW grid=${(data.gridPower / 1000).toFixed(2)}kW buy=${(data.purchasePower / 1000).toFixed(1)}kW${data.irradiateIntensity ? ' irrad=' + data.irradiateIntensity + 'W/m2' : ''}`);
        }
        catch (e) {
            this.log.error('Polling failed:', String(e));
        }
    }
}
exports.SolarmanPlatform = SolarmanPlatform;
