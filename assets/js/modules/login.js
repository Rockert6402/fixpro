import { personService } from "../../../utils/api/services/fetchPeople.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const showPassword = document.getElementById('showPassword');
    const passwordInput = document.getElementById('password');
    const loginText = document.getElementById('loginText');
    const spinner = document.getElementById('spinner');
    const errorMessage = document.getElementById('errorMessage');

    if(showPassword && passwordInput) {
        showPassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            showPassword.innerHTML = type === 'password' ? '<i class = "bi bi-eye"></i>': '<i class = "bi bi-eye-slash"></i>';
        });
    }

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if(loginText && spinner) {
                loginText.classList.add('hidden');
                spinner.classList.remove('hidden');
            }
            loginForm.querySelector('button[type = "submit"]').disabled = true;

            if(errorMessage) errorMessage.textContent = '';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response =  await personService.login(email, password);

                if(response && response.success) {
                    const userData = {
                        email: email,
                        role: response.role,
                        isAutenticated: true
                    };

                    sessionStorage.setItem('userData', JSON.stringify(userData));

                    const roleRoutes = {
                            'Administrador': '/public/pages/dashboard/admin-dashboard.html',
                            'Tecnico': '/public/pages/dashboard/technician-dashboard.html',
                            'Asesor': '/public/pages/dashboard/adviser-dashboard.html',
                        };

                    const redirectUrl = roleRoutes[response.role] || '/public/index.html'
                    window.location.href = redirectUrl;
                    if(redirectUrl == '/public/index.html') {
                    showError('Parece que no los permisos necesarios para ingresar');
                    }
                }else {
                showError(errorMessage, response.message || 'Credencales incorrectas');
                }
            }catch(error) {
                console.error('Error en el login: ', error);
                showError(errorMessage, getErrorMessage(error));
            }finally {
                if(loginText && spinner) {
                    loginText.classList.remove('hidden');
                    spinner.classList.add('hidden');
                }
                loginForm.querySelector('button[type="submit"]').disabled = false;
            }
        });
    }
    checkExistingSession();
});

function checkExistingSession() {
    const userData = sessionStorage.getItem('userData');
    
    if (userData) {
        const user = JSON.parse(userData);
        redirectByRole(user.role);
    }
}

function showError(element, message) {
    if (!element) return;
    
    element.textContent = message;
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = 'shake 0.5s';
   
    setTimeout(() => {
        element.textContent = '';
    }, 5000);
}

function getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
        return 'No se pudo conectar con el servidor';
    }
  
    if (error.message.includes('401')) {
        return 'Credenciales incorrectas';
    }
   
    return error.message || 'Error al intentar iniciar sesión';
}

function redirectByRole(role) {
    const roleRoutes = {
        'Administrador': '/public/pages/dashboard/admin-dashboard.html',
        'Tecnico': '/public/pages/dashboard/technician-dashboard.html',
        'Asesor': '/public/pages/dashboard/adviser-dashboard.html',
    };
    
    const redirectUrl = roleRoutes[role] || '/public/index.html';
    if (redirectUrl !== '/public/index.html') {
        window.location.href = redirectUrl;
    }
}