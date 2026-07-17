document.addEventListener('DOMContentLoaded', () => {
    const btnAbrir = document.getElementById('btn-abrir-formulario');
    const btnCerrar = document.getElementById('btn-cerrar-formulario');
    const btnCancelar = document.getElementById('btn-cancelar-formulario');
    const modal = document.getElementById('modal-nueva-colmena');
    const switchMonitoreo = document.getElementById('tiene-monitoreo');
    const groupMonitoreo = document.getElementById('group-monitoreo');

    // Manejo de Modal
    let currentEditId = null;

    const openModal = () => {
        currentEditId = null;
        document.querySelector("#modal-nueva-colmena h2").innerText = "Nueva Colmena";
        modal.classList.add('activo');
        document.getElementById('form-gestionColmena').reset();
        groupMonitoreo.style.display = 'none';
    };

    const closeModal = () => {
        modal.classList.remove('activo');
        document.getElementById('form-gestionColmena').reset();
        groupMonitoreo.style.display = 'none';
        currentEditId = null;
    };

    window.editarColmena = function(event, id, codigo, ecotipo, apiarioId, estado) {
        event.preventDefault();
        event.stopPropagation();
        
        currentEditId = id;
        document.querySelector("#modal-nueva-colmena h2").innerText = "Editar Colmena";
        
        document.getElementById("codigo-Col").value = codigo;
        document.getElementById("ecotipo").value = ecotipo || "Apis mellifera";
        document.getElementById("apiarioSelect").value = apiarioId || "";
        document.getElementById("estados").value = estado || "activa";
        
        modal.classList.add("activo");
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
            groupMonitoreo.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Populate Apiarios Dropdown
    function cargarApiariosSelect() {
        fetch('/api/gestion/apiarios')
            .then(res => res.json())
            .then(data => {
                const select = document.getElementById("apiarioSelect");
                select.innerHTML = '<option value="">Selecciona un apiario...</option>';
                data.forEach(api => {
                    select.innerHTML += `<option value="${api.id}">${api.nombre}</option>`;
                });
            })
            .catch(err => console.error("Error cargando apiarios", err));
    }
    cargarApiariosSelect();

    // Handle Form Submit
    document.getElementById('form-gestionColmena').addEventListener("submit", (e) => {
        e.preventDefault();
        
        const payload = {
            apiario_id: document.getElementById("apiarioSelect").value,
            codigo: document.getElementById("codigo-Col").value,
            ecotipo: document.getElementById("ecotipo").value,
            estado: document.getElementById("estados").value
        };

        const url = currentEditId ? `/api/gestion/colmenas/${currentEditId}` : "/api/gestion/colmenas";
        const method = currentEditId ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if(res.ok) return res.json();
            throw new Error(currentEditId ? "No se pudo actualizar la colmena." : "No se pudo crear la colmena. Verifica que el código no esté duplicado.");
        })
        .then(() => {
            closeModal();
            cargarColmenas();
            showSuccessToast("¡Éxito!", currentEditId ? "Colmena actualizada correctamente." : "Colmena creada correctamente.");
        })
        .catch(err => {
            showErrorToast("Error de Formulario", err.message);
        });
    });

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
                    <button class="btn-primary" onclick="editarColmena(event, ${col.db_id}, '${col.id}', '${col.ecotipo}', ${col.apiario_id}, '${col.estadoRaw}')" style="margin-right: 8px;">Editar</button>
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