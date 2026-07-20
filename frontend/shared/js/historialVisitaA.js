document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tabla-visitas-body');

    function esTipoMantenimiento(visita) {
        return visita.estado_colonia === 'Mantenimiento de hardware' ||
               (visita.notas && visita.notas.startsWith('Mantenimiento del módulo:'));
    }

    function renderizarTabla(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #8A7A5A; padding: 40px; font-size: 14px;">No tienes registros de visitas aún.</td></tr>';
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            const esMantenimiento = esTipoMantenimiento(visita);
            
            let estadoCell = '';
            let reinaCell = '';
            let notasTexto = visita.notas || '—';
            const colmenaTexto = visita.colmena || '--';
            const apicultorTexto = visita.apicultor || 'Desconocido';

            if (esMantenimiento) {
                const match = notasTexto.match(/\[([^\]]+)\]/);
                const tipoMant = match ? match[1] : 'MANTENIMIENTO';
                notasTexto = notasTexto.replace(/^Mantenimiento del módulo: \[[^\]]+\] /, '').trim();

                estadoCell = '<td><span style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; white-space: nowrap;">' + tipoMant + '</span></td>';
                reinaCell = '<td style="color: var(--color-text-gray); font-size: 13px;">—</td>';
            } else {
                const reinaTexto = visita.reina || 'Sí';
                const estadoTexto = visita.estado_colonia || visita.estado || 'Saludable';
                estadoCell = '<td>' + estadoTexto + '</td>';
                reinaCell = '<td>' + reinaTexto + '</td>';
            }

            tr.innerHTML =
                '<td>' + visita.fecha + '</td>' +
                '<td class="text-colmena">' + colmenaTexto + '</td>' +
                '<td>' + apicultorTexto + '</td>' +
                estadoCell +
                reinaCell +
                '<td class="text-muted" style="max-width: 280px;">' + notasTexto + '</td>';
            
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
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 40px; font-size: 14px;">Error al cargar visitas: Servidor local desconectado.</td></tr>';
        });
});