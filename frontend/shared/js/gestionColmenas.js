document.addEventListener('DOMContentLoaded', () => {
    const btnAbrir = document.getElementById('btn-abrir-formulario');
    const btnCerrar = document.getElementById('btn-cerrar-formulario');
    const btnCancelar = document.getElementById('btn-cancelar-formulario');
    const modal = document.getElementById('modal-nueva-colmena');
    const switchMonitoreo = document.getElementById('tiene-monitoreo');
    const groupMonitoreo = document.getElementById('group-monitoreo');

    // Manejo de Modal
    const openModal = () => modal.classList.add('activo');
    const closeModal = () => {
        modal.classList.remove('activo');
        document.getElementById('form-gestionColmena').reset();
        groupMonitoreo.style.display = 'none'; // reset switch
    };

    if (btnAbrir) btnAbrir.addEventListener('click', openModal);
    if (btnCerrar) btnCerrar.addEventListener('click', closeModal);
    if (btnCancelar) btnCancelar.addEventListener('click', closeModal);

    // Cerrar clickeando afuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Toggle para ID Monitoreo
    if (switchMonitoreo) {
        switchMonitoreo.addEventListener('change', (e) => {
            if (e.target.checked) {
                groupMonitoreo.style.display = 'block';
            } else {
                groupMonitoreo.style.display = 'none';
            }
        });
    }

    const tbody = document.getElementById('tabla-colmenas-body');
    
    function cargarColmenas() {
        fetch('/api/gestion/colmenas')
            .then(res => {
                if (!res.ok) throw new Error("Error fetching");
                return res.json();
            })
            .then(datos => {
                renderizarColmenas(datos);
            })
            .catch(err => {
                console.error(err);
                if(tbody) tbody.innerHTML = '<tr><td colspan="5">Error al cargar datos</td></tr>';
            });
    }

    function renderizarColmenas(datos) {
        if (!tbody) return;
        tbody.innerHTML = '';
        
        datos.forEach(col => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            
            tr.onclick = (e) => {
                if(e.target.tagName.toLowerCase() === 'button') return;
                window.location.href = `dashboardColmena.html?id=${col.id}`;
            };

            tr.innerHTML = `
                <td><strong>${col.id}</strong></td>
                <td>${col.apiario}</td>
                <td>${col.monitoreo}</td>
                <td>${col.ecotipo}</td>
                <td>
                    <span class="dot-status ${col.estado}"></span>
                    ${col.estadoTexto}
                </td>
                <td>
                    <button class="btn-baja" data-id="${col.db_id}">Dar de baja</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-baja').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Estás seguro de que deseas eliminar esta colmena?')) {
                    fetch(`/api/gestion/colmenas/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) throw new Error('Error deleting');
                            cargarColmenas(); // Reload table
                        })
                        .catch(err => console.error(err));
                }
            });
        });
    }

    cargarColmenas();
});