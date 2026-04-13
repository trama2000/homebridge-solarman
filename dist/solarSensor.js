"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarSensor = void 0;
const SENSOR_CONFIG = {
    generation: { name: 'Generación Solar', unit: 'kW' },
    consumption: { name: 'Consumo Casa', unit: 'kW' },
    battery: { name: 'Batería', unit: '%' },
    surplus: { name: 'Excedente', unit: 'kW' },
    batteryPower: { name: 'Potencia Batería', unit: 'kW' },
    chargePower: { name: 'Carga Batería', unit: 'kW' },
    dischargePower: { name: 'Descarga Batería', unit: 'kW' },
    purchasePower: { name: 'Compra Red', unit: 'kW' },
    irradiance: { name: 'Irradiancia Solar', unit: 'W/m²' },
};
class SolarSensor {
    constructor(platform, accessory, sensorType) {
        this.platform = platform;
        this.accessory = accessory;
        this.sensorType = sensorType;
        this.currentValue = 0;
        const config = SENSOR_CONFIG[sensorType];
        const C = this.platform.Characteristic;
        // Info service
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(C.Manufacturer, 'SOLARMAN')
            .setCharacteristic(C.Model, 'Solar Monitor')
            .setCharacteristic(C.SerialNumber, 'SM-' + sensorType);
        // Thermostat service (dummy - for visibility in Apple Home)
        this.service = this.accessory.getService(this.platform.Service.Thermostat)
            || this.accessory.addService(this.platform.Service.Thermostat);
        this.service.setCharacteristic(C.Name, config.name);
        // Lock to OFF mode (read-only thermostat)
        this.service.getCharacteristic(C.CurrentHeatingCoolingState)
            .onGet(() => 0);
        this.service.getCharacteristic(C.TargetHeatingCoolingState)
            .onGet(() => 0)
            .onSet(() => {
            this.service.updateCharacteristic(C.TargetHeatingCoolingState, 0);
        })
            .setProps({ validValues: [0] });
        // Current temperature = our value
        this.service.getCharacteristic(C.CurrentTemperature)
            .setProps({ minValue: 0, maxValue: 10000, minStep: 0.1 })
            .onGet(() => this.currentValue);
        // Target temperature = mirror current (read-only)
        this.service.getCharacteristic(C.TargetTemperature)
            .setProps({ minValue: 0, maxValue: 10000, minStep: 0.1 })
            .onGet(() => this.currentValue)
            .onSet(() => {
            this.service.updateCharacteristic(C.TargetTemperature, this.currentValue);
        });
        // Temperature display units (Celsius)
        this.service.getCharacteristic(C.TemperatureDisplayUnits)
            .onGet(() => 0)
            .onSet(() => {
            this.service.updateCharacteristic(C.TemperatureDisplayUnits, 0);
        });
        // Initialize characteristics to avoid HAP warnings from cached values
        this.service.updateCharacteristic(C.CurrentTemperature, 0);
        this.service.updateCharacteristic(C.TargetTemperature, 0);
        this.service.updateCharacteristic(C.CurrentHeatingCoolingState, 0);
        this.service.updateCharacteristic(C.TargetHeatingCoolingState, 0);
    }
    updateValue(value) {
        let display;
        if (this.sensorType === 'battery') {
            // Battery SOC is already in %
            display = Math.round(value);
        }
        else if (this.sensorType === 'irradiance') {
            // Irradiance is in W/m², show as integer
            display = Math.max(0, Math.round(value));
        }
        else {
            // Value is already in kW from poll(), just round for display
            display = Math.max(0, Math.round(value * 10) / 10);
        }
        this.currentValue = display;
        const C = this.platform.Characteristic;
        this.service.updateCharacteristic(C.CurrentTemperature, display);
        this.service.updateCharacteristic(C.TargetTemperature, display);
    }
}
exports.SolarSensor = SolarSensor;
