import { API } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SolarmanPlatform } from './platform';

export default (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, SolarmanPlatform);
};
