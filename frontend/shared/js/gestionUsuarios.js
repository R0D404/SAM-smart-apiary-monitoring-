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
            `;
            
            tbody.appendChild(tr);
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