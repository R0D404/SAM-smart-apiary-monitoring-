document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("apiarios-tbody");
    const btnNuevo = document.getElementById("btn-nuevo-apiario");
    const modal = document.getElementById("modal-nuevo");
    const btnCerrar = document.getElementById("btn-cerrar-modal");
    const formNuevo = document.getElementById("form-nuevo-apiario");
    const selectMicroclima = document.getElementById("api-microclima");

    // Fetch apiarios and populate table
    function cargarApiarios() {
        fetch("/api/gestion/apiarios")
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = "";
                if (!data || data.length === 0) {
                    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay apiarios registrados</td></tr>";
                    return;
                }
                data.forEach(api => {
                    const tr = document.createElement("tr");
                    tr.className = "clickable-row";
                    tr.onclick = (e) => {
                        // Avoid navigating if they click the "Dar de baja" button
                        if (e.target.closest('button')) return;
                        window.location.href = `dashboardApiario.html?id=${api.id}`;
                    };

                    tr.innerHTML = `
                        <td><span style="font-weight: 600; color: var(--color-primary);">${api.nombre}</span></td>
                        <td>
                            <div style="display: flex; align-items: center; font-weight: 500; color: var(--color-text-white);">
                                <span class="dot-status" style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-alert-green); display: inline-block; margin-right: 8px;"></span>
                                ${api.localidad}, ${api.municipio}, <span style="color: var(--color-text-gray); margin-left: 4px;">${api.estado}</span>
                            </div>
                        </td>
                        <td><span style="color: var(--color-text-white); font-weight: 600;">${api.colmenas}</span> <span style="color: var(--color-text-gray); font-size: 13px;">colmenas</span></td>
                        <td><span style="color: var(--color-text-gray); text-transform: capitalize;">${api.microclima}</span></td>
                        <td>
                            <button class="btn-primary" onclick="editarApiario(event, ${api.id}, '${api.nombre}', '${api.estado}', '${api.municipio}', '${api.localidad}', ${api.microclima_id || 1})" style="margin-right: 8px;">Editar</button>
                            <button class="btn-baja" onclick="darDeBaja(event, ${api.id}, '${api.nombre}')">Dar de baja</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => console.error("Error al cargar apiarios:", err));
    }

    // Load microclimates for the select (CUSTOM DROPDOWN)
    const dropdownMicroclima = document.getElementById("dropdown-microclima");
    const selectedDisplay = dropdownMicroclima.querySelector(".dropdown-selected");
    const optionsList = document.getElementById("api-microclima-list");
    const hiddenInput = document.getElementById("api-microclima");

    // Toggle dropdown
    selectedDisplay.addEventListener("click", () => {
        dropdownMicroclima.classList.toggle("active");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (!dropdownMicroclima.contains(e.target)) {
            dropdownMicroclima.classList.remove("active");
        }
    });

    function cargarMicroclimas() {
        fetch("/api/gestion/microclimas")
            .then(res => res.json())
            .then(data => {
                optionsList.innerHTML = "";
                data.forEach(m => {
                    const li = document.createElement("li");
                    li.dataset.value = m.id;
                    li.textContent = m.nombre;
                    
                    li.addEventListener("click", () => {
                        hiddenInput.value = m.id;
                        selectedDisplay.textContent = m.nombre;
                        dropdownMicroclima.classList.remove("active");
                    });

                    optionsList.appendChild(li);
                });
            })
            .catch(err => {
                console.error("Error al cargar microclimas:", err);
                optionsList.innerHTML = '<li data-value="">Error al cargar</li>';
            });
    }

    // Modal Logic
    let currentEditId = null;

    btnNuevo.addEventListener("click", () => {
        currentEditId = null;
        document.querySelector("#modal-nuevo h2").innerText = "Nuevo apiario";
        modal.classList.remove("hidden");
        formNuevo.reset();
    });

    btnCerrar.addEventListener("click", () => {
        modal.classList.add("hidden");
        formNuevo.reset();
        currentEditId = null;
    });

    window.editarApiario = function(event, id, nombre, estado, municipio, localidad, microclimaId) {
        event.preventDefault();
        event.stopPropagation();
        
        currentEditId = id;
        document.querySelector("#modal-nuevo h2").innerText = "Editar apiario";
        
        document.getElementById("api-nombre").value = nombre;
        document.getElementById("api-estado").value = estado;
        document.getElementById("api-municipio").value = municipio;
        document.getElementById("api-localidad").value = localidad;
        
        // Setup hidden input and visually update dropdown
        document.getElementById("api-microclima").value = microclimaId;
        document.querySelector("#dropdown-microclima .dropdown-selected").innerText = "Microclima ID: " + microclimaId;
        
        modal.classList.remove("hidden");
    };

    // Form Submit (Create or Update Apiario)
    formNuevo.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: document.getElementById("api-nombre").value,
            estado: document.getElementById("api-estado").value,
            municipio: document.getElementById("api-municipio").value,
            localidad: document.getElementById("api-localidad").value,
            microclimaId: document.getElementById("api-microclima").value
        };

        const url = currentEditId ? `/api/gestion/apiarios/${currentEditId}` : "/api/gestion/apiarios";
        const method = currentEditId ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if(res.ok) return res.json();
            throw new Error(currentEditId ? "No se pudo actualizar el apiario." : "No se pudo crear el apiario. Verifica los campos.");
        })
        .then(() => {
            modal.classList.add("hidden");
            formNuevo.reset();
            currentEditId = null;
            cargarApiarios();
            showSuccessToast("¡Éxito!", currentEditId ? "Apiario actualizado correctamente." : "Apiario creado correctamente.");
        })
        .catch(err => {
            showErrorToast("Error de Formulario", err.message);
        });
    });

    // Initialize
    cargarApiarios();
    cargarMicroclimas();
});

// Delete Apiario
window.darDeBaja = function(event, id, nombre) {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de dar de baja el apiario "${nombre}"? Esta acción no se puede deshacer y borrará todas sus colmenas asociadas.`)) {
        fetch(`/api/gestion/apiarios/${id}`, {
            method: "DELETE"
        })
        .then(res => {
            if(res.ok) {
                // reload table
                location.reload();
            } else {
                throw new Error("No se pudo dar de baja el apiario. Por favor reintente.");
            }
        })
        .catch(err => {
            showErrorToast("Error al dar de baja", err.message);
        });
    }
};
