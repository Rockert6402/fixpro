import { API_CONFIG } from "../config.js";

const sparePartService = {
  baseUrl: API_CONFIG.BASE_URL,
  defaultHeaders: API_CONFIG.HEADERS,
  async _request(endpoint, method = "GET", body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.defaultHeaders;

    const options = {
      method,
      headers,
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
      console.error("Error en la solicitud:", error);
      throw error;
    }
  },

  async addSparePart(newSparePart) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.ADD, "POST", newSparePart);
  },

  async updateSparePart(id, updatedSparePart) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.UPDATE(id), "PUT", updatedSparePart);
  },

  async deleteSparePart(id) {
    // Enviar "Inactivo" como query parameter (no en el body)
    const endpoint = `${API_CONFIG.ENDPOINTS.SPARE_PARTS.DELETE(id)}?availability=Inactivo`;
    return this._request(endpoint, "PUT"); // No enviar body
  },

  async getSparePartById(id) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_BY_ID(id));
  },

  // Marcas
  async addSparePartBrand(newSparePartBrand){
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.BRAND.ADD, "POST", newSparePartBrand)
  },

  async getAllSparePartBrand() {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.BRAND.GET_ALL)
  },

  // Tipos
  async addSparePartType(newSparePartType){
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.TYPE.ADD, "POST", newSparePartType)
  },

  async getAllSparePartType() {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.TYPE.GET_ALL)
  },

  // Filtros
  async getSparePartByModel(model) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_BY_MODEL(model));
  },

  async getSparePartByBrand(brand) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_BY_BRAND(brand));
  },

  async getSparePartByBrandType(type) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_BY_TYPE(type));
  },

  async getSparePartByBrandTypeAndModel(brand, type, model) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_BY_BRAND_TYPE_MODEL(brand, type, model));
  },
  
  async getAllSpareParts(){
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.GET_ALL)
  },

  // Repuestos usados 
  async addUseSparePart(useSparePart) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.USED_SPARE_PARTS.USE, "POST", useSparePart);
  },

  async updateUseSparePart(id, updateUseSparePart){
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.USED_SPARE_PARTS.UPDATE(id), "PUT", updateUseSparePart);
  },

  async getUseSparePart(id){
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.USED_SPARE_PARTS.GET_BY_ID(id));
  },

  async deleteUsedSparePart(id) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.USED_SPARE_PARTS.DELETE(id), "DELETE");
  },

  async getUseSparePartsByInterventionDetailsId(interventionDetailsId) {
    return this._request(API_CONFIG.ENDPOINTS.SPARE_PARTS.USED_SPARE_PARTS.GET_BY_INTERVENTION_DETAILS_ID(interventionDetailsId));
  },

};

export {sparePartService};