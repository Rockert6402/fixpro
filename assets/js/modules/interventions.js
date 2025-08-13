import { interventionService } from "../../../utils/api/services/fetchinterventions.js";
import { personService } from "../../../utils/api/services/fetchPeople.js";
import { deviceService } from "../../../utils/api/services/fetchDevices.js"
import { sparePartService } from "../../../utils/api/services/fetchInventory.js";

// Crear una nueva marca
async function createNewBrand() {
  try {
    const newBrandName = document.getElementById("newBrandName").value;
    if (!newBrandName) {
      throw new Error("Campo marca vacio");
    }
    
    const newBrand = { brandName: newBrandName };
    const response = await deviceService.addDeviceBrand(newBrand);
    
    if (!response) throw new Error("Error al registrar marca de repuesto");
    
    showNotification("Marca registrado con éxito", "success");
  } catch (error) {
    console.error("Error al registrar marca de repuesto:", error);
    showNotification("Error al registrar marca: " + error.message, "error");
  } finally {
    document.getElementById("newBrandName").value = "";
    document.getElementById("avancedOptions").click();
  }
}

// Crear un nuevo tipo
async function createNewType() {
  try {
    const newTypeName = document.getElementById("newTypeName").value;
    if (!newTypeName) {
      throw new Error("Campo tipo vacio");
    }
    
    const newType = { typeName: newTypeName };
    const response = await deviceService.addDeviceType(newType);
    
    if (!response) throw new Error("Error al registrar tipo de repuesto");
    
    showNotification("Tipo registrado con éxito", "success");
  } catch (error) {
    console.error("Error al registrar tipo de repuesto:", error);
    showNotification("Error al registrar tipo: " + error.message, "error");
  } finally {
    document.getElementById("newTypeName").value = "";
    document.getElementById("avancedOptions").click();
  }
}


//////////////////////////////////////////////
////         Funciones Auxiliares         ////
//////////////////////////////////////////////

function cleanForm() {
    document.getElementById('typeDevice').value = "";
    document.getElementById('brandDevice').value = "";
    document.getElementById('modelDevice').value = "";
    document.getElementById('serialDevice').value = "";
    document.getElementById('deliveryDate').value = "";
    document.getElementById('passwordDevice').value = "";
    document.getElementById('problemDescription').value = "";
    document.getElementById('customerName').value = "";
    document.getElementById('customerLastName').value = "";
    document.getElementById('customerPhone').value = "";
    document.getElementById('customerAddress').value = "";
}

function showNotification(message, type) {
    const toastContainer = document.createElement('div');

    // Aplica estilos para centrar el toast
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '6.5%';
    toastContainer.style.left = '55%';
    toastContainer.style.transform = 'translate(-50%, -50%)';
    toastContainer.style.zIndex = '9999'; // Asegura que esté por encima de otros elementos

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
    }, 2000);
}

// Función para formatear la fecha
function formatDate(dateString) {
    if (!dateString) return 'No especificado';

    const date = new Date(dateString);

    // Verificar si la fecha es válida
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
        return people.filter(person => person != null); // Filtrar posibles valores nulos
    } catch (error) {
        console.error("Error al obtener personas:", error);
        return [];
    }
}


async function loadBrands(selectedId = null, targetSelect = 'all') {
  try {
    const brands = await deviceService.getAllDeviceBrand();
    
    // Definir qué selects actualizar
    const selectElements = [];
    if (targetSelect === 'all' || targetSelect === 'add') {
      selectElements.push(document.getElementById('brandDevice'));
    }
    if (targetSelect === 'all' || targetSelect === 'edit') {
      selectElements.push(document.getElementById('editBrandDevice'));
    }
    if (targetSelect === 'all' || targetSelect === 'filter') {
      selectElements.push(document.getElementById('filter-by-brand'));
    }

    // Función para llenar un select
    const fillSelect = (selectElement, isFilter = false) => {
      if (!selectElement) return;
      
      selectElement.innerHTML = '';
      
      // Opción por defecto (diferente para filtros)
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = isFilter ? 'Todas las marcas' : 'Seleccione una marca';
      defaultOption.selected = isFilter;
      if (!isFilter) defaultOption.disabled = true;
      selectElement.appendChild(defaultOption);

      // Agregar cada marca
      brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.brandName;
        option.textContent = brand.brandName;
        if (selectedId && brand.id == selectedId) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
    };

    // Llenar los selects
    selectElements.forEach(select => {
      if (select) fillSelect(select, select.id === 'filter-by-brand');
    });
    
  } catch (error) {
    console.error('Error al cargar marcas:', error);
    showNotification('Error al cargar las marcas: ' + error.message, 'error');
  }
}

// Función similar para cargar tipos
async function loadTypes(selectedId = null, targetSelect = 'all') {
  try {
    const types = await deviceService.getAllDeviceType();
    
    const selectElements = [];
    if (targetSelect === 'all' || targetSelect === 'add') {
      selectElements.push(document.getElementById('typeDevice'));
    }
    if (targetSelect === 'all' || targetSelect === 'edit') {
      selectElements.push(document.getElementById('editTypeDevice'));
    }
    if (targetSelect === 'all' || targetSelect === 'filter') {
      selectElements.push(document.getElementById('filter-by-type'));
    }

    const fillSelect = (selectElement, isFilter = false) => {
      if (!selectElement) return;
      
      selectElement.innerHTML = '';
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = isFilter ? 'Todos los tipos' : 'Seleccione un tipo';
      defaultOption.selected = isFilter;
      if (!isFilter) defaultOption.disabled = true;
      selectElement.appendChild(defaultOption);

      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.typeName;
        option.textContent = type.typeName;
        if (selectedId && type.id == selectedId) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
    };

    selectElements.forEach(select => {
      if (select) fillSelect(select, select.id === 'filter-by-type');
    });
    
  } catch (error) {
    console.error('Error al cargar tipos:', error);
    showNotification('Error al cargar tipos: ' + error.message, 'error');
  }
}

///////////////////////////////////////////
////    Funciones para obtener datos    ////
///////////////////////////////////////////

