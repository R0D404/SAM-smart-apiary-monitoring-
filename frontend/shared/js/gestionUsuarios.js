document.addEventListener('DOMContentLoaded', () => {
    


    // ==========================================
    // 1.5 LÓGICA DEL MODAL (CREAR APICULTOR)
    // ==========================================
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarCrear = document.getElementById('btn-cerrar-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    const modalCrear = document.getElementById('modal-crear-apicultor');

    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            modalCrear.classList.add('active');
        });
    }

    function cerrarModalCrear() {
        modalCrear.classList.remove('active');
    }

    if (btnCerrarCrear) btnCerrarCrear.addEventListener('click', cerrarModalCrear);
    if (btnCancelarCrear) btnCancelarCrear.addEventListener('click', cerrarModalCrear);

    // Cargar checkboxes de apiarios dinámicamente
    function cargarApiariosCheckboxes() {
        fetch('/api/gestion/apiarios')
            .then(res => res.json())
            .then(apiarios => {
                const container = document.getElementById('lista-apiarios-checkboxes');
                if (!container) return;
                container.innerHTML = '';
                
                apiarios.forEach(ap => {
                    const label = document.createElement('label');
                    label.className = 'checkbox-card';
                    label.innerHTML = `
                        <input type="checkbox" name="crear_apiarios" value="${ap.id}">
                        ${ap.nombre}
                        <span class="card-meta">${ap.municipio} · ${ap.colmenas} colmenas</span>
                    `;
                    container.appendChild(label);

                    const checkbox = label.querySelector('input');
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            label.classList.add('active');
                        } else {
                            label.classList.remove('active');
                        }
                    });
                });
            })
            .catch(console.error);
    }
    
    cargarApiariosCheckboxes();




    // ==========================================
    // 2. LÓGICA DE LA TABLA (USUARIOS)
    // ==========================================
    const tbody = document.getElementById('tabla-usuarios-body');
    
    function cargarUsuarios() {
        fetch('/api/gestion/usuarios')
            .then(res => {
                if (!res.ok) throw new Error("Error fetching usuarios");
                return res.json();
            })
            .then(usuarios => {
                renderizarUsuarios(usuarios);
            })
            .catch(err => {
                console.error(err);
                if(tbody) tbody.innerHTML = '<tr><td colspan="4">Error al cargar usuarios</td></tr>';
            });
    }

    function renderizarUsuarios(usuarios) {
        if (!tbody) return;
        tbody.innerHTML = '';
        
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            // Generate initials for avatar (e.g., "Emmanuel U." -> "EU")
            const parts = user.nombre.split(' ');
            let initials = parts[0].charAt(0).toUpperCase();
            if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();

            // Avatar color based on role or id
            let avatarColor = '#F2A900'; // Default admin
            if (user.rol.toLowerCase() === 'apicultor') {
                const colors = ['#4CAF50', '#8BC34A', '#CDDC39'];
                avatarColor = colors[user.id % colors.length];
            }

            const estadoDot = user.activo ? 'green' : 'red';
            const estadoText = user.activo ? 'Activo' : 'Inactivo';
            const apisAsignados = user.apiariosAsignados;
            
            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <span style="font-weight: 600; color: var(--color-text-white);">${user.nombre}</span>
                    </div>
                </td>
                <td><span style="color: var(--color-text-gray);">${user.rol}</span></td>
                <td><span style="color: var(--color-text-white);">${apisAsignados}</span></td>
                <td>
                    <span class="dot-status ${estadoDot}" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
                    <span style="color: var(--color-text-gray);">${estadoText}</span>
                </td>
                <td>
                    <button class="btn-primary btn-editar" style="margin-right: 8px;" data-id="${user.id}">Editar</button>
                    ${user.id !== 1 ? `<button class="btn-baja btn-eliminar" data-id="${user.id}">Dar de baja</button>` : ''}
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Asignar eventos a los botones de editar y eliminar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.getAttribute('data-id'));
                const user = usuarios.find(u => u.id === userId);
                if (user) abrirModalEditar(user);
            });
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.getAttribute('data-id'));
                if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
                    eliminarUsuario(userId);
                }
            });
        });
    }

    // Modal de edición
    const modalEditar = document.getElementById('modal-editar-usuario');
    const btnCerrarEditar = document.getElementById('btn-cerrar-editar');
    const btnCancelarEditar = document.getElementById('btn-cancelar-editar');

    function abrirModalEditar(user) {
        document.getElementById('editar-id').value = user.id;
        document.getElementById('editar-nombre').value = user.nombre;
        document.getElementById('editar-email').value = user.email || '';
        document.getElementById('editar-rol').value = user.rol.toLowerCase() === 'admin' ? '1' : '2';
        document.getElementById('editar-estado').value = user.activo ? 'true' : 'false';
        modalEditar.classList.add('active');
    }

    function cerrarModalEditar() {
        modalEditar.classList.remove('active');
    }

    if (btnCerrarEditar) btnCerrarEditar.addEventListener('click', cerrarModalEditar);
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', cerrarModalEditar);
    
    window.addEventListener('click', (e) => {
        if (e.target === modalEditar) {
            cerrarModalEditar();
        }
    });

    const formEditar = document.getElementById('form-editar-usuario');
    if (formEditar) {
        formEditar.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editar-id').value;
            const payload = {
                nombre: document.getElementById('editar-nombre').value,
                email: document.getElementById('editar-email').value,
                rol_id: parseInt(document.getElementById('editar-rol').value),
                activo: document.getElementById('editar-estado').value === 'true'
            };
            
            fetch(`/api/gestion/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("No se pudo actualizar el usuario.");
            })
            .then(() => {
                cerrarModalEditar();
                cargarUsuarios();
                showSuccessToast("¡Éxito!", "Usuario actualizado con éxito.");
            })
            .catch(err => {
                showErrorToast("Error", err.message);
            });
        });
    }

    function eliminarUsuario(id) {
        fetch(`/api/gestion/usuarios/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("No se pudo eliminar el usuario.");
        })
        .then(() => {
            cargarUsuarios();
            showSuccessToast("¡Éxito!", "Usuario eliminado con éxito.");
        })
        .catch(err => {
            showErrorToast("Error", err.message);
        });
    }

    // Form submissions
    const formCrear = document.getElementById('form-crear-apicultor');
    if (formCrear) {
        formCrear.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const selectedApiarios = Array.from(document.querySelectorAll('input[name="crear_apiarios"]:checked'))
                .map(cb => parseInt(cb.value));

            const payload = {
                nombre: document.getElementById('crear-nombre').value,
                email: document.getElementById('crear-email').value,
                password: document.getElementById('crear-password').value,
                rol_id: 2, // Apicultor
                apiarios: selectedApiarios
            };
            
            fetch('/api/gestion/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("No se pudo crear la cuenta de apicultor. Verifica si el correo ya está registrado.");
            })
            .then(() => {
                cerrarModalCrear();
                cargarUsuarios();
                showSuccessToast("¡Éxito!", "Cuenta de apicultor creada con éxito.");
            })
            .catch(err => {
                showErrorToast("Error de Formulario", err.message);
            });
        });
    }



    cargarUsuarios();
});