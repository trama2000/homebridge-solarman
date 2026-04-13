import { PlatformAccessory } from 'homebridge';
import { SolarmanPlatform } from './platform';
export type SensorType = 'generation' | 'consumption' | 'battery' | 'surplus';
export declare class SolarSensor {
    private readonly platform;
    private readonly accessory;
    readonly sensorType: SensorType;
    private service;
    private currentValue;
    constructor(platform: SolarmanPlatform, accessory: PlatformAccessory, sensorType: SensorType);
    updateValue(watts: number): void;
}
