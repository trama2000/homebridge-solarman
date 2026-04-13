import { Logger } from 'homebridge';
export interface SolarData {
    generationPower: number;
    usePower: number;
    batterySoc: number;
    buyPower: number;
    gridPower: number;
}
export declare class SolarmanApi {
    private readonly email;
    private readonly password;
    private readonly log;
    private client;
    private token;
    private tokenExpiry;
    private plantId;
    private preToken;
    constructor(email: string, password: string, plantId: number | undefined, log: Logger, preToken?: string);
    private hashPassword;
    login(): Promise<void>;
    private ensureAuth;
    private getPlantId;
    getData(): Promise<SolarData>;
}
