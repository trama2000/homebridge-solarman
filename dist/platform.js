"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarmanPlatform = void 0;
const settings_1 = require("./settings");
const solarmanApi_1 = require("./solarmanApi");
const solarSensor_1 = require("./solarSensor");
const SENSOR_TYPES = ['generation', 'consumption', 'battery', 'surplus'];
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
            const surplusKW = Math.max(0, genKW - useKW);
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
                }
            }
            this.log.info('[Solarman] Poll: gen=' + genKW.toFixed(1) + 'kW use=' + useKW.toFixed(1) + 'kW bat=' + data.batterySoc + '% surplus=' + surplusKW.toFixed(1) + 'kW');
        }
        catch (e) {
            this.log.error('Polling failed:', String(e));
        }
    }
}
exports.SolarmanPlatform = SolarmanPlatform;
