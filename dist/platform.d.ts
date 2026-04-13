import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { SolarmanApi } from './solarmanApi';
export declare class SolarmanPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    solarApi: SolarmanApi;
    private pollingInterval;
    private sensors;
    constructor(log: Logger, config: PlatformConfig, api: API);
    private readonly cachedAccessories;
    configureAccessory(accessory: PlatformAccessory): void;
    private onReady;
    private poll;
}
