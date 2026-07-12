document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. LÓGICA DEL MODAL (FORMULARIO ASIGNACIÓN)
    // ==========================================
    const btnAbrir = document.getElementById('btn-abrir-formulario');
    const btnCerrar = document.getElementById('btn-cerrar-formulario');
    const btnCancelar = document.getElementById('btn-cancelar-formulario');
    const modal = document.getElementById('input-form');

    // Abrir modal al darle clic al botón amarillo
    btnAbrir.addEventListener('click', () => {
        modal.classList.add('activo');
    });

    // Función genérica para cerrar
    function cerrarModal() {
        modal.classList.remove('activo');
    }

    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);

    // Cerrar si se da clic en la parte oscura (fuera del formulario)
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // ==========================================
    // 2. LÓGICA DE LA TABLA
    // ==========================================
    const tbody = document.getElementById('tabla-usuarios-body');

    function renderizarTablaUsuarios(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #8A7A5A;">
                        No hay usuarios registrados.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(usuario => {
            const tr = document.createElement('tr');
            
            const avatarClass = usuario.rol === 'Administrador' ? 'bg-yellow' : 'bg-teal';
            const dotClass = usuario.estado === 'Activo' ? 'dot-active' : 'dot-inactive';
            const textStateClass = usuario.estado === 'Activo' ? 'text-active' : 'text-inactive';
            const apiariosText = usuario.apiarios || '— sin asignar';

            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="avatar ${avatarClass}"></div>
                        <div class="user-details">
                            <span class="user-name">${usuario.nombre}</span>
                        </div>
                    </div>
                </td>
                <td style="color: #8A7A5A; font-size: 13px;">${usuario.rol}</td>
                <td style="${!usuario.apiarios ? 'color: #8A7A5A;' : 'color: #F5F5F5;'}">${apiariosText}</td>
                <td>
                    <div class="status-cell">
                        <span class="dot ${dotClass}"></span>
                        <span class="${textStateClass}">${usuario.estado}</span>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // 3. LÓGICA VISUAL DE LOS CHECKBOXES (Tarjetas)
    // ==========================================
    const checkboxCards = document.querySelectorAll('.checkbox-card');

    checkboxCards.forEach(card => {
        const input = card.querySelector('input[type="checkbox"]');
        
        card.addEventListener('click', (e) => {
            if (e.target !== input) {
                input.checked = !input.checked;
            }
            if (input.checked) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    });

    /* 
    ========================================================================
    PLANTILLA DE DATOS PARA PROBAR 
    ========================================================================
    */
    /*
    const usuariosMock = [
        { nombre: 'Emmanuel Urbina', rol: 'Administrador', apiarios: 'Todos', estado: 'Activo' },
        { nombre: 'Rodrigo González', rol: 'Apicultor', apiarios: 'Apiario Norte', estado: 'Activo' },
        { nombre: 'Edgar Solís', rol: 'Apicultor', apiarios: 'Apiario Sur, Río', estado: 'Activo' },
        { nombre: 'Ivanna López', rol: 'Apicultor', apiarios: 'Apiario Norte', estado: 'Activo' },
        { nombre: 'José Martínez', rol: 'Apicultor', apiarios: null, estado: 'Inactivo' }
    ];
    renderizarTablaUsuarios(usuariosMock);
    */

});