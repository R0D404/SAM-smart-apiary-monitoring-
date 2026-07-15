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
                    <td colspan="6" style="text-align: center; color: var(--color-text-gray); padding: 40px;">
                        No hay registros de visitas disponibles.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            
            // Clase para la reina (si no fue vista)
            const claseReina = visita.reina === 'No vista' ? 'text-subtle' : '';
            
            // Etiqueta visual para el estado de la colonia
            let badgeClase = '';
            if (visita.estado_colonia === 'Excelente' || visita.estado_colonia === 'Buena') {
                badgeClase = 'excelente';
            } else if (visita.estado_colonia === 'Regular') {
                badgeClase = 'regular';
            } else if (visita.estado_colonia === 'Crítico' || visita.estado_colonia === 'Mala') {
                badgeClase = 'critico';
            }

            tr.innerHTML = `
                <td><span class="text-subtle">${visita.fecha}</span></td>
                <td style="font-weight: 600; color: var(--color-primary);">${visita.colmena}</td>
                <td><span style="color: var(--color-text-white);">${visita.apicultor}</span></td>
                <td><span class="badge-estado ${badgeClase}">${visita.estado_colonia}</span></td>
                <td class="${claseReina}">${visita.reina}</td>
                <td class="text-subtle">${visita.notas}</td>
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
                if(tbody) tbody.innerHTML = '<tr><td colspan="6">Error al cargar historial</td></tr>';
            });
    }

    cargarVisitas();
});