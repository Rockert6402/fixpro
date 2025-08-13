import { sparePartService } from "../../../utils/api/services/fetchInventory.js";

// Crear las notificaciones
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
  }, 1000);
}

// Crear una nueva marca
async function createNewBrand() {
  try {
    const newBrandName = document.getElementById("newBrandName").value;
    if (!newBrandName) {
      throw new Error("Por favor complete todos los campos requeridos");
    }
    
    const newBrand = { brandName: newBrandName };
    const response = await sparePartService.addSparePartBrand(newBrand);
    
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
      throw new Error("Por favor complete todos los campos requeridos");
    }
    
    const newType = { typeName: newTypeName };
    const response = await sparePartService.addSparePartType(newType);
    
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

// Limpiar el formulario de agregar repuesto
function clearForm() {
    const form = document.getElementById("addSparePartForm");
    form.reset();
    
    const brandSelect = document.getElementById("brand");
    const typeSelect = document.getElementById("type");
    
    if (brandSelect) {
        brandSelect.value = "";
        brandSelect.selectedIndex = -1;
    }
    if (typeSelect) {
        typeSelect.value = "";
        typeSelect.selectedIndex = -1;
    }
}

// Función para agregar un nuevo repuesto
async function addSparePart() {
    try {
        const brandSelect = document.getElementById("brand");
        const typeSelect = document.getElementById("type");

        // Verificar que se hayan seleccionado valores
        if (brandSelect.selectedIndex <= 0 || typeSelect.selectedIndex <= 0) {
            throw new Error("Debe seleccionar una marca y un tipo");
        }

        // Obtener los IDs directamente
        const brandId = parseInt(brandSelect.value);
        const brandName = brandSelect.options[brandSelect.selectedIndex].text;
        
        const typeId = parseInt(typeSelect.value);
        const typeName = typeSelect.options[typeSelect.selectedIndex].text;

        const model = document.getElementById("model").value.trim();
        const stock = parseInt(document.getElementById("stock").value);
        const unitPrice = parseFloat(document.getElementById("unitPrice").value);

        // Validaciones
        if (!brandId || !model || !typeId || isNaN(stock) || isNaN(unitPrice)) {
            throw new Error("Todos los campos son obligatorios");
        }

        if (stock < 0) {
            throw new Error("El stock no puede ser negativo");
        }
        
        if (unitPrice <= 0) {
            throw new Error("El precio unitario debe ser mayor que cero");
        }

        // Construir objeto para el backend
        const newSparePart = {
            model: model,
            price: unitPrice,
            availability: stock > 0 ? "Disponible" : "Agotado",
            stock: stock,
            brandSparePart: {
                id: brandId,
                brandName: brandName
            },
            typeSparePart: {
                id: typeId,
                typeName: typeName
            }
        };

        console.log("Objeto a enviar:", newSparePart);

        const response = await sparePartService.addSparePart(newSparePart);
        
        showNotification("Repuesto agregado correctamente", "success");
        clearForm();

        const modal = bootstrap.Modal.getInstance(document.getElementById('addSparePartModal'));
        modal.hide();
        
        return response;
    } catch (error) {
        console.error("Error al agregar repuesto:", error);
        showNotification(`Error al agregar repuesto: ${error.message}`, "error");
        throw error;
    }
}

// Función para renderizar los repuestos en la tabla
function renderSpareParts(spareParts) {
    const tbody = document.querySelector('.table-responsive table tbody');
    const counterElement = document.querySelector('.card-header .text-muted');
    
    tbody.innerHTML = '';
    
    if (spareParts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    No se encontraron repuestos con los filtros aplicados
                </td>
            </tr>
        `;
    } else {
        spareParts.forEach(sparePart => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sparePart.id}</td>
                <td>${sparePart.brandSparePart?.brandName || 'Sin marca'}</td>
                <td>${sparePart.model}</td>
                <td>${sparePart.typeSparePart?.typeName || 'Sin tipo'}</td>
                <td>${sparePart.stock}</td>
                <td>$${sparePart.price?.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${sparePart.id}" 
                        data-bs-toggle="modal" data-bs-target="#editSparePartModal">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${sparePart.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    counterElement.textContent = `Mostrando ${spareParts.length} repuestos`;
}

// Función para cargar los repuestos
async function loadSpareParts() {
    try {
        const showInactive = document.getElementById('show-inactive').checked;
        const allSpareParts = await sparePartService.getAllSpareParts();
        
        const filteredParts = showInactive 
            ? allSpareParts 
            : allSpareParts.filter(part => part.availability !== "Inactivo");
        
        renderSpareParts(filteredParts);
    } catch (error) {
        console.error("Error al cargar repuestos:", error);
        showNotification(`Error: ${error.message}`, "error");
    }
}


// Función para cargar marcas en todos los selects
async function loadBrands(selectedId = null, targetSelect = 'all') {
  try {
    const brands = await sparePartService.getAllSparePartBrand();
    
    // Definir qué selects actualizar
    const selectElements = [];
    if (targetSelect === 'all' || targetSelect === 'add') {
      selectElements.push(document.getElementById('brand'));
    }
    if (targetSelect === 'all' || targetSelect === 'edit') {
      selectElements.push(document.getElementById('editBrand'));
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
        option.value = brand.id;
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
    const types = await sparePartService.getAllSparePartType();
    
    const selectElements = [];
    if (targetSelect === 'all' || targetSelect === 'add') {
      selectElements.push(document.getElementById('type'));
    }
    if (targetSelect === 'all' || targetSelect === 'edit') {
      selectElements.push(document.getElementById('editType'));
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
        option.value = type.id;
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

// Variable para mantener el ID del repuesto que se está editando
let currentEditingId = null;

// Función para preparar el modal de edición
async function prepareEditModal(id) {
    try {
        currentEditingId = id;
        const sparePart = await sparePartService.getSparePartById(id);
        
        // Llenar SOLO los campos del modal de edición (no los filtros)
        document.getElementById('editBrand').value = sparePart.brandSparePart?.id || '';
        document.getElementById('editModel').value = sparePart.model || '';
        document.getElementById('editType').value = sparePart.typeSparePart?.id || '';
        document.getElementById('editCurrentStock').value = sparePart.stock || 0;
        document.getElementById('editUnitPrice').value = sparePart.price?.toFixed(2) || '0.00';
        
        // Configurar controles de stock (solo en el modal)
        const reduceInput = document.getElementById('reduceStockInput');
        if (reduceInput) {
            reduceInput.max = sparePart.stock || 0;
            reduceInput.value = 0;
        }
        
        const maxStockHelp = document.getElementById('maxStockHelp');
        if (maxStockHelp) {
            maxStockHelp.textContent = `Máximo: ${sparePart.stock || 0} (stock actual)`;
        }
            
        // Resetear campo de agregar stock (solo en el modal)
        const addStockInput = document.getElementById('addStockInput');
        if (addStockInput) {
            addStockInput.value = 0;
        }
        
    } catch (error) {
        console.error("Error al cargar repuesto para edición:", error);
        showNotification(`Error al cargar repuesto para edición: ${error.message}`, "error");
    }
}

// Función para actualizar un repuesto
async function updateSparePart() {
    try {
        const brandSelect = document.getElementById("editBrand");
        const typeSelect = document.getElementById("editType");

        // Verificar que se hayan seleccionado valores
        if (brandSelect.selectedIndex <= 0 || typeSelect.selectedIndex <= 0) {
            throw new Error("Debe seleccionar una marca y un tipo");
        }

        // Obtener los IDs y nombres
        const brandId = parseInt(brandSelect.value);
        const brandName = brandSelect.options[brandSelect.selectedIndex].text;
        
        const typeId = parseInt(typeSelect.value);
        const typeName = typeSelect.options[typeSelect.selectedIndex].text;

        const model = document.getElementById("editModel").value.trim();
        const currentStock = parseInt(document.getElementById("editCurrentStock").value);
        const addStock = parseInt(document.getElementById("addStockInput").value) || 0;
        const reduceStock = parseInt(document.getElementById("reduceStockInput").value) || 0;
        const unitPrice = parseFloat(document.getElementById("editUnitPrice").value);

        // Validaciones
        if (!brandId || !model || !typeId || isNaN(unitPrice)) {
            throw new Error("Todos los campos son obligatorios");
        }

        if (unitPrice <= 0) {
            throw new Error("El precio unitario debe ser mayor que cero");
        }

        if (reduceStock > currentStock) {
            throw new Error("No puedes reducir más stock del disponible");
        }

        // Calcular nuevo stock
        const newStock = currentStock + addStock - reduceStock;
        
        if (newStock < 0) {
            throw new Error("El stock no puede ser negativo");
        }

        // Construir objeto para el backend
        const updatedSparePart = {
            model: model,
            price: unitPrice,
            availability: newStock > 0 ? "Disponible" : "Agotado",
            stock: newStock,
            brandSparePart: {
                id: brandId,
                brandName: brandName
            },
            typeSparePart: {
                id: typeId,
                typeName: typeName
            }
        };

        console.log("Objeto a enviar para actualización:", updatedSparePart);

        // Enviar actualización
        await sparePartService.updateSparePart(currentEditingId, updatedSparePart);
        
        // Mostrar feedback al usuario
        showNotification("Repuesto actualizado correctamente", "success");
        
        // Cerrar modal y recargar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSparePartModal'));
        modal.hide();
        await loadSpareParts();
        
    } catch (error) {
        console.error("Error al actualizar repuesto:", error);
        showNotification(`Error al actualizar repuesto: ${error.message}`, "error");
    }
}

// Configuración de los botones de stock
function setupStockButtons() {
    // Botones para agregar stock
    document.getElementById('decreaseAddStock').addEventListener('click', () => {
        const input = document.getElementById('addStockInput');
        input.value = Math.max(0, parseInt(input.value) - 1);
    });
    
    document.getElementById('increaseAddStock').addEventListener('click', () => {
        const input = document.getElementById('addStockInput');
        input.value = (parseInt(input.value) || 0) + 1;
    });
    
    // Botones para reducir stock
    document.getElementById('decreaseReduceStock').addEventListener('click', () => {
        const input = document.getElementById('reduceStockInput');
        input.value = Math.max(0, parseInt(input.value) - 1);
    });
    
    document.getElementById('increaseReduceStock').addEventListener('click', () => {
        const input = document.getElementById('reduceStockInput');
        const max = parseInt(input.max) || 0;
        input.value = Math.min(max, (parseInt(input.value) || 0) + 1);
    });
}

// Configuración de eventos de la tabla
function setupTableEvents() {
    const tbody = document.querySelector('.table-responsive table tbody');
    
    tbody.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const id = button.getAttribute('data-id');
            await prepareEditModal(id);
        }

        if (e.target.closest('.delete-btn')) {
          const button = e.target.closest('.delete-btn');
          const id = button.getAttribute('data-id');
          await deleteSparePart(id); // Llama a la función corregida
        }
    });
}

// Función para eliminar un repuesto
async function deleteSparePart(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este repuesto?')) {
    try {
        const response = await sparePartService.deleteSparePart(id);
        
        if (!response) {
            throw new Error("No se pudo eliminar el repuesto");
        }
        
        showNotification("Repuesto eliminado correctamente", "success");
        await loadSpareParts(); // Recargar la lista
        
        return response;
    } catch (error) {
        console.error("Error al cambiar disponibilidad:", error);
        showNotification(`Error: ${error.message}`, "error");
        throw error;
    }
  }
}

// Función para configurar los filtros
function setupFilterEvents() {
    // Elementos del DOM
    const brandFilter = document.getElementById('filter-by-brand');
    const typeFilter = document.getElementById('filter-by-type');
    const modelInput = document.getElementById('search-model');
    const searchBtn = document.getElementById('search-model-btn');
    const clearBtn = document.getElementById('clear-filters-btn');
    const showInactiveCheckbox = document.getElementById('show-inactive');
    const showOnlyInactiveCheckbox = document.getElementById('show-only-inactive');

    // Función principal de filtrado
    const applyFilters = async () => {
        try {
            const showInactive = showInactiveCheckbox.checked;
            const showOnlyInactive = showOnlyInactiveCheckbox.checked;
            const brandId = brandFilter.value;
            const typeId = typeFilter.value;
            const modelQuery = modelInput.value.trim().toLowerCase();
            
            const allParts = await sparePartService.getAllSpareParts();
            
            // Lógica combinada de filtrado por estado
            let filteredParts = allParts.filter(part => {
                if (showOnlyInactive) {
                    return part.availability === "Inactivo"; // Solo inactivos
                } else if (!showInactive) {
                    return part.availability !== "Inactivo"; // Solo activos (default)
                }
                return true; // Mostrar todos (cuando showInactive=true)
            });
            
            // Aplicar otros filtros
            filteredParts = filteredParts
                .filter(part => !brandId || part.brandSparePart?.id == brandId)
                .filter(part => !typeId || part.typeSparePart?.id == typeId)
                .filter(part => !modelQuery || part.model.toLowerCase().includes(modelQuery));
            
            renderSpareParts(filteredParts);
            
        } catch (error) {
            console.error("Error al filtrar:", error);
            showNotification("Error al aplicar filtros", "error");
        }
    };

    // Event Listeners para checkboxes (exclusión mutua)
    showInactiveCheckbox?.addEventListener('change', function() {
        if (this.checked) {
            showOnlyInactiveCheckbox.checked = false;
        }
        applyFilters();
        showNotification(
            this.checked ? 'Mostrando todos los repuestos' : 'Mostrando solo repuestos activos',
            "info"
        );
    });

    showOnlyInactiveCheckbox?.addEventListener('change', function() {
        if (this.checked) {
            showInactiveCheckbox.checked = false;
        }
        applyFilters();
        showNotification(
            this.checked ? 'Mostrando solo repuestos inactivos' : 'Mostrando repuestos activos',
            "info"
        );
    });

    // Resto de event listeners
    brandFilter?.addEventListener('change', applyFilters);
    typeFilter?.addEventListener('change', applyFilters);
    searchBtn?.addEventListener('click', applyFilters);
    modelInput?.addEventListener('keypress', (e) => e.key === 'Enter' && applyFilters());

    // Limpiar filtros
    clearBtn?.addEventListener('click', () => {
        brandFilter.value = '';
        typeFilter.value = '';
        modelInput.value = '';
        showInactiveCheckbox.checked = false;
        showOnlyInactiveCheckbox.checked = false;
        loadSpareParts();
        showNotification("Filtros limpiados", "success");
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
    // Cargar datos iniciales
    loadBrands(null, 'all');
    loadTypes(null, 'all');
    loadSpareParts();

    // Configurar eventos de modales
    document.getElementById('addSparePartModal').addEventListener('shown.bs.modal', function () {
        clearForm();
        loadBrands(null, 'add');
        loadTypes(null, 'add');
    });

    // Configurar botones y eventos
    document.querySelector('#save-spare-part-btn')?.addEventListener('click', async () => {
        await addSparePart();
        await loadSpareParts();
    });
    
    document.querySelector('#create-new-brand-btn')?.addEventListener('click', async () => {
        await createNewBrand();
        loadBrands(null, 'all');
    });

    document.querySelector('#create-new-type-btn')?.addEventListener('click', async () => {
        await createNewType();
        loadTypes(null, 'all');
    });

    // Configurar eventos adicionales
    setupStockButtons();
    setupTableEvents();
    setupFilterEvents();

    // Modal de edición
    document.querySelector('#editSparePartModal .btn-primary')?.addEventListener('click', async () => {
        await updateSparePart();
    });
});