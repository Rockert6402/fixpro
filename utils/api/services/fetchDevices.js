import { API_CONFIG } from '../config.js';

const deviceService = {
  baseUrl: API_CONFIG.BASE_URL,
  defaultHeaders: API_CONFIG.HEADERS,

  async _request(endpoint, method = "GET", body = null, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (response.status === 204) return true;

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "Error en la solicitud");
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error en la solicitud: ", error);
      throw error;
    }
  },

  // Operaciones básicas de dispositivos
  async registerDevice(newDevice) {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.REGISTER,
      "POST",
      newDevice
    );
  },

  async updateDevice(id, updatedDevice) {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.UPDATE(id),
      "PUT",
      updatedDevice
    );
  },

  async getDeviceById(id) {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.GET_BY_ID(id)
    );
  },

  async getDeviceBySerial(serial) {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.GET_BY_SERIAL(serial)
    );
  },

  async getAllDevices() {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.GET_ALL
    );
  },

  // Búsquedas por modelo
  async getDevicesByModel(model) {
    return this._request(
      API_CONFIG.ENDPOINTS.DEVICES.GET_BY_MODEL(model)
    );
  },

  // Marcas
  async addDeviceBrand(newDeviceBrand){
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.BRAND.ADD, "POST", newDeviceBrand)
  },

  async getDeviceBrandByName(deviceBrandName) {
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.BRAND.GET_BRAND_BY_NAME(deviceBrandName))
  },

  async getAllDeviceBrand() {
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.BRAND.GET_ALL)
  },

  // Tipos
  async addDeviceType(newDeviceType){
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.TYPE.ADD, "POST", newDeviceType)
  },

  async getDeviceTypeByName(deviceTypeName) {
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.TYPE.GET_TYPE_BY_NAME(deviceTypeName))
  },

  async getAllDeviceType() {
    return this._request(API_CONFIG.ENDPOINTS.DEVICES.TYPE.GET_ALL)
  },
};

export { deviceService };