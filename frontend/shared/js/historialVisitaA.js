document.addEventListener('DOMContentLoaded', () => {
    
    const tbody = document.getElementById('tabla-visitas-body');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Filtros interactivos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    function renderizarTabla(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #797165; padding: 40px;">
                        No tienes registros de visitas aún.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            
            // Atenuar texto de la reina si no fue vista
            const claseReina = visita.reina === 'No vista' ? 'text-muted' : '';
            
            // Badge de estado de colonia
            let badgeClase = 'text-muted';
            const estadoLower = (visita.estado_colonia || '').toLowerCase();
            if (estadoLower.includes('excelente') || estadoLower.includes('fuerte') || estadoLower.includes('saludable')) {
                badgeClase = 'badge-verde';
            } else if (estadoLower.includes('regular') || estadoLower.includes('moderada')) {
                badgeClase = 'badge-amarillo';
            } else if (estadoLower.includes('débil') || estadoLower.includes('critico') || estadoLower.includes('mala')) {
                badgeClase = 'badge-rojo';
            }

            tr.innerHTML = `
                <td>${visita.fecha}</td>
                <td class="text-colmena">${visita.colmena}</td>
                <td>${visita.apicultor}</td>
                <td><span class="badge-estado ${badgeClase}">${visita.estado_colonia || 'N/A'}</span></td>
                <td class="${claseReina}">${visita.reina}</td>
                <td class="text-muted">${visita.notas}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    function cargarVisitas() {
        fetch('/api/visitas')
            .then(res => {
                if (!res.ok) throw new Error("Error fetching visitas");
                return res.json();
            })
            .then(datos => {
                renderizarTabla(datos);
            })
            .catch(err => {
                console.error(err);
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#797165;">Error al cargar el historial de visitas.</td></tr>';
            });
    }

    cargarVisitas();

    // Botón registrar visita
    const btnRegistrar = document.querySelector('.btn-primary');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', () => {
            window.location.href = 'registrarVisita.html';
        });
    }
});