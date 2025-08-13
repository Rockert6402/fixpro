import { interventionService } from "../../../utils/api/services/fetchinterventions.js";
import { personService } from "../../../utils/api/services/fetchPeople.js";

// Cards
// Función para actualizar las cards con estadísticas de órdenes

function formatDate(dateString) {
  if (!dateString) return 'No especificado';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Fecha inválida';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

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


async function updateOrderStatsCards() {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  const user = await personService.getPersonByEmail(userData.email);
    try {
        const salesInformation = await interventionService.getSalesInformation(user.id);
        updateCardsUI(
            salesInformation[4],
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
function updateCardsUI(assignedToday, delayed, inProgress, readyForDelivery) {
    // Card de órdenes hoy
    const assignedTodayElement = document.querySelector('.card.bg-primary h2');
    if (assignedTodayElement) assignedTodayElement.textContent = assignedToday;

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


async function getAllAssignedInterventionOrders() {
  try {
    const userData = sessionStorage.getItem('userData') ? JSON.parse(sessionStorage.getItem('userData')) : null;
    if(userData == null) {
      throw new Error("Sin Usuario");
    }

    const user = await personService.getPersonByEmail(userData.email);
    const interventionOrders = await interventionService.getInterventionsByTechnicianId(user.id);
    const bodyTable = document.querySelector("#ordersTableBody");

    if (!bodyTable) {
      console.error("No se encontró el elemento #ordersTableBody");
      return;
    }

    bodyTable.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';

    if (!interventionOrders || !Array.isArray(interventionOrders)) {
      throw new Error("Datos de las ordenes no válidos");
    }

    if (interventionOrders.length === 0) {
      bodyTable.innerHTML = '<tr><td colspan="9" class="text-center">No hay ordenes asignadas</td></tr>';
      return;
    }

    bodyTable.innerHTML = "";

    interventionOrders.forEach(async interventionOrder => {
      const people = await getPeopleFromOrder(interventionOrder);

      const row = document.createElement("tr");
      row.setAttribute('data-order-id', interventionOrder.id || '');

      const statusBadgeClass = getStatusBadgeClass(interventionOrder.interventionStatus);

      row.innerHTML = `
        <td>${interventionOrder.id}</td>
        <td>${(people?.find(p => p.role?.roleName === 'Cliente')?.name + ' ' + people?.find(p => p.role?.roleName === 'Cliente')?.lastName) || 'No especificado'}</td>
        <td>${interventionOrder.device.brandDevice?.brandName} ${interventionOrder.device?.model}</td>
        <td><span class="badge ${statusBadgeClass}">${interventionOrder.interventionStatus}<span></td>
        <td>${formatDate(interventionOrder.entryDate)}</td>
        <td>${formatDate(interventionOrder.deliveryDate)}</td>
      `;
      bodyTable.appendChild(row);
    });
    
    const existingListener = bodyTable.getAttribute('data-listener-attached');
    if (!existingListener) {
      bodyTable.setAttribute('data-listener-attached', 'true');
    }
  } catch(error) {
    console.error("Error al obtener las ordenes:", error);
    const bodyTable = document.querySelector("#ordersTableBody");
    if (bodyTable) {
      bodyTable.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-danger">
            Error al cargar las ordenes. ${error.message || 'Por favor intente más tarde.'}
            <button class="btn btn-sm btn-primary mt-2" onclick="getStaff()">Reintentar</button>
          </td>
        </tr>
      `;
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  updateOrderStatsCards();
  getAllAssignedInterventionOrders();
});