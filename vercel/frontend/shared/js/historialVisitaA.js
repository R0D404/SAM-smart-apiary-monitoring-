document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tabla-visitas-body');

    function renderizarTabla(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #8A7A5A; padding: 40px; font-size: 14px;">
                        No tienes registros de visitas aún.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            
            const claseReina = visita.reina === 'No vista' ? 'text-muted' : '';
            const reinaTexto = visita.reina || 'Sí';
            const estadoTexto = visita.estado_colonia || visita.estado || 'Saludable';
            const apicultorTexto = visita.apicultor || 'Rodrigo G.';
            const colmenaTexto = visita.colmena || '--';
            const notasTexto = visita.notas || 'Sin observaciones';

            tr.innerHTML = `
                <td>${visita.fecha}</td>
                <td class="text-colmena">${colmenaTexto}</td>
                <td>${apicultorTexto}</td>
                <td>${estadoTexto}</td>
                <td class="${claseReina}">${reinaTexto}</td>
                <td class="text-muted">${notasTexto}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    // Cargar historial de visitas desde el servidor
    fetch("/visitas")
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener visitas");
            return response.json();
        })
        .then(data => {
            renderizarTabla(data);
        })
        .catch(error => {
            console.error("No se pudo cargar el historial de visitas:", error);
            // Renderizar tabla vacía indicando que el servidor está desconectado
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 40px; font-size: 14px;">
                        Error al cargar visitas: Servidor local desconectado.
                    </td>
                </tr>
            `;
        });

    // ==========================================
    // LÓGICA DE BOTONES Y FILTROS
    // ==========================================
    const btnRegistrar = document.querySelector('.btn-primary');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', () => {
            window.location.href = "registrarVisita.html";
        });
    }

    const btnCosechas = document.querySelector('.btn-outline-dark');
    if (btnCosechas) {
        btnCosechas.addEventListener('click', () => {
            window.location.href = "historialCosechas.html";
        });
    }

    const btnFiltros = document.querySelectorAll('.filter-btn');
    btnFiltros.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btnFiltros.forEach(b => b.classList.remove('active', 'outline'));
            btnFiltros.forEach(b => b.classList.add('outline'));
            e.target.classList.remove('outline');
            e.target.classList.add('active');
        });
    });
});