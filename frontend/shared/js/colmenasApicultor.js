document.addEventListener('DOMContentLoaded', () => {
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
            
            tr.onclick = () => {
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
            `;
            tbody.appendChild(tr);
        });
    }

    cargarColmenas();
});
