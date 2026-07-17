document.addEventListener('DOMContentLoaded', () => {

    const toastContainer = document.getElementById('toast-container');
    const formMiCuenta = document.getElementById('form-mi-cuenta');
    
    // Inputs para validación simulada
    const inputNombre = document.getElementById('input-nombre');
    const inputCorreo = document.getElementById('input-correo');
    const pwdActual = document.getElementById('pwd-actual');
    const pwdNueva = document.getElementById('pwd-nueva');

    // Botón de cambiar foto
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const fileUpload = document.getElementById('file-upload');

    // ==========================================
    // 1. GESTOR DE NOTIFICACIONES (TOASTS)
    // ==========================================
    function mostrarToast(tipo, titulo, mensaje) {
        // Limpiamos notificaciones anteriores
        toastContainer.innerHTML = '';

        // Configuramos iconos y clases según el tipo
        let svgIcon = '';
        let toastClass = '';
        let iconClass = '';

        if (tipo === 'success') {
            toastClass = 'toast-success';
            iconClass = 'icon-success';
            // Icono de Check
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (tipo === 'error') {
            toastClass = 'toast-error';
            iconClass = 'icon-error';
            // Icono de Exclamación
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        }

        // Estructura HTML del Toast
        const toastHTML = `
            <div class="toast ${toastClass}">
                <div class="toast-icon ${iconClass}">
                    ${svgIcon}
                </div>
                <div class="toast-content">
                    <span class="toast-title">${titulo}</span>
                    <span class="toast-message">${mensaje}</span>
                </div>
            </div>
        `;

        toastContainer.innerHTML = toastHTML;
        
        // Scroll to top to ensure the user sees the notification
        window.scrollTo({top: 0, behavior: 'smooth'});

        // Opcional: Ocultar el toast después de 4 segundos
        setTimeout(() => {
            if(toastContainer.firstElementChild) {
                toastContainer.firstElementChild.style.opacity = '0';
                setTimeout(() => toastContainer.innerHTML = '', 300);
            }
        }, 4000);
    }

    // ==========================================
    // 2. LÓGICA DEL FORMULARIO Y VALIDACIONES
    // ==========================================
    formMiCuenta.addEventListener('submit', (e) => {
        e.preventDefault(); // Evitamos recargar la página

        const nombre = inputNombre.value.trim();
        const correo = inputCorreo.value.trim();
        const pActual = pwdActual.value;
        const pNueva = pwdNueva.value;

        // Caso 1: Faltan campos (Simulando error 15 · Mi cuenta-1.png)
        if (!nombre || !correo || !pActual || !pNueva) {
            mostrarToast('error', 'Faltan campos obligatorios', 'Completa los campos marcados para continuar');
            return;
        }

        // Caso 2: Contraseña incorrecta simulada o Igual a la anterior (Simulando 15 · Mi cuenta-4.png / 5.png)
        // (En tu app real esto lo validará Javalin, aquí es solo frontend)
        if (pActual === pNueva) {
            mostrarToast('error', 'La contraseña es la misma', 'Las contraseñas deben ser diferentes');
            return;
        }

        if (pActual === "error") { // Solo un ejemplo para disparar el otro error
            mostrarToast('error', 'Contraseña incorrecta', 'Ingrese la contraseña correcta');
            return;
        }

        // Caso Éxito: Todo bien (Simulando 15 · Mi cuenta.png)
        mostrarToast('success', 'Cambios guardados', 'Se actualizaron correctamente sus datos');
        
        // Aquí iría tu fetch al servidor
    });

    // ==========================================
    // 3. SIMULAR CAMBIO DE FOTO DE PERFIL (OPCIONAL)
    // ==========================================
    if (btnCambiarFoto) {
        btnCambiarFoto.addEventListener('click', () => {
            if (fileUpload) fileUpload.click();
        });
    }

    if (fileUpload) {
        fileUpload.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                mostrarToast('success', 'Foto de perfil actualizada', 'La fotografía de perfil ha sido actualizada exitosamente');
            }
        });
    }

    // ==========================================
    // 4. CARGAR PERFIL DINÁMICO DESDE EL SERVIDOR
    // ==========================================
    const summaryAvatar = document.getElementById('summary-avatar');
    const summaryName = document.getElementById('summary-name');
    const summaryEmail = document.getElementById('summary-email');

    fetch('/api/dashboard')
        .then(res => {
            if (!res.ok) throw new Error("No hay sesión activa");
            return res.json();
        })
        .then(data => {
            if (data.usuario) {
                const u = data.usuario;
                if (inputNombre) inputNombre.value = u.nombre || '';
                if (inputCorreo) inputCorreo.value = u.email || 'rodrigo@sam.com';

                if (summaryName) summaryName.textContent = u.nombre || '---';
                if (summaryEmail) summaryEmail.textContent = u.email || '---';

                if (summaryAvatar && u.nombre) {
                    const iniciales = u.nombre
                        .split(" ")
                        .filter(p => p.length > 0)
                        .map(p => p[0].toUpperCase())
                        .slice(0, 2)
                        .join("");
                    summaryAvatar.textContent = iniciales;
                }
            }
        })
        .catch(err => {
            console.warn("No se pudo cargar el perfil del usuario (servidor apagado):", err);
            
            // MOCK DATA PARA VERCEL
            let mockUser = {
                nombre: "Administrador SAM",
                email: "admin@sam.com"
            };
            if (window.location.pathname.includes('/apicultor/')) {
                mockUser = {
                    nombre: "Apicultor Invitado",
                    email: "apicultor@sam.com"
                };
            }

            if (inputNombre) inputNombre.value = mockUser.nombre;
            if (inputCorreo) inputCorreo.value = mockUser.email;
            
            if (summaryName) summaryName.textContent = mockUser.nombre;
            if (summaryEmail) summaryEmail.textContent = mockUser.email;
            
            if (summaryAvatar) {
                const iniciales = mockUser.nombre
                    .split(" ")
                    .filter(p => p.length > 0)
                    .map(p => p[0].toUpperCase())
                    .slice(0, 2)
                    .join("");
                summaryAvatar.textContent = iniciales;
            }
        });

});