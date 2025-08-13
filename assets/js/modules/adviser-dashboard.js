import { interventionService } from "../../../utils/api/services/fetchinterventions.js";
import { personService } from "../../../utils/api/services/fetchPeople.js";

function showNotification(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';

    toastContainer.innerHTML = `
        <div class="toast show align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    document.body.appendChild(toastContainer);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}


// Obtener las personas por orden
async function getPeopleFromOrder(interventionOrder) {
  if (!interventionOrder.peopleIds || !Array.isArray(interventionOrder.peopleIds)) {
    return [];
  }

  const peoplePromises = interventionOrder.peopleIds.map(id => 
    personService.getPersonById(id)
  );
  
  try {
    const people = await Promise.all(peoplePromises);
    return people.filter(person => person != null);
  } catch (error) {
    console.error("Error al obtener personas:", error);
    return [];
  }
}


// Ordenes recientes
async function getAllRecientsInterventionOrders() {
  try {
    const bodyTable = document.querySelector("#orderRecientsTableBody");
    
    if (!bodyTable) {
      console.error("No se encontró el elemento #orderRecientsTableBody");
      return;
    }
    bodyTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando órdenes...</p>
        </td>
      </tr>
    `;

    const interventionOrders = await interventionService.getRecentOrders();

    if (!Array.isArray(interventionOrders)) {
      throw new Error("Datos de las órdenes no válidos");
    }

    if (interventionOrders.length === 0) {
      bodyTable.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <i class="bi bi-inbox fs-1 text-muted"></i>
            <p class="mt-2">No hay órdenes recientes</p>
          </td>
        </tr>
      `;
      return;
    }

    const counterElement = document.querySelector('.card-header .text-muted');
    if (counterElement) {
      counterElement.textContent = `Mostrando ${Math.min(interventionOrders.length, 5)} de ${interventionOrders.length} órdenes`;
    }

    bodyTable.innerHTML = "";

    const recentOrders = interventionOrders.slice(0, 5);
    
    for (const order of recentOrders) {
      const people = await getPeopleFromOrder(order);
      const customer = people?.find(p => p.role?.roleName === 'Cliente');
      const customerName = customer ? `${customer.name} ${customer.lastName}` : 'No especificado';
      
      const row = document.createElement("tr");
      row.setAttribute('data-order-id', order.id || '');
      
      const statusBadgeClass = getStatusBadgeClass(order.interventionStatus);
      
      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${customerName}</td>
        <td>${order.device.brandDevice?.brandName} ${order.device?.model}</td>
        <td><span class="badge ${statusBadgeClass}">${order.interventionStatus}</span></td>
      `;
      
      bodyTable.appendChild(row);
    }

  } catch(error) {
    console.error("Error al obtener las órdenes:", error);
    const bodyTable = document.querySelector("#orderRecientsTableBody");
    if (bodyTable) {
      bodyTable.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle fs-1"></i>
            <p class="mt-2">Error al cargar órdenes</p>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="getAllInterventionOrders()">
              <i class="bi bi-arrow-repeat"></i> Reintentar
            </button>
          </td>
        </tr>
      `;
    }
  }
}

// Función auxiliar para determinar el color del badge según el estado
function getStatusBadgeClass(status) {
  if (!status) return 'bg-secondary';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('complet') || statusLower.includes('entreg')) {
    return 'bg-success';
  }
  if (statusLower.includes('proceso') || statusLower.includes('reparación')) {
    return 'bg-warning text-white';
  }
  if (statusLower.includes('pendient') || statusLower.includes('retras')) {
    return 'bg-danger';
  }
  if (statusLower.includes('diagnóstico') || statusLower.includes('evaluación')) {
    return 'bg-info text-dark';
  }
  if (statusLower.includes('cancel')) {
    return 'bg-dark';
  }
  
  return 'bg-secondary';
}


// Función para cargar técnicos en la tabla
async function loadTechniciansTable() {
    const tableBody = document.getElementById('techniciansTableBody');
    
    // Mostrar estado de carga
    tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando técnicos...</span>
                </div>
                <p class="mt-2 mb-0">Cargando técnicos disponibles...</p>
            </td>
        </tr>
    `;

    try {
        // Obtener técnicos disponibles
        const technicians = await getAvailableTechnicians();
        
        // Limpiar la tabla
        tableBody.innerHTML = '';

        if (technicians.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">No hay técnicos disponibles actualmente</td>
                </tr>
            `;
            return;
        }

        // Llenar la tabla con los técnicos
        technicians.forEach(tech => {
            const specialties = tech.specialties?.length 
                ? tech.specialties.map(s => s.specialtyName).join(', ')
                : 'Sin especialidades';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tech.id}</td>
                <td>${tech.name} ${tech.lastName}</td>
                <td>${specialties}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error al cargar técnicos:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">
                    Error al cargar técnicos. ${error.message || 'Por favor intente más tarde.'}
                    <button class="btn btn-sm btn-primary mt-2" onclick="loadTechniciansTable()">Reintentar</button>
                </td>
            </tr>
        `;
    }
}


// Tecnicos disponibles
async function getAvailableTechnicians() {
    try {
        // Primero obtener el rol de Técnico
        const role = await personService.getRoleByName("Técnico");
        
        if (!role) {
            throw new Error("No se encontró el rol de Técnico");
        }
        
        // Obtener todas las personas con ese rol
        const technicians = await personService.getPersonByRole(role.id);
        
        // Filtrar por disponibilidad (si el campo exists)
        return technicians.filter(tech => tech.isAvailable !== false);
    } catch (error) {
        console.error("Error al obtener técnicos disponibles:", error);
        throw error; // Re-lanzamos el error para manejarlo en loadTechniciansTable
    }
}


// Cards
// Función para actualizar las cards con estadísticas de órdenes
async function updateOrderStatsCards() {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  const user = await personService.getPersonByEmail(userData.email);
    try {
        const salesInformation = await interventionService.getSalesInformation(user.id);
        updateCardsUI(
            salesInformation[0],
            salesInformation[2],
            salesInformation[3],
            salesInformation[1]
        );

    } catch (error) {
        console.error("Error al cargar estadísticas de órdenes:", error);
        updateCardsUI(0, 0, 0, 0);
        
        showNotification("Error al cargar estadísticas de órdenes", "error");
    }
}

// Actualiza la interfaz de usuario de las cards
function updateCardsUI(totalToday, delayed, inProgress, readyForDelivery) {
    // Card de órdenes hoy
    const totalTodayElement = document.querySelector('.card.bg-primary h2');
    if (totalTodayElement) totalTodayElement.textContent = totalToday;

    // Card de órdenes retrasadas
    const delayedElement = document.querySelector('.card.bg-danger h2');
    if (delayedElement) delayedElement.textContent = delayed;

    // Card de órdenes en proceso
    const inProgressElement = document.querySelector('.card.bg-warning h2');
    if (inProgressElement) inProgressElement.textContent = inProgress;

    // Card de órdenes listas para entrega
    const readyElement = document.querySelector('.card.bg-success h2');
    if (readyElement) readyElement.textContent = readyForDelivery;
}


document.addEventListener('DOMContentLoaded', () => {
  getAllRecientsInterventionOrders();
  loadTechniciansTable();
  updateOrderStatsCards();

  // Actualizar cada 2 minutos
  setInterval(getAllRecientsInterventionOrders, 120000);
});