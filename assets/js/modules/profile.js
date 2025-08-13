import { personService } from "../../../utils/api/services/fetchPeople.js";

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
  
  const closeButton = toastContainer.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => toastContainer.remove());
  }
  
  setTimeout(() => toastContainer.remove(), 3000);
}

const sidebarConfig = {
  Administrador: [
    { href: "../dashboard/admin-dashboard.html", icon: "bi-house-door", text: "Inicio" },
    { href: "../inventory/inventory.html", icon: "bi-box-seam", text: "Inventario" },
    { href: "../people/people.html", icon: "bi-people", text: "Gestion del Personal" },
    { href: "profile.html", icon: "bi-person-circle", text: "Mi Perfil", active: true },
    { href: "#", icon: "fas fa-sign-out-alt", text: "Cerrar sesión", id: "logoutBtn" }
  ],
  Tecnico: [
    { href: "../dashboard/technician-dashboard.html", icon: "bi-house-door", text: "Inicio" },
    { href: "../orders/assigned-interventions.html", icon: "bi-file-earmark-text", text: "Órdenes Asignadas" },
    { href: "profile.html", icon: "bi-person-circle", text: "Mi Perfil", active: true },
    { href: "#", icon: "fas fa-sign-out-alt", text: "Cerrar sesión", id: "logoutBtn" }
  ],
  Asesor: [
    { href: "../dashboard/adviser-dashboard.html", icon: "bi-house-door", text: "Inicio" },
    { href: "../orders/orders.html", icon: "bi-file-earmark-text", text: "Órdenes" },
    { href: "profile.html", icon: "bi-person-circle", text: "Mi Perfil" },
    { href: "#", icon: "fas fa-sign-out-alt", text: "Cerrar sesión", id: "logoutBtn" }
  ]
};

function loadSidebar(role) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const config = sidebarConfig[role];
  let sidebarHTML = `
    <div class="position-sticky pt-3">
      <div class="text-center mb-4">
        <i class="bi bi-tools text-white fs-1 mb-2"></i>
        <h4 class="text-white fs-4">FixPro Management</h4>
        <p class="text-white fs-6">Panel de Control</p>
      </div>
      <ul class="nav flex-column">
  `;

  config.forEach(item => {
    sidebarHTML += `
      <li class="nav-item fs-5">
        <a class="nav-link ${item.active ? 'active' : ''}" 
           href="${item.href}" 
           ${item.id ? `id="${item.id}"` : ''}>
          <i class="${item.icon} me-2"></i>${item.text}
        </a>
      </li>
    `;
  });

  sidebar.innerHTML = sidebarHTML + `</ul></div>`;
}

async function loadProfileData() {
  try {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
      window.location.href = '/public/index.html';
      return;
    }

    const user = await personService.getPersonByEmail(userData.email);
    if (!user) throw new Error("Usuario no encontrado");

    loadSidebar(user.role.roleName);

    const specialtiesContainer = document.getElementById('specialtiesContainer');
    if (user.role.roleName.toLowerCase() === 'tecnico') {
      const specialties = user.specialties?.length 
        ? user.specialties.map(s => s?.specialtyName || '').filter(Boolean).join(', ') 
        : 'Ninguna';
      
      specialtiesContainer.innerHTML = `
        <label for="specialties" class="form-label">Especialidades</label>
        <input type="text" class="form-control" id="specialties" value="${specialties}" disabled>
      `;
    }

    document.getElementById('name').value = user.name || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('role').value = user.role.roleName || '';

    document.getElementById('personalInfoForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile(user.id);
    });

    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await changePassword(user.id);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.clear();
      window.location.href = '/public/index.html';
    });

  } catch (error) {
    showNotification("Error al cargar el perfil: " + error.message, "error");
  }
}

async function updateProfile(userId) {
  try {
    const person = await personService.getPersonById(userId);

    const specialties = person.specialties ? 
      person.specialties.map(specialty => ({ id: specialty.id })) : 
      [];


    const updatedData = {
      name: document.getElementById('name').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      role: {
        id: person.role.id
      },
      specialties: specialties
    };

    const success = await personService.updatePerson(userId, updatedData);
    if (success) {
      const userData = JSON.parse(sessionStorage.getItem('userData'));
      userData.email = updatedData.email;
      sessionStorage.setItem('userData', JSON.stringify(userData));
      
      showNotification("Perfil actualizado correctamente", "success");
    } else {
      throw new Error("Error al actualizar el perfil");
    }
  } catch (error) {
    showNotification("Error al actualizar el perfil: " + error.message, "error");
  }
}

async function changePassword(userId) {
  try {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("Todos los campos son obligatorios");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("Las contraseñas no coinciden");
    }

    if (newPassword.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    }

    const success = await personService.changePassword(userId, currentPassword, newPassword);
    if (!success) throw new Error("No se pudo cambiar la contraseña");
    
    showNotification("Contraseña cambiada correctamente", "success");
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    showNotification("Error al cambiar la contraseña: " + error.message, "error");
  }
}

document.addEventListener('DOMContentLoaded', loadProfileData);