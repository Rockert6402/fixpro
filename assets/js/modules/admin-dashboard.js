import { sparePartService } from "../../../utils/api/services/fetchInventory.js";
import { interventionService } from "../../../utils/api/services/fetchinterventions.js";
import { personService } from "../../../utils/api/services/fetchPeople.js";

// Función principal que se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadLowStockParts();
        await updateOrderStatsCards();
    } catch (error) {
        console.error('Error:', error);
        showErrorInTable('Error al cargar los repuestos por agotarse');
    }
});

// Función para cargar los repuestos con bajo stock
async function loadLowStockParts() {
    try {
        // Obtener todos los repuestos
        const spareParts = await sparePartService.getAllSpareParts();
        
        // Filtrar y ordenar repuestos con stock bajo (menos de 5 unidades)
        const lowStockParts = spareParts
            .filter(part => part.stock <= 5)  // Cambia este número según lo que consideres "bajo stock"
            .sort((a, b) => a.stock - b.stock);
        
        // Actualizar la tabla
        updateLowStockTable(lowStockParts);
    } catch (error) {
        console.error('Error al cargar repuestos con bajo stock:', error);
        throw error;
    }
}

// Función para actualizar la tabla con los repuestos de bajo stock
function updateLowStockTable(parts) {
    const tableBody = document.getElementById('lowStockTableBody');
    tableBody.innerHTML = ''; // Limpiar la tabla
    
    if (parts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No hay repuestos por agotarse</td>
            </tr>
        `;
        return;
    }
    
    // Agregar cada repuesto a la tabla
    parts.forEach(part => {
        const row = document.createElement('tr');
        
        // Resaltar filas según el nivel de stock
        if (part.stock === 0) {
            row.classList.add('table-danger'); // Rojo para stock agotado
        } else if (part.stock <= 2) {
            row.classList.add('table-warning'); // Amarillo para stock muy bajo
        }
        
        row.innerHTML = `
            <td>${part.typeSparePart?.typeName || 'Sin tipo'}</td>
            <td>${part.brandSparePart?.brandName || 'Sin marca'}</td>
            <td>${part.model || 'N/A'}</td>
            <td>${part.stock}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Función para mostrar errores en la tabla
function showErrorInTable(message) {
    const tableBody = document.getElementById('lowStockTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">${message}</td>
        </tr>
    `;
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
    return people.filter(person => person != null); // Filtrar posibles valores nulos
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

    // Mostrar spinner de carga
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

    // Actualizar contador
    const counterElement = document.querySelector('.card-header .text-muted');
    if (counterElement) {
      counterElement.textContent = `Mostrando ${Math.min(interventionOrders.length, 5)} de ${interventionOrders.length} órdenes`;
    }

    // Limpiar tabla
    bodyTable.innerHTML = "";

    // Mostrar solo las 5 órdenes más recientes
    const recentOrders = interventionOrders.slice(0, 5);
    
    for (const order of recentOrders) {
      const people = await getPeopleFromOrder(order);
      const customer = people?.find(p => p.role?.roleName === 'Cliente');
      const customerName = customer ? `${customer.name} ${customer.lastName}` : 'No especificado';
      
      const row = document.createElement("tr");
      row.setAttribute('data-order-id', order.id || '');
      
      // Determinar clase del badge según el estado
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
  updateOrderStatsCards();
  setInterval(getAllRecientsInterventionOrders, 120000);
});