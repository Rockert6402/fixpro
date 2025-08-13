export const API_CONFIG = {
  BASE_URL: "http://localhost:8080/api",
  HEADERS: {
    "Content-Type": "application/json",
  },
  ENDPOINTS: {
    // Personas
    PEOPLE: {
      REGISTER: "/people",
      UPDATE: (id) => `/people/${id}`,
      DELETE: (id) => `/people/change-availability/${id}?availability=Desactivado`,
      GET_BY_ID: (id) => `/people/${id}`,
      GET_BY_EMAIL: (email) => `/people/by-email/${email}`,
      GET_BY_ROLE: (roleId) => `/people/by-role/${roleId}`,
      GET_BY_ROLE_AND_SPECIALTY: (roleId, specialtyId) => 
        `/people/by-role-and-specialty?roleId=${roleId}&specialtyId=${specialtyId}`,
      CHANGE_AVAILABILITY: (id) => `/people/change-availability/${id}`,
      GET_STAFF: (personId) => `/people/staff/${personId}`,
    },
    // Roles
    ROLES: {
      ADD: "/people/roles",
      UPDATE: (id) => `/people/roles/${id}`,
      GET_BY_ID: (id) => `/people/roles/id/${id}`,
      GET_ALL: "/people/roles",
      GET_BY_NAME: (name) => `/people/roles/name/${name}`,
    },
    // Especialidades
    SPECIALTIES: {
      ADD: "/people/specialties",
      UPDATE: (id) => `/people/specialties/${id}`,
      GET_BY_ID: (id) => `/people/specialties/id/${id}`,
      GET_ALL: "/people/specialties",
      GET_BY_NAME: (name) => `/people/specialties/name/${name}`,
    },
    // Autenticación
    AUTH: {
      LOGIN: "/people/login",
      CHANGE_PASSWORD: (id) => `/people/change-password/${id}`,
    },
    // Dispositivos
    DEVICES: {
      REGISTER: "/devices",
      UPDATE: (id) => `/devices/${id}`,
      GET_BY_ID: (id) => `/devices/${id}`,
      GET_BY_SERIAL: (serial) => `/devices/serial/${serial}`,
      GET_ALL: "/devices",
      GET_BY_MODEL: (model) => `/devices/model/${model}`,

      //Tipos de equipos
      TYPE: {
        ADD: "/devices/type",
        GET_TYPE_BY_NAME: (name) => `/devices/type/${name}`,
        GET_ALL: "/devices/type",
      },

      //Marcas de equipos
      BRAND: {
        ADD: "/devices/brand",
        GET_BRAND_BY_NAME: (name) =>`/devices/brand/${name}`,
        GET_ALL: "/devices/brand",
      },
    },
    // Repuestos
    SPARE_PARTS: {
      ADD: "/spare-parts",
      UPDATE: (sparePartId) => `/spare-parts/${sparePartId}`,
      DELETE: (sparePartId) => `/spare-parts/change-availability/${sparePartId}`,
      GET_BY_ID: (sparePartId) => `/spare-parts/${sparePartId}`,
      GET_BY_MODEL: (model) => `/spare-parts/by-model/${model}`,
      GET_BY_BRAND: (brand) => `/spare-parts/by-brand/${brand}`,
      GET_BY_TYPE: (type) => `/spare-parts/by-type/${type}`,
      GET_BY_BRAND_TYPE_MODEL: (brand, type, model) => 
        `/spare-parts?brand=${brand}&type=${type}&model=${model}`,
      GET_ALL: "/spare-parts",
      // Repuestos Usados
      USED_SPARE_PARTS: {
        USE: "/spare-parts/used-spare-parts",
        UPDATE: (id) => `/spare-parts/used-spare-parts/${id}`,
        GET_BY_ID: (id) => `/spare-parts/used-spare-parts/${id}`,
        DELETE: (id) => `/spare-parts/used-spare-parts/${id}`,
        GET_BY_INTERVENTION_DETAILS_ID: (interventionDetailsId) => `/spare-parts/used-spare-parts/by-intervention-details-id/${interventionDetailsId}`,
      },

      //Tipos de repuestos
      TYPE: {
        ADD: "/spare-parts/type",
        GET_TYPE_BY_NAME: (name) => `/spare-parts/type/${name}`,
        GET_ALL: "/spare-parts/type",
      },

      //Marcas de Repuestos
      BRAND: {
        ADD: "/spare-parts/brand",
        GET_BRAND_BY_NAME: (name) =>`/spare-parts/brand/${name}`,
        GET_ALL: "/spare-parts/brand",
      },
    },
    // Intervenciones
    INTERVENTIONS: {
      // Órdenes de Intervención
      ORDERS: {
        CREATE: "/interventions/orders",
        UPDATE: (id) => `/interventions/orders/${id}`,
        GET_BY_ID: (id) => `/interventions/orders/${id}`,
        GET_ALL: "/interventions/orders",
        GET_BY_TECHNICIAN_ID_AND_STATUS: (technicianId, status) => `/interventions/orders/by-technician-id-and-status?technicianId=${technicianId}&status=${status}`,
        GET_SALES_INFO: (id) => `/interventions/orders/sales-information/${id}`,
        GET_RECENT_ORDERS: "/interventions/orders/recent-orders",
        GET_BY_CUSTOMER_NAME: (customerName, customerLastName) => `/interventions/orders/by-customer-name?customerName=${customerName}&customerLastName=${customerLastName}`,
        GET_BY_DAY: (date) => `/interventions/orders/by-day/${date}`,
        GET_BY_CUSTOMER_AND_DAY: (customerName, customerLastName, date) => `/interventions/orders/by-customer-and-day?customerName=${customerName}&customerLastName=${customerLastName}&date=${date}`,
        GET_BY_TECHNINICIAN_ID: (technicianId) => `/interventions/orders/by-technician-id/${technicianId}`,
      },
      // Detalles de Intervención
      DETAILS: {
        CREATE: "/interventions/details",
        UPDATE: (id) => `/interventions/details/${id}`,
        GET_BY_ID: (id) => `/interventions/details/${id}`,
        GET_BY_ORDER_ID: (orderId) => `/interventions/details/by-order-id/${orderId}`,
      },
    },
  },
};