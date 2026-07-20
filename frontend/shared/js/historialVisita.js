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

    function esTipoMantenimiento(visita) {
        return visita.estado_colonia === 'Mantenimiento de hardware' ||
               (visita.notas && visita.notas.startsWith('Mantenimiento del módulo:'));
    }

    function renderizarTabla(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-gray); padding: 40px;">No hay registros de visitas disponibles.</td></tr>';
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            const esMantenimiento = esTipoMantenimiento(visita);
            
            let estadoCell = '';
            let reinaCell = '';
            let notasTexto = visita.notas || '—';

            if (esMantenimiento) {
                // Extraer tipo de mantenimiento de las notas: "Mantenimiento del módulo: [TIPO] descripción"
                const match = notasTexto.match(/\[([^\]]+)\]/);
                const tipoMant = match ? match[1] : 'MANTENIMIENTO';
                // Limpiar el prefijo de las notas para mostrar solo la descripción
                notasTexto = notasTexto.replace(/^Mantenimiento del módulo: \[[^\]]+\] /, '').trim();

                estadoCell = '<td><span style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; white-space: nowrap;">' + tipoMant + '</span></td>';
                reinaCell = '<td style="color: var(--color-text-gray); font-size: 13px;">—</td>';
            } else {
                // Visita normal
                let badgeClase = '';
                const estado = visita.estado_colonia || '';
                if (estado === 'Excelente' || estado === 'Buena') badgeClase = 'excelente';
                else if (estado === 'Regular') badgeClase = 'regular';
                else if (estado === 'Crítico' || estado === 'Mala') badgeClase = 'critico';

                estadoCell = '<td><span class="badge-estado ' + badgeClase + '">' + estado + '</span></td>';
                reinaCell = '<td style="color: var(--color-text-gray);">' + (visita.reina || '—') + '</td>';
            }

            tr.innerHTML =
                '<td><span class="text-subtle">' + visita.fecha + '</span></td>' +
                '<td style="font-weight: 600; color: var(--color-primary);">' + (visita.colmena || '—') + '</td>' +
                '<td><span style="color: var(--color-text-white);">' + (visita.apicultor || '—') + '</span></td>' +
                estadoCell +
                reinaCell +
                '<td class="text-subtle" style="max-width: 300px;">' + notasTexto + '</td>';
            
            tbody.appendChild(tr);
        });
    }

    function cargarVisitas() {
        fetch('/visitas')
            .then(res => {
                if (!res.ok) throw new Error("Error fetching visitas");
                return res.json();
            })
            .then(datos => {
                renderizarTabla(datos);
            })
            .catch(err => {
                console.error(err);
                if(tbody) tbody.innerHTML = '<tr><td colspan="5">Error al cargar historial</td></tr>';
            });
    }

    cargarVisitas();
});