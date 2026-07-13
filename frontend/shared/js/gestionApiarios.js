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
    btnNuevo.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    btnCerrar.addEventListener("click", () => {
        modal.classList.add("hidden");
        formNuevo.reset();
    });

    // Form Submit (Create Apiario)
    formNuevo.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: document.getElementById("api-nombre").value,
            estado: document.getElementById("api-estado").value,
            municipio: document.getElementById("api-municipio").value,
            localidad: document.getElementById("api-localidad").value,
            microclimaId: document.getElementById("api-microclima").value
        };

        fetch("/api/gestion/apiarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if(res.ok) return res.json();
            throw new Error("Error al crear apiario");
        })
        .then(() => {
            modal.classList.add("hidden");
            formNuevo.reset();
            cargarApiarios();
        })
        .catch(err => alert(err.message));
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
                throw new Error("Error al eliminar");
            }
        })
        .catch(err => alert(err.message));
    }
};
