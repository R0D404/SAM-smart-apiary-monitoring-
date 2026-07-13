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
                        <td class="api-nombre">${api.nombre}</td>
                        <td>
                            <div class="api-estado">
                                <span class="dot-status"></span>
                                ${api.localidad}, ${api.municipio}, ${api.estado}
                            </div>
                        </td>
                        <td>${api.colmenas}</td>
                        <td>${api.microclima}</td>
                        <td>
                            <button class="btn-baja" onclick="darDeBaja(event, ${api.id}, '${api.nombre}')">Dar de baja</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => console.error("Error al cargar apiarios:", err));
    }

    // Load microclimates for the select
    function cargarMicroclimas() {
        fetch("/api/gestion/microclimas")
            .then(res => res.json())
            .then(data => {
                selectMicroclima.innerHTML = "";
                data.forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = m.id;
                    opt.textContent = m.nombre;
                    selectMicroclima.appendChild(opt);
                });
            })
            .catch(err => console.error("Error al cargar microclimas:", err));
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
