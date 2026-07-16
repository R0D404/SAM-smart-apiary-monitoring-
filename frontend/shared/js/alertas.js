document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tabla-alertas-body');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let todasLasAlertasYEstados = [];
    let filtroActivo = 'Todas';

    // Filtros interactivos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActivo = btn.textContent.trim();
            aplicarFiltro();
        });
    });

    function aplicarFiltro() {
        let alertasFiltradas = todasLasAlertasYEstados;
        if (filtroActivo === 'Críticas') {
            alertasFiltradas = todasLasAlertasYEstados.filter(a => a.nivel === 'critica');
        } else if (filtroActivo === 'Avisos') {
            alertasFiltradas = todasLasAlertasYEstados.filter(a => a.nivel === 'aviso');
        } else if (filtroActivo === 'Normales') {
            alertasFiltradas = todasLasAlertasYEstados.filter(a => a.nivel === 'normal');
        } else if (filtroActivo === 'Atendidas') {
            alertasFiltradas = todasLasAlertasYEstados.filter(a => a.nivel === 'atendida');
        }
        renderizarTablaAlertas(alertasFiltradas);
    }

    function renderizarTablaAlertas(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--color-text-gray); padding: 40px;">
                        No hay registros para este filtro en este momento.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(alerta => {
            const tr = document.createElement('tr');
            
            let dotClass = '';
            let textClass = '';
            let actionHtml = '';
            
            if (alerta.nivel === 'critica') {
                dotClass = 'rojo';
                textClass = 'text-red';
                actionHtml = `<button class="btn-atender" data-id="${alerta.id}">Atender</button>`;
            } else if (alerta.nivel === 'aviso') {
                dotClass = 'amarillo';
                textClass = 'text-yellow';
                actionHtml = `<button class="btn-atender" data-id="${alerta.id}">Atender</button>`;
            } else if (alerta.nivel === 'normal') {
                dotClass = 'verde';
                textClass = 'text-green';
                actionHtml = `<span style="color: var(--color-text-gray); font-size: 12px;">Saludable</span>`;
            } else if (alerta.nivel === 'atendida') {
                dotClass = 'verde';
                textClass = 'text-green';
                actionHtml = `<span style="color: var(--color-text-gray); font-size: 12px;">Resuelto</span>`;
            }

            const nivelTexto = alerta.nivel === 'critica' ? 'Crítica' : 
                               (alerta.nivel === 'aviso' ? 'Aviso' : 
                               (alerta.nivel === 'normal' ? 'Normal' : 'Atendida'));

            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; font-weight: 600;">
                        <span class="dot-status ${dotClass}"></span>
                        ${alerta.colmena}
                    </div>
                </td>
                <td style="color: var(--color-text-white);">${alerta.mensaje}</td>
                <td><span style="color: var(--color-text-gray); font-size: 13px;">${nivelTexto}</span></td>
                <td><span style="color: var(--color-text-gray); font-size: 13px;">${alerta.tiempo}</span></td>
                <td>
                    ${actionHtml}
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    async function cargarAlertas() {
        try {
            // 1. Cargar colmenas
            const resColmenas = await fetch('/api/gestion/colmenas');
            let colmenas = [];
            if (resColmenas.ok) {
                colmenas = await resColmenas.json();
            }

            // 2. Cargar alertas reales
            const resAlertas = await fetch('/alertas');
            if (!resAlertas.ok) throw new Error("Error fetching alertas");
            const alertasReales = await resAlertas.json();
            
            // 3. Identificar cuáles colmenas tienen alertas activas (críticas o avisos)
            const colmenasConAlertasActivas = new Set(
                alertasReales
                    .filter(a => a.nivel === 'critica' || a.nivel === 'aviso')
                    .map(a => a.colmena)
            );

            // 4. Construir la lista completa combinada
            todasLasAlertasYEstados = [];

            // Añadir todas las alertas reales primero (activas y atendidas)
            todasLasAlertasYEstados.push(...alertasReales);

            // Añadir estado "Normal" para las colmenas que no tienen ninguna alerta activa
            colmenas.forEach(c => {
                if (!colmenasConAlertasActivas.has(c.id)) {
                    todasLasAlertasYEstados.push({
                        colmena: c.id,
                        mensaje: "Parámetros normales",
                        nivel: "normal",
                        tiempo: "Al día"
                    });
                }
            });

            // 5. Calcular contadores para los KPIs
            const criticas = alertasReales.filter(a => a.nivel === 'critica').length;
            const avisos = alertasReales.filter(a => a.nivel === 'aviso').length;
            const atendidas = alertasReales.filter(a => a.nivel === 'atendida').length;
            const normales = colmenas.length - colmenasConAlertasActivas.size;

            // 6. Actualizar KPIs en el DOM
            document.getElementById('kpi-criticas').textContent = criticas;
            document.getElementById('kpi-avisos').textContent = avisos;
            document.getElementById('kpi-normales').textContent = normales;
            document.getElementById('kpi-atendidas').textContent = atendidas;

            // 7. Renderizar tabla con filtro activo
            aplicarFiltro();

        } catch (err) {
            console.error(err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="5">Error al cargar alertas</td></tr>';
            
            // Restablecer KPIs a '--' para no mostrar datos obsoletos o engañosos si el servidor está apagado
            document.getElementById('kpi-criticas').textContent = "--";
            document.getElementById('kpi-avisos').textContent = "--";
            document.getElementById('kpi-normales').textContent = "--";
            document.getElementById('kpi-atendidas').textContent = "--";
        }
    }

    // ==========================================
    // ATENDER ALERTA
    // ==========================================
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-atender')) {
                const alertId = e.target.getAttribute('data-id');
                if (alertId) {
                    if (confirm('¿Estás seguro de que deseas marcar esta alerta como atendida?')) {
                        fetch(`/alertas/${alertId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ atendida: true })
                        })
                        .then(res => {
                            if (!res.ok) throw new Error("Error al actualizar la alerta");
                            return res.json();
                        })
                        .then(() => {
                            cargarAlertas(); // Recargar KPIs y tabla
                        })
                        .catch(err => {
                            console.error(err);
                            alert('Error al marcar la alerta como atendida.');
                        });
                    }
                }
            }
        });
    }

    cargarAlertas();
});