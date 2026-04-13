import { PlatformAccessory } from 'homebridge';
import { SolarmanPlatform } from './platform';
export type SensorType = 'generation' | 'consumption' | 'battery' | 'surplus' | 'batteryPower' | 'chargePower' | 'dischargePower' | 'purchasePower' | 'irradiance';
export declare class SolarSensor {
    private readonly platform;
    private readonly accessory;
    readonly sensorType: SensorType;
    private service;
    private currentValue;
    constructor(platform: SolarmanPlatform, accessory: PlatformAccessory, sensorType: SensorType);
    updateValue(value: number): void;
}
