document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tabla-alertas-body');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Filtros interactivos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Aquí en un futuro se filtrarán los datos o se hará el fetch con filtros
        });
    });

    function renderizarTablaAlertas(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--color-text-gray); padding: 40px;">
                        No hay alertas registradas en este momento.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(alerta => {
            const tr = document.createElement('tr');
            
            let dotClass = '';
            let textClass = '';
            let badgeClass = '';
            let actionHtml = '';
            
            if (alerta.nivel === 'critica') {
                dotClass = 'rojo';
                badgeClass = 'critico';
                textClass = 'text-red';
                actionHtml = `<button class="btn-atender">Atender</button>`;
            } else if (alerta.nivel === 'aviso') {
                dotClass = 'amarillo';
                badgeClass = 'aviso';
                textClass = 'text-yellow';
                actionHtml = `<button class="btn-atender">Atender</button>`;
            } else if (alerta.nivel === 'atendida') {
                dotClass = 'verde';
                badgeClass = '';
                textClass = 'text-green';
                actionHtml = `<span style="color: var(--color-text-gray); font-size: 12px;">Resuelto</span>`;
            }

            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; font-weight: 600;">
                        <span class="dot-status ${dotClass}"></span>
                        ${alerta.colmena}
                    </div>
                </td>
                <td style="color: var(--color-text-white);">${alerta.mensaje}</td>
                <td><span style="color: var(--color-text-gray); font-size: 13px;">${alerta.nivel}</span></td>
                <td><span style="color: var(--color-text-gray); font-size: 13px;">${alerta.tiempo}</span></td>
                <td>
                    ${actionHtml}
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    function cargarAlertas() {
        fetch('/api/alertas')
            .then(res => {
                if (!res.ok) throw new Error("Error fetching alertas");
                return res.json();
            })
            .then(datos => {
                renderizarTablaAlertas(datos);
            })
            .catch(err => {
                console.error(err);
                if(tbody) tbody.innerHTML = '<tr><td colspan="5">Error al cargar alertas</td></tr>';
            });
    }

    cargarAlertas();
});