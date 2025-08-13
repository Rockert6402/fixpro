import { personService } from "../../../utils/api/services/fetchPeople.js";
import { interventionService } from "../../../utils/api/services/fetchinterventions.js";
import { sparePartService } from "../../../utils/api/services/fetchInventory.js";

function showNotification(message, type) {
  const toastContainer = document.createElement('div');
  toastContainer.style.position = 'fixed';
  toastContainer.style.top = '6.5%';
  toastContainer.style.left = '55%';
  toastContainer.style.transform = 'translate(-50%, -50%)';
  toastContainer.style.zIndex = '9999';

  toastContainer.innerHTML = `
    <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  document.body.appendChild(toastContainer);
  
  setTimeout(() => {
    toastContainer.remove();
  }, 1000);
}

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

function clearFilter() {
  document.getElementById('filterStatus').value = '';
  getAllAssignedInterventionOrders();
  showNotification("Filtro limpiado correctamente", "success");
}

async function loadOrderDataToDetail(orderId) {
    try {
        const order = await interventionService.getInterventionOrderById(orderId);
        let detailsOrder = await interventionService.getInterventionDetailByOrderId(orderId);
        const people = await getPeopleFromOrder(order);
        const customer = people?.find(p => p.role?.roleName === 'Cliente');
        const technician = people?.find(p => p.role?.roleName === 'Tecnico');

        if (!order) {
            console.error("Error: Orden no encontrada para el ID:", orderId);
            showNotification("Error: Orden no encontrada", "error");
            return;
        }

        // Si no hay detalles, crea unos iniciales
        if (!detailsOrder) {
            detailsOrder = await interventionService.createInterventionDetail({
                problemDescription: "Descripción del problema no especificada",
                solutionDescription: "",
                interventionOrder: { id: orderId }
            });
        }

        document.getElementById('order-id').textContent = orderId;
        document.getElementById('order-status').textContent = order.interventionStatus;
        document.getElementById('order-entry-date').textContent = formatDate(order.entryDate);
        document.getElementById('order-delivery-date').textContent = formatDate(order.deliveryDate);
        document.getElementById('customer-name').textContent = `${customer?.name || ''} ${customer?.lastName || ''}`;
        document.getElementById('customer-phone').textContent = customer?.phone || 'No especificado';
        document.getElementById('customer-address').textContent = customer?.address || 'No especificado';
        document.getElementById('device-type').textContent = order.device?.typeDevice?.typeName || 'No especificado';
        document.getElementById('device-brand').textContent = order.device?.brandDevice?.brandName || 'No especificado';
        document.getElementById('device-model').textContent = order.device?.model || 'No especificado';
        document.getElementById('device-serial').textContent = order.device?.serial || "No aplica";
        document.getElementById('device-password').textContent = order.device?.password || "No aplica";

        document.getElementById('show-problem-description').textContent = detailsOrder.problemDescription;
        document.getElementById('edit-problem-description').value = detailsOrder.problemDescription;
        document.getElementById('show-solution').textContent = detailsOrder.solutionDescription || "Aún no añadida";
        document.getElementById('edit-solution').value = detailsOrder.solutionDescription || "";

        // Habilitar/deshabilitar botón de agregar repuestos
        document.getElementById('add-part-btn').disabled = !detailsOrder.problemDescription || 
                                                         detailsOrder.problemDescription.trim() === "" ||
                                                         detailsOrder.problemDescription === "Descripción del problema no especificada";

        // Cargar repuestos usados
        loadUsedParts(orderId);
    } catch (error) {
        console.error("Error al cargar detalles de la orden:", error);
        showNotification("Error al cargar detalles de la orden", "error");
    }
}

async function completeOrder(orderId) {
  try {
    const order = await interventionService.getInterventionOrderById(orderId);
    
    if (!order) {
      throw new Error("Orden no encontrada");
    }
    const updatedOrder = {
      interventionStatus: 'Completada',
      deliveryDate: order.deliveryDate,
      device: {
        id: order.device.id
      },
      people: [
        {
          id: order.peopleIds[0]
        },
        {
          id: order.peopleIds[1]
        }
      ]
    };

    const success = await interventionService.updateInterventionOrder(orderId, updatedOrder);
    
    if (success) {
      showNotification("Orden actualizada correctamente", "success");
      getAllAssignedInterventionOrders();
    } else {
      throw new Error("No se pudo actualizar la orden");
    }
  } catch(error) {
    console.error("Error al actualizar la orden:", error);
    showNotification("Error al actualizar: " + (error.message || "Error desconocido"), "error");
  }
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

    const counterElement = document.querySelector('.card-header .text-muted');
    counterElement.textContent = `Mostrando ${interventionOrders.length} de ${interventionOrders.length} órdenes`;

    bodyTable.innerHTML = "";

    interventionOrders.forEach(async interventionOrder => {
      const people = await getPeopleFromOrder(interventionOrder);

      const row = document.createElement("tr");
      row.setAttribute('data-order-id', interventionOrder.id || '');

      row.innerHTML = `
        <td>${interventionOrder.id}</td>
        <td>${interventionOrder.device.brandDevice?.brandName} ${interventionOrder.device?.model}</td>
        <td>${interventionOrder.interventionStatus}</td>
        <td>${formatDate(interventionOrder.deliveryDate)}</td>
        <td>${(people?.find(p => p.role?.roleName === 'Cliente')?.name + ' ' + people?.find(p => p.role?.roleName === 'Cliente')?.lastName) || 'No especificado'}</td>
        <td class="action-buttons">
            <button id="details-order-btn" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#viewOrderModal " data-order-id="${interventionOrder.id || ''}"><i class="bi bi-eye"></i></button>
            <button id="complete-order-btn" class="btn btn-sm btn-success" data-order-id="${interventionOrder.id || ''}"><i class="bi bi-check2"></i></button>
        </td>
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

async function getAllAssignedInterventionOrdersByStatus(status) {
  try {
    const userData = sessionStorage.getItem('userData') ? JSON.parse(sessionStorage.getItem('userData')) : null;
    if(userData == null) {
      throw new Error("Sin Usuario");
    }
    const user = await personService.getPersonByEmail(userData.email);

    const interventionOrders = await interventionService.getInterventionOrdersByTechnicianIdAndStatus(user.id, status);
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

    const counterElement = document.querySelector('.card-header .text-muted');
    counterElement.textContent = `Mostrando ${interventionOrders.length} de ${interventionOrders.length} órdenes`;

    bodyTable.innerHTML = "";

    interventionOrders.forEach(async interventionOrder => {
      const people = await getPeopleFromOrder(interventionOrder);

      const row = document.createElement("tr");
      row.setAttribute('data-order-id', interventionOrder.id || '');

      row.innerHTML = `
      <tr>
          <td>${interventionOrder.id}</td>
          <td>${interventionOrder.device.brandDevice?.brandName} ${interventionOrder.device?.model}</td>
          <td>${interventionOrder.interventionStatus}</td>
          <td>${formatDate(interventionOrder.deliveryDate)}</td>
          <td>${(people?.find(p => p.role?.roleName === 'Cliente')?.name + ' ' + people?.find(p => p.role?.roleName === 'Cliente')?.lastName) || 'No especificado'}</td>
          <td class="action-buttons">
              <button id="details-order-btn" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#viewOrderModal " data-order-id="${interventionOrder.id || ''}"><i class="bi bi-eye"></i></button>
              <button id="complete-order-btn" class="btn btn-sm btn-success" data-order-id="${interventionOrder.id || ''}"><i class="bi bi-check2"></i></button>
          </td>
      </tr>
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
            Error al cargar empleados. ${error.message || 'Por favor intente más tarde.'}
            <button class="btn btn-sm btn-primary mt-2" onclick="getStaff()">Reintentar</button>
          </td>
        </tr>
      `;
    }
  }
}

async function saveProblemdescription(orderId) {
  const modal = bootstrap.Modal.getInstance(document.getElementById("viewOrderModal"));
  try {
    const problemDescription = document.getElementById('edit-problem-description').value;
    if (!problemDescription || problemDescription.trim() === "") {
      throw new Error("El campo detalle del problema no puede estar vacío");
    }

    // Obtener o crear los detalles de intervención
    let details = await interventionService.getInterventionDetailByOrderId(orderId);
    
    if (!details || !details.id) {
      // Crear nuevos detalles si no existen
      details = await interventionService.createInterventionDetail({
        problemDescription: problemDescription,
        solutionDescription: "",
        interventionOrder: { id: orderId }
      });
    } else {
      // Actualizar detalles existentes
      details = await interventionService.updateInterventionDetail(details.id, {
        problemDescription: problemDescription,
        solutionDescription: details.solutionDescription || "",
        interventionOrder: { id: orderId }
      });
    }

    // Actualizar el estado de la orden
    const order = await interventionService.getInterventionOrderById(orderId);
    const updatedOrder = {
      interventionStatus: 'En proceso',
      deliveryDate: order.deliveryDate,
      device: {
        id: order.device.id
      },
      people: order.peopleIds.map(id => ({ id }))
    };

    await interventionService.updateInterventionOrder(orderId, updatedOrder);

    // Habilitar el botón de agregar repuestos
    document.getElementById('add-part-btn').disabled = false;

    modal.hide();
    showNotification("Descripción del problema guardada correctamente", "success");
    loadOrderDataToDetail(orderId); // Recargar los datos para reflejar los cambios
  } catch(error) {
    console.error("Error al guardar la descripción del problema: ", error);
    showNotification("Error al guardar: " + error.message, "error");
  }
}

async function saveSolution(orderId) {
  const modal = bootstrap.Modal.getInstance(document.getElementById("viewOrderModal"));
  try {
    const solutionDescription = document.getElementById('edit-solution').value;
    if (!solutionDescription || solutionDescription.trim() === "") {
      throw new Error("El campo solución no puede estar vacío");
    }

    const details = await interventionService.getInterventionDetailByOrderId(orderId);
    if (!details || !details.id) {
      throw new Error("Primero debe guardar la descripción del problema");
    }

    const updatedDetail = {
      problemDescription: details.problemDescription,
      solutionDescription: solutionDescription,
      interventionOrder: {
        id: orderId
      }
    };

    const response = await interventionService.updateInterventionDetail(details.id, updatedDetail);

    if(!response || response.error) {
      throw new Error(response?.message || "Error al actualizar la solución");
    }
    
    modal.hide();
    showNotification("Solución guardada correctamente", "success");
    loadOrderDataToDetail(orderId);
  } catch(error) {
    console.error("Error al guardar la solución: ", error);
    showNotification("Error al guardar: " + error.message, "error");
  }
}

async function loadUsedParts(orderId) {
  try {
    const details = await interventionService.getInterventionDetailByOrderId(orderId);
    if (!details || !details.id) {
      document.getElementById('used-parts-list').innerHTML = '<li class="list-group-item text-center">No hay repuestos usados</li>';
      return;
    }

    const usedParts = await sparePartService.getUseSparePartsByInterventionDetailsId(details.id);
    const partsList = document.getElementById('used-parts-list');
    partsList.innerHTML = '';

    if (!usedParts || usedParts.length === 0) {
      partsList.innerHTML = '<li class="list-group-item text-center">No hay repuestos usados</li>';
      return;
    }

    usedParts.forEach(part => {
      const partItem = document.createElement('li');
      partItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      partItem.innerHTML = `
        ${part.sparePart.brandSparePart.brandName} - ${part.sparePart.typeSparePart.typeName} - ${part.sparePart.model}
        <span>
          <span class="badge bg-primary rounded-pill me-2">${part.quantity}</span>
          <button class="btn btn-sm btn-outline-danger py-0 px-2 remove-part-btn" 
                  data-part-id="${part.id}" 
                  title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </span>
      `;
      partsList.appendChild(partItem);
    });
  } catch (error) {
    console.error("Error al cargar repuestos usados:", error);
    showNotification("Error al cargar repuestos usados", "error");
  }
}

async function loadPartFilters() {
  try {
    const brands = await sparePartService.getAllSparePartBrand();
    const types = await sparePartService.getAllSparePartType();
    
    const brandSelect = document.getElementById('filter-by-brand');
    const typeSelect = document.getElementById('filter-by-type');
    
    brandSelect.innerHTML = '<option value="" selected>Todas las marcas</option>';
    typeSelect.innerHTML = '<option value="" selected>Todos los tipos</option>';
    
    brands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand.brandName;
      option.textContent = brand.brandName;
      brandSelect.appendChild(option);
    });
    
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.typeName;
      option.textContent = type.typeName;
      typeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar filtros de repuestos:", error);
  }
}

async function addPartToOrder(orderId) {
  try {
    const brandName = document.getElementById('filter-by-brand').value;
    const typeName = document.getElementById('filter-by-type').value;
    const modelName = document.getElementById('search-model').value.trim();
    const quantity = parseInt(document.getElementById('part-quantity').value) || 1;

    if (!modelName) {
      throw new Error("Debe especificar al menos un modelo");
    }

    // Buscar el repuesto en el inventario
    const spareParts = await sparePartService.getSparePartByBrandTypeAndModel(brandName, typeName, modelName);
    
    if (!spareParts || spareParts.length === 0) {
      throw new Error("No se encontró el repuesto especificado");
    }

    // Encontrar el repuesto que coincida exactamente con todos los filtros
    const exactSparePart = spareParts.find(part => 
      (part.brandSparePart?.brandName === brandName) &&
      (part.typeSparePart?.typeName === typeName) &&
      part.model === modelName
    );

    if (!exactSparePart) {
      throw new Error("No se encontró un repuesto que coincida exactamente con los criterios");
    }

    // Obtener y validar los detalles de intervención
    const details = await interventionService.getInterventionDetailByOrderId(orderId);
    if (!details || !details.id) {
      throw new Error("No se encontraron detalles de intervención. Primero guarde la descripción del problema.");
    }
    
    if (!details.problemDescription || details.problemDescription.trim() === "") {
      throw new Error("La descripción del problema es requerida. Guarde la descripción antes de agregar repuestos.");
    }

    const usedPart = {
      sparePart: {
        id: exactSparePart.id
      },
      interventionDetails: {
        id: details.id
      },
      quantity: quantity,
      costSpareParts: exactSparePart.price * quantity
    };

    const response = await sparePartService.addUseSparePart(usedPart);
    
    if (response) {
      showNotification("Repuesto agregado correctamente", "success");
      loadUsedParts(orderId);
      document.getElementById('search-model').value = '';
      document.getElementById('part-quantity').value = '1';
    } else {
      throw new Error("No se pudo agregar el repuesto");
    }
  } catch (error) {
    console.error("Error al agregar repuesto:", error);
    showNotification("Error al agregar repuesto: " + error.message, "error");
  }
}

async function removePartFromOrder(partId, orderId) {
  try {
    const confirmDelete = confirm("¿Está seguro de eliminar este repuesto de la orden?");
    if (!confirmDelete) return;

    const success = await sparePartService.deleteUsedSparePart(partId);
    
    if (success) {
      showNotification("Repuesto eliminado correctamente", "success");
      loadUsedParts(orderId);
    } else {
      throw new Error("No se pudo eliminar el repuesto");
    }
  } catch (error) {
    console.error("Error al eliminar repuesto:", error);
    showNotification("Error al eliminar repuesto: " + error.message, "error");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getAllAssignedInterventionOrders();
  loadPartFilters();

  document.addEventListener('click', function(event) {
    const orderId = document.getElementById('order-id').textContent;
    
    if (event.target.closest('#complete-order-btn')) {
      const orderId = event.target.closest('#complete-order-btn').getAttribute('data-order-id');
      completeOrder(orderId);
    } else if (event.target.closest('#details-order-btn')) {
      const orderId = event.target.closest('#details-order-btn').getAttribute('data-order-id');
      if (orderId) {
        loadOrderDataToDetail(orderId);
      } else {
          console.error("Error: data-order-id no encontrado para el botón de detalles.");
          showNotification("Error: ID de orden no disponible", "error");
      }
    } else if (event.target.closest('#save-problem-description-btn')) {
      saveProblemdescription(orderId);
    } else if (event.target.closest('#save-solution-btn')) {
      saveSolution(orderId);
    } else if (event.target.closest('#add-part-btn') && orderId) {
      addPartToOrder(orderId);
    } else if (event.target.closest('.remove-part-btn') && orderId) {
      const partId = event.target.closest('.remove-part-btn').getAttribute('data-part-id');
      removePartFromOrder(partId, orderId);
    }
  });

  document.getElementById('clear-filter-btn').addEventListener('click', clearFilter);

  document.querySelector('#filterStatus').addEventListener('change', () => {
    const status = document.getElementById('filterStatus').value;
    if (status) {
      getAllAssignedInterventionOrdersByStatus(status);
    } else {
      getAllAssignedInterventionOrders();
    }
  });
});