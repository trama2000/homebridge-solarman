"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarmanApi = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
class SolarmanApi {
    constructor(email, password, plantId, log, preToken) {
        this.email = email;
        this.password = password;
        this.log = log;
        this.token = '';
        this.tokenExpiry = 0;
        this.plantId = plantId;
        this.preToken = preToken || '';
        this.client = axios_1.default.create({
            baseURL: 'https://globalpro.solarmanpv.com',
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    hashPassword(pwd) {
        return crypto.createHash('sha256').update(pwd).digest('hex');
    }
    async login() {
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
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.log.error('[Solarman] Login failed -', msg);
            throw e;
        }
    }
    async ensureAuth() {
        if (!this.token || Date.now() > this.tokenExpiry - 60000) {
            await this.login();
        }
    }
    async getPlantId() {
        if (this.plantId)
            return this.plantId;
        await this.ensureAuth();
        const res = await this.client.post('/maintain-s/operating/station/search?page=1&size=10', {});
        const plants = res.data?.data;
        if (!plants || plants.length === 0) {
            throw new Error('No plants found in SOLARMAN account');
        }
        this.plantId = plants[0].id;
        this.log.info('[Solarman] Auto-detected plant:', plants[0].name, '(ID:', this.plantId, ')');
        return this.plantId;
    }
    async getData() {
        await this.ensureAuth();
        const plantId = await this.getPlantId();
        const res = await this.client.post('/maintain-s/operating/station/search?page=1&size=10', {});
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
exports.SolarmanApi = SolarmanApi;