async function getAllInterventionOrders() {
    try {
        const interventionOrders = await interventionService.getAllInterventionOrders();
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
            bodyTable.innerHTML = '<tr><td colspan="9" class="text-center">No hay ordenes registradas</td></tr>';
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
        <td>${interventionOrder.interventionStatus}</td>
        <td>${formatDate(interventionOrder.entryDate)}</td>
        <td>${formatDate(interventionOrder.deliveryDate)}</td>
        <td>${interventionOrder.device.brandDevice?.brandName} ${interventionOrder.device?.model}</td>
        <td>${(people?.find(p => p.role?.roleName === 'Cliente')?.name + ' ' + people?.find(p => p.role?.roleName === 'Cliente')?.lastName) || 'No especificado'}</td>
        <td class="action-buttons">
            <button id="details-order-btn" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#viewOrderModal " data-order-id="${interventionOrder.id || ''}"><i class="bi bi-eye"></i></button>
            <button id="edit-order-btn" class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editOrderModal" data-order-id="${interventionOrder.id || ''}"><i class="bi bi-pencil"></i></button>
            <button id="deliver-order-btn" class="btn btn-sm btn-success" data-order-id="${interventionOrder.id || ''}"><i class="bi bi-check2"></i></button>
        </td>
    </tr>
    `;
            bodyTable.appendChild(row);
        });
        const existingListener = bodyTable.getAttribute('data-listener-attached');
        if (!existingListener) {
            bodyTable.setAttribute('data-listener-attached', 'true');
        }
    } catch (error) {
        console.error("Error al obtener las ordenes:", error);
        const bodyTable = document.querySelector("#ordersTableBody");
        if (bodyTable) {
            bodyTable.innerHTML = `
        <tr>
        <td colspan="9" class="text-center text-danger">
            Error al cargar las órdenes. ${error.message || 'Por favor intente más tarde.'}
            <button class="btn btn-sm btn-primary mt-2" onclick="getStaff()">Reintentar</button>
        </td>
        </tr>
    `;
        }
    }
}


async function loadTechnicians(containerSelector = '.list-group', radioName = 'tecnicoSeleccionado') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Mostrar estado de carga
    container.innerHTML = `
    <div class="list-group-item text-center py-3">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando técnicos...</span>
    </div>
    <p class="mt-2 mb-0">Cargando técnicos...</p>
    </div>
`;

    try {
        const role = await personService.getRoleByName("Tecnico");
        const technicians = await personService.getPersonByRole(role.id);

        container.innerHTML = ''; // Limpiar el contenedor

        if (technicians.length === 0) {
            container.innerHTML = `
        <div class="list-group-item text-center py-3">
        <p class="mb-0">No hay técnicos disponibles</p>
        </div>
    `;
            return [];
        }

        technicians.forEach(tech => {
            const techItem = document.createElement('label');
            techItem.className = 'list-group-item d-flex align-items-center';

            const specialties = tech.specialties?.length
                ? tech.specialties.map(s => s?.specialtyName || '').filter(Boolean).join(', ')
                : 'Ninguna';

            // Crear los elementos HTML para cada técnico
            techItem.innerHTML = `
    <input class="form-check-input me-2" type="radio" name="${radioName}" value="${tech.id}">
    <div>
        <div class="fw-bold">${`${tech.name} ${tech.lastName}`}</div>
        <div>
        ${specialties}
        </div>
    </div>
    `;

            container.appendChild(techItem);
        });

        return technicians;
    } catch (error) {
        console.error("Error al obtener técnicos:", error);

        container.innerHTML = `
    <div class="list-group-item text-center py-3 text-danger">
        <p class="mb-0">Error al cargar técnicos</p>
    </div>
    `;
        showNotification("Error al cargar los técnicos. Por favor, intente nuevamente.", "error");
        throw error;
    }
}


async function loadOrderDataToEdit(orderId) {
    const order = await interventionService.getInterventionOrderById(orderId);
    const detailsOrder = await interventionService.getInterventionDetailByOrderId(orderId);
    const people = await getPeopleFromOrder(order);
    const customer = people?.find(p => p.role?.roleName === 'Cliente');
    const technician = people?.find(p => p.role?.roleName === 'Tecnico');

    // Llenar los campos del formulario
    document.getElementById('editTypeDevice').value = order.device.typeDevice.typeName;
    document.getElementById('editBrandDevice').value = order.device.brandDevice.brandName;
    document.getElementById('editModelDevice').value = order.device.model;
    document.getElementById('editSerialDevice').value = order.device.serial;
    document.getElementById('editDeliveryDate').value = order.deliveryDate;
    document.getElementById('editPasswordDevice').value = order.device.password;
    document.getElementById('editProblemDescription').value = detailsOrder.problemDescription;
    document.getElementById('editCustomerName').value = customer.name;
    document.getElementById('editCustomerLastName').value = customer.lastName;
    document.getElementById('editCustomerPhone').value = customer.phone;
    document.getElementById('editCustomerAddress').value = customer.address;

    // Seleccionar el técnico actual en los radio buttons
    if (technician) {
        const radioButton = document.querySelector(`input[name="tecnicoSeleccionadoEditar"][value="${technician.id}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
    }
}

async function loadOrderDataToDetail(orderId) {
    const order = await interventionService.getInterventionOrderById(orderId);
    const detailsOrder = await interventionService.getInterventionDetailByOrderId(orderId);
    const people = await getPeopleFromOrder(order);
    const customer = people?.find(p => p.role?.roleName === 'Cliente');
    const technician = people?.find(p => p.role?.roleName === 'Tecnico');

    document.getElementById('order-id').textContent = orderId;
    document.getElementById('order-status').textContent = order.interventionStatus;
    document.getElementById('order-entry-date').textContent = formatDate(order.entryDate);
    document.getElementById('order-delivery-date').textContent = formatDate(order.deliveryDate);
    document.getElementById('technician-name').textContent = `${technician.name} ${technician.lastName}`;
    document.getElementById('technician-id').textContent = technician.id;
    document.getElementById('customer-name').textContent = `${customer.name} ${customer.lastName}`;
    document.getElementById('customer-phone').textContent = customer.phone;
    document.getElementById('customer-address').textContent = customer.address;
    document.getElementById('device-type').textContent = order.device.typeDevice.typeName;
    document.getElementById('device-brand').textContent = order.device.brandDevice.brandName;
    document.getElementById('device-model').textContent = order.device.model;
    document.getElementById('device-serial').textContent = order.device.serial || "No aplica";
    document.getElementById('device-password').textContent = order.device.password || "No aplica";
    document.getElementById('problem-description').textContent = detailsOrder.problemDescription;
    document.getElementById('solution').textContent = detailsOrder.solutionDescription || "Aun no añadida";
}


//////////////////////////////////////////////////////
////  Función para crear una nueva orden  ////
////////////////////////////////////////////////////

async function newOrder() {
    try {
        const typeDeviceName = document.getElementById('typeDevice').value;
        const brandDeviceName = document.getElementById('brandDevice').value;
        const modelDevice = document.getElementById('modelDevice').value.trim();
        const serialDevice = document.getElementById('serialDevice').value.trim();
        const deliveryDate = document.getElementById('deliveryDate').value;
        const passwordDevice = document.getElementById('passwordDevice').value.trim();
        const problemDescription = document.getElementById('problemDescription').value.trim();
        const customerName = document.getElementById('customerName').value.trim();
        const customerLastName = document.getElementById('customerLastName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();
        const selectedTechnician = document.querySelector('input[name="tecnicoSeleccionado"]:checked');

        if(!typeDeviceName){
            throw new Error("Porfavor seleccione un tipo de equipo");
        }
        if(!brandDeviceName){
            throw new Error("Porfavor seleccione una marca de equipo");
        }
        if(!modelDevice){
            throw new Error("Campo modelo vacio");
        }
        if(!deliveryDate){
            throw new Error("Campo fecha de entrega vacio");
        }
        if(!modelDevice){
            throw new Error("Campo modelo vacio");
        }
        if(!problemDescription){
            throw new Error("Campo descripción del problema vacio");
        }
        if(!customerName){
            throw new Error("Campo nombre del cliente vacio");
        }
        if(!customerLastName){
            throw new Error("Campo apellido del cliente vacio");
        }
        if(!customerPhone){
            throw new Error("Campo telefono del cliente vacio");
        }
        if(!customerAddress){
            throw new Error("Campo direccion del cliente vacio");
        }

        if (!selectedTechnician) {
            throw new Error("Por favor seleccione un técnico");
        }
        const technicianId = selectedTechnician.value;

        const role = await personService.getRoleByName("Cliente");

        const customer = {
            name: customerName,
            lastName: customerLastName,
            phone: customerPhone,
            address: customerAddress,
            role: role

        }
        const responsePerson = await personService.registerPerson(customer);

        if (!responsePerson || responsePerson.error) {
            throw new Error(responsePerson?.message || "Error al registrar el cliente");
        }

        const brandDevice = await deviceService.getDeviceBrandByName(brandDeviceName);
        const typeDevice = await deviceService.getDeviceTypeByName(typeDeviceName);

        const device = {
            typeDevice: typeDevice,
            brandDevice: brandDevice,
            model: modelDevice,
            serial: serialDevice || null,
            password: passwordDevice || null
        }

        const responseDevice = await deviceService.registerDevice(device);

        if (!responseDevice || responseDevice.error) {
            throw new Error(responseDevice?.message || "Error al registrar el equipo");
        }

        const interventionOrder = {
            interventionStatus: "Pendiente",
            deliveryDate: deliveryDate,
            device: {
                id: responseDevice.id
            },
            people: [
                {
                    id: responsePerson.id
                },
                {
                    id: technicianId
                }
            ]
        };

        const responseOrder = await interventionService.createInterventionOrder(interventionOrder);

        if (!responseOrder || responseOrder.error) {
            throw new Error(responseOrder?.message || "Error al registrar la orden");
        }

        const interventionDetail = {
            problemDescription: problemDescription,
            
            interventionOrder: {
                id: responseOrder.id
            }
        }

        const responseOrderDetail = await interventionService.createInterventionDetail(interventionDetail);

        if (!responseOrderDetail || responseOrderDetail.error) {
            throw new Error(responseOrderDetail?.message || "Error al registrar el detalle de la orden");
        }

        showNotification("Orden creada correctamente", "success");
        cleanForm();
        setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
        console.error("Error de registro:", error);
        showNotification("Error de registro: " + error.message, "error");
    }
}



// Función para actualizar una orden de intervención
async function updateOrder() {
    try {
        const orderId = document.querySelector('#editOrderModal').getAttribute('data-order-id');
        if (!orderId) {
            throw new Error("No se pudo obtener el ID de la orden");
        }

        // Obtener datos del formulario de edición
        const typeDeviceName = document.getElementById('editTypeDevice').value;
        const brandDeviceName = document.getElementById('editBrandDevice').value;
        const modelDevice = document.getElementById('editModelDevice').value.trim();
        const serialDevice = document.getElementById('editSerialDevice').value.trim();
        const deliveryDate = document.getElementById('editDeliveryDate').value;
        const passwordDevice = document.getElementById('editPasswordDevice').value.trim();
        const problemDescription = document.getElementById('editProblemDescription').value.trim();
        const customerName = document.getElementById('editCustomerName').value.trim();
        const customerLastName = document.getElementById('editCustomerLastName').value.trim();
        const customerPhone = document.getElementById('editCustomerPhone').value.trim();
        const customerAddress = document.getElementById('editCustomerAddress').value.trim();

        if(!typeDeviceName){
            throw new Error("Porfavor seleccione un tipo de equipo");
        }
        if(!brandDeviceName){
            throw new Error("Porfavor seleccione una marca de equipo");
        }
        if(!modelDevice){
            throw new Error("Campo modelo vacio");
        }
        if(!deliveryDate){
            throw new Error("Campo fecha de entrega vacio");
        }
        if(!modelDevice){
            throw new Error("Campo modelo vacio");
        }
        if(!problemDescription){
            throw new Error("Campo descripción del problema vacio");
        }
        if(!customerName){
            throw new Error("Campo nombre del cliente vacio");
        }
        if(!customerLastName){
            throw new Error("Campo apellido del cliente vacio");
        }
        if(!customerPhone){
            throw new Error("Campo telefono del cliente vacio");
        }
        if(!customerAddress){
            throw new Error("Campo direccion del cliente vacio");
        }


        console.log("Buscando técnico seleccionado...");
        const allRadios = document.querySelectorAll('input[name="tecnicoSeleccionadoEditar"]');
        console.log("Todos los radios encontrados:", allRadios);
        const selectedTechnician = document.querySelector('input[name="tecnicoSeleccionadoEditar"]:checked');
        console.log("Técnico seleccionado:", selectedTechnician);
        
        if (!selectedTechnician) {
            throw new Error("Por favor seleccione un técnico");
        }
        const technicianId = selectedTechnician.value;

        // Obtener la orden existente para actualizar
        const existingOrder = await interventionService.getInterventionOrderById(orderId);
        const existingDetails = await interventionService.getInterventionDetailByOrderId(orderId);
        const existingPeople = await getPeopleFromOrder(existingOrder);
        const existingCustomer = existingPeople.find(p => p.role?.roleName === 'Cliente');

        // 1. Actualizar el cliente
        const updatedCustomer = {
            id: existingCustomer.id,
            name: customerName,
            lastName: customerLastName,
            phone: customerPhone,
            address: customerAddress,
            role: existingCustomer.role
        };
        await personService.updatePerson(existingCustomer.id, updatedCustomer);

        const brandDevice = await deviceService.getDeviceBrandByName(brandDeviceName);
        alert(brandDevice.brandName)
        const typeDevice = await deviceService.getDeviceTypeByName(typeDeviceName);

        // 2. Actualizar el dispositivo
        const updatedDevice = {
            id: existingOrder.device.id,
            typeDevice: typeDevice,
            brandDevice: brandDevice,
            model: modelDevice,
            serial: serialDevice || null,
            password: passwordDevice || null
        };
        await deviceService.updateDevice(existingOrder.device.id, updatedDevice);

        // 3. Actualizar la orden de intervención
        const updatedOrder = {
            interventionStatus: existingOrder.interventionStatus, // Mantener el estado actual
            deliveryDate: deliveryDate,
            device: {
                id: existingOrder.device.id
            },
            people: [
                {
                    id: existingCustomer.id
                },
                {
                    id: technicianId
                }
            ]
        };
        await interventionService.updateInterventionOrder(orderId, updatedOrder);

        // 4. Actualizar los detalles de la intervención
        const updatedDetail = {
            problemDescription: problemDescription,
            solutionDescription: existingDetails.solutionDescription || null,
            interventionOrder: {
                id: orderId
            }
        };
        await interventionService.updateInterventionDetail(existingDetails.id, updatedDetail);

        showNotification("Orden actualizada correctamente", "success");
        setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
        console.error("Error al actualizar la orden:", error);
        showNotification("Error al actualizar: " + error.message, "error");
    }
}


// Función para buscar órdenes por nombre de cliente
async function searchOrdersByCustomer() {
    const searchInput = document.querySelector('#searchCustomerInput').value.trim();
    const searchBtn = document.querySelector('#searchCustomerBtn');
    const bodyTable = document.querySelector("#ordersTableBody");
    
    if (!searchInput) {
        showNotification("Por favor ingrese un nombre para buscar", "error");
        return;
    }
    
    try {
        // Mostrar estado de carga
        searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Buscando...';
        searchBtn.disabled = true;
        bodyTable.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
        
        // Dividir el nombre en partes (para nombre y apellido)
        const nameParts = searchInput.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const orders = await interventionService.getOrdersByCustomerName(firstName, lastName);
        
        // Actualizar contador
        const counterElement = document.querySelector('.card-header .text-muted');
        counterElement.textContent = `Mostrando ${orders.length} de ${orders.length} órdenes`;
        
        // Mostrar resultados
        displayOrders(orders);
    } catch (error) {
        console.error('Error al buscar órdenes:', error);
        showNotification('Error al buscar órdenes: ' + (error.message || 'Por favor intente nuevamente'), 'error');
        bodyTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar órdenes</td></tr>';
    } finally {
        searchBtn.innerHTML = 'Buscar';
        searchBtn.disabled = false;
    }
}

// Función para limpiar la búsqueda
function clearSearch() {
    document.querySelector('#searchCustomerInput').value = '';
    getAllInterventionOrders(); // Vuelve a cargar todas las órdenes
}

// Función para mostrar órdenes
async function displayOrders(orders) {
    const bodyTable = document.querySelector("#ordersTableBody");

    if (!orders || !Array.isArray(orders)) {
        bodyTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Datos de órdenes no válidos</td></tr>';
        return;
    }

    if (orders.length === 0) {
        bodyTable.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron órdenes</td></tr>';
        return;
    }

    bodyTable.innerHTML = "";
    
    // Usamos Promise.all para esperar a que todas las promesas se resuelvan
    await Promise.all(orders.map(async (interventionOrder) => {
        const people = await getPeopleFromOrder(interventionOrder);
        const customer = people?.find(p => p.role?.roleName === 'Cliente');
        
        const row = document.createElement("tr");
        row.setAttribute('data-order-id', interventionOrder.id || '');

        row.innerHTML = `
            <td>${interventionOrder.id}</td>
            <td>${interventionOrder.interventionStatus}</td>
            <td>${formatDate(interventionOrder.entryDate)}</td>
            <td>${formatDate(interventionOrder.deliveryDate)}</td>
            <td>${interventionOrder.device.brandDevice?.brandName} ${interventionOrder.device?.model}</td>
            <td>${customer ? `${customer.name} ${customer.lastName}` : 'No especificado'}</td>
            <td class="action-buttons">
                <button id="details-order-btn" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#viewOrderModal" data-order-id="${interventionOrder.id || ''}">
                    <i class="bi bi-eye"></i>
                </button>
                <button id="edit-order-btn" class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#editOrderModal" data-order-id="${interventionOrder.id || ''}">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `;
        bodyTable.appendChild(row);
    }));
}


async function deliverOrder(orderId) {
  try {
    const order = await interventionService.getInterventionOrderById(orderId);
    
    if (!order) {
      throw new Error("Orden no encontrada");
    }
    const updatedOrder = {
      interventionStatus: 'Entregada',
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
      getAllInterventionOrders();
    } else {
      throw new Error("No se pudo actualizar la orden");
    }
  } catch(error) {
    console.error("Error al actualizar la orden:", error);
    showNotification("Error al actualizar: " + (error.message || "Error desconocido"), "error");
  }
}




async function loadUsedParts(orderId) {
  try {
    const details = await interventionService.getInterventionDetailByOrderId(orderId);
    if (!details || !details.id) {
      document.getElementById('used-parts-list').innerHTML = '<li class="list-group-item text-center">No hay repuestos usados</li>';
      document.getElementById('total-cost').textContent = '$0.00';
      return;
    }

    const usedParts = await sparePartService.getUseSparePartsByInterventionDetailsId(details.id);
    const partsList = document.getElementById('used-parts-list');
    partsList.innerHTML = '';

    if (!usedParts || usedParts.length === 0) {
      partsList.innerHTML = '<li class="list-group-item text-center">No hay repuestos usados</li>';
      document.getElementById('total-cost').textContent = '$0.00';
      return;
    }

    let totalCost = 0;
    
    usedParts.forEach(part => {
      const partCost = part.sparePart.price * part.quantity;
      totalCost += partCost;
      
      const partItem = document.createElement('li');
      partItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      partItem.innerHTML = `
        ${part.sparePart.brandSparePart.brandName} - ${part.sparePart.typeSparePart.typeName} - ${part.sparePart.model}
        <span>
          <span class="badge bg-primary rounded-pill me-2">${part.quantity}</span>
          <span class="text-success fw-bold">$${partCost.toFixed(2)}</span>
        </span>
      `;
      partsList.appendChild(partItem);
    });

    // Mostrar el total
    document.getElementById('total-cost').textContent = `$${totalCost.toFixed(2)}`;
    
  } catch (error) {
    console.error("Error al cargar repuestos usados:", error);
    showNotification("Error al cargar repuestos usados", "error");
  }
}




let techniciansLoaded = false;
document.addEventListener('DOMContentLoaded', () => {
    loadBrands(null, 'all');
    loadTypes(null, 'all');
    getAllInterventionOrders();
    
    document.querySelector('#save-add-order-btn').addEventListener('click', newOrder);

    // Pre-cargar técnicos pero no mostrarlos aún
    loadTechnicians('#add-technician', 'tecnicoSeleccionado').then(() => {
        techniciansLoaded = true;
    });

    // document.querySelector('#new-order-btn').addEventListener('click', () => loadTechnicians('#add-technician'));
    document.querySelector('#new-order-btn').addEventListener('click', () => loadTechnicians('#add-technician', 'tecnicoSeleccionado'));
    

    // Event listeners para la búsqueda
    document.querySelector('#searchCustomerBtn').addEventListener('click', searchOrdersByCustomer);
    document.querySelector('#clearSearchBtn').addEventListener('click', clearSearch);
    
    // Permitir búsqueda con Enter
    document.querySelector('#searchCustomerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchOrdersByCustomer();
        }
    });
    
    document.getElementById('ordersTableBody').addEventListener('click', function (event) {
        const editBtn = event.target.closest('#edit-order-btn');
        const detailsBtn = event.target.closest('#details-order-btn');

        if (event.target.closest('#deliver-order-btn')) {
        const orderId = event.target.closest('#deliver-order-btn').getAttribute('data-order-id');
        deliverOrder(orderId);
        }

        if (editBtn) {
            const orderId = editBtn.getAttribute('data-order-id');
            // Guardar el ID de la orden en el modal
            document.querySelector('#editOrderModal').setAttribute('data-order-id', orderId);
            loadTechnicians('#edit-technician', 'tecnicoSeleccionadoEditar');
            loadOrderDataToEdit(orderId);
        }
        
        if (detailsBtn) {
            const orderId = detailsBtn.getAttribute('data-order-id');
            loadOrderDataToDetail(orderId);
            loadUsedParts(orderId);
        }
    });


    document.querySelector('#create-new-brand-btn')?.addEventListener('click', async () => {
        await createNewBrand();
        loadBrands(null, 'all');
    });

    document.querySelector('#create-new-type-btn')?.addEventListener('click', async () => {
        await createNewType();
        loadTypes(null, 'all');
    });
    

    document.querySelector("#save-changes-order-btn").addEventListener('click', updateOrder);
}); 