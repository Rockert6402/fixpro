import { API_CONFIG } from '../config.js';

const interventionService = {
  baseUrl: API_CONFIG.BASE_URL,
  defaultHeaders: API_CONFIG.HEADERS,

  async _request(endpoint, method = "GET", body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.defaultHeaders;

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

  // Órdenes de Intervención
  async createInterventionOrder(newOrder) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.CREATE, "POST", newOrder);
  },

  async updateInterventionOrder(id, updatedOrder) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.UPDATE(id), "PUT", updatedOrder);
  },

  async getInterventionOrderById(id) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_ID(id));
  },

  async getAllInterventionOrders() {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_ALL);
  },

  async getInterventionOrdersByTechnicianIdAndStatus(technicianId, status) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_TECHNICIAN_ID_AND_STATUS(technicianId, status));
  },

  async getSalesInformation(id) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_SALES_INFO(id));
  },

  async getRecentOrders() {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_RECENT_ORDERS);
  },

  async getOrdersByCustomerName(customerName, customerLastName) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_CUSTOMER_NAME(customerName, customerLastName));
  },

  async getOrdersByDay(date) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_DAY(date));
  },

  async getOrdersByCustomerAndDay(customerName, customerLastName,date) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_CUSTOMER_AND_DAY(customerName, customerLastName,date));
  },

  // Detalles de Intervención
  async createInterventionDetail(newDetail) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.DETAILS.CREATE, "POST", newDetail);
  },

  async updateInterventionDetail(id, updatedDetail) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.DETAILS.UPDATE(id), "PUT", updatedDetail);
  },

  async getInterventionDetailById(id) {
    return this._request(
      API_CONFIG.ENDPOINTS.INTERVENTIONS.DETAILS.GET_BY_ID(id));
  },

  async getInterventionDetailByOrderId(orderId) {
    return this._request(API_CONFIG.ENDPOINTS.INTERVENTIONS.DETAILS.GET_BY_ORDER_ID(orderId));
  },

  async getInterventionsByTechnicianId (technicianId) {
    return this._request(API_CONFIG.ENDPOINTS.INTERVENTIONS.ORDERS.GET_BY_TECHNINICIAN_ID(technicianId));
  }
};

export { interventionService };