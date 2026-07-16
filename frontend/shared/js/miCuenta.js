document.addEventListener('DOMContentLoaded', () => {

    const toastContainer = document.getElementById('toast-container');
    const formMiCuenta = document.getElementById('form-mi-cuenta');
    
    const inputNombre = document.getElementById('input-nombre');
    const inputCorreo = document.getElementById('input-correo');
    const inputTelefono = document.getElementById('input-telefono');
    const pwdActual = document.getElementById('pwd-actual');
    const pwdNueva = document.getElementById('pwd-nueva');

    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const fileUpload = document.getElementById('file-upload');

    // Limpiar contraseñas por defecto de la maqueta
    if (pwdActual) pwdActual.value = '';
    if (pwdNueva) pwdNueva.value = '';

    // ==========================================
    // 1. CARGAR DATOS DE LA CUENTA DESDE EL BACKEND
    // ==========================================
    function cargarDatosCuenta() {
        fetch('/api/auth/mi-cuenta')
            .then(res => {
                if (!res.ok) throw new Error("No autorizado");
                return res.json();
            })
            .then(user => {
                if (inputNombre) inputNombre.value = user.nombre || '';
                if (inputCorreo) inputCorreo.value = user.email || '';
                if (inputTelefono) inputTelefono.value = user.telefono || '';
            })
            .catch(err => {
                console.error("Error al cargar perfil:", err);
                mostrarToast('error', 'Error de sesión', 'No se pudo cargar la información de la cuenta');
            });
    }

    cargarDatosCuenta();

    // ==========================================
    // 2. GESTOR DE NOTIFICACIONES (TOASTS)
    // ==========================================
    function mostrarToast(tipo, titulo, mensaje) {
        if (!toastContainer) return;
        toastContainer.innerHTML = '';

        let svgIcon = '';
        let toastClass = '';
        let iconClass = '';

        if (tipo === 'success') {
            toastClass = 'toast-success';
            iconClass = 'icon-success';
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (tipo === 'error') {
            toastClass = 'toast-error';
            iconClass = 'icon-error';
            svgIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        }

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

        setTimeout(() => {
            if(toastContainer.firstChild) {
                toastContainer.firstChild.style.opacity = '0';
                setTimeout(() => toastContainer.innerHTML = '', 300);
            }
        }, 4000);
    }

    // ==========================================
    // 3. ACTUALIZAR DATOS DE LA CUENTA
    // ==========================================
    if (formMiCuenta) {
        formMiCuenta.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = inputNombre ? inputNombre.value.trim() : '';
            const correo = inputCorreo ? inputCorreo.value.trim() : '';
            const pActual = pwdActual ? pwdActual.value : '';
            const pNueva = pwdNueva ? pwdNueva.value : '';

            if (!nombre || !correo) {
                mostrarToast('error', 'Faltan campos obligatorios', 'Completa los campos marcados para continuar');
                return;
            }

            // Si intenta cambiar la contraseña, debe ingresar ambas
            if ((pActual && !pNueva) || (!pActual && pNueva)) {
                mostrarToast('error', 'Cambio de contraseña', 'Para cambiar la contraseña debes ingresar la contraseña actual y la nueva');
                return;
            }

            if (pActual && pNueva && pActual === pNueva) {
                mostrarToast('error', 'La contraseña es la misma', 'La nueva contraseña debe ser diferente de la actual');
                return;
            }

            const payload = {
                nombre: nombre,
                email: correo,
                pwdActual: pActual,
                pwdNueva: pNueva
            };

            fetch('/api/auth/mi-cuenta', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.mensaje || "Error al actualizar los datos");
                }
                return data;
            })
            .then(data => {
                mostrarToast('success', 'Cambios guardados', 'Se actualizaron correctamente tus datos');
                // Recargar para que refresque el sidebar y la información de manera limpia
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(err => {
                console.error(err);
                mostrarToast('error', 'Error al guardar', err.message);
            });
        });
    }

    // ==========================================
    // 4. SIMULAR CAMBIO DE FOTO DE PERFIL
    // ==========================================
    if (btnCambiarFoto && fileUpload) {
        btnCambiarFoto.addEventListener('click', () => {
            fileUpload.click();
        });

        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const avatarPhoto = document.querySelector('.avatar-photo');
                    const sidebarPhoto = document.getElementById('sidebar-user-photo');
                    
                    if (avatarPhoto) avatarPhoto.src = evt.target.result;
                    if (sidebarPhoto) {
                        sidebarPhoto.src = evt.target.result;
                        sidebarPhoto.classList.add('loaded');
                    }
                    
                    mostrarToast('success', 'Foto de perfil', 'Foto cargada correctamente (Simulado)');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ==========================================
    // 5. CERRAR SESIÓN
    // ==========================================
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar tu sesión?')) {
                fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => {
                        window.location.href = '/index.html';
                    })
                    .catch(err => {
                        console.error("Error al cerrar sesión:", err);
                        window.location.href = '/index.html';
                    });
            }
        });
    }
});