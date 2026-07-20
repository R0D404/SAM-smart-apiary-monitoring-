document.addEventListener("DOMContentLoaded", () => {
    const statColmenas = document.getElementById("stat-colmenas-a-cargo");
    const statAlertas = document.getElementById("stat-alertas-activas");
    const statVisita = document.getElementById("stat-ultima-visita");
    const apiariosList = document.getElementById("apiarios-list");

    // Función para dibujar una gráfica simple en Canvas
    function dibujarMiniGrafica(canvasId, historico) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Configuración básica del canvas
        const width = canvas.width = 120;
        const height = canvas.height = 40;

        let datos = historico && historico.length > 0 ? historico : [0];
        if (datos.length === 1) datos = [datos[0], datos[0]];

        const maxVal = Math.max(...datos) + 5;
        const minVal = Math.max(0, Math.min(...datos) - 5);

        ctx.strokeStyle = "#eab308"; // Amarillo primario de SAM
        ctx.lineWidth = 2;
        ctx.beginPath();

        datos.forEach((val, idx) => {
            const x = (idx / (datos.length - 1)) * width;
            // Invertimos Y para que valores altos estén arriba
            let y = height - ((val - minVal) / (maxVal - minVal || 1)) * height;
            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    async function cargarMisApiarios() {
        try {
            // 1. Intentamos cargar los apiarios del servidor
            const response = await fetch("/api/gestion/apiarios");
            if (!response.ok) throw new Error("Error al obtener los apiarios");
            const apiarios = await response.json();

            // 2. Intentamos cargar las alertas para calcular las alertas activas
            let alertasReales = [];
            try {
                const resAlertas = await fetch("/alertas");
                if (resAlertas.ok) {
                    alertasReales = await resAlertas.json();
                }
            } catch (e) {
                console.warn("No se pudieron cargar las alertas detalladas:", e);
            }

            // 3. Limpiar lista hardcodeada
            apiariosList.innerHTML = "";

            if (apiarios.length === 0) {
                apiariosList.innerHTML = `
                    <div style="text-align: center; color: var(--color-text-gray); padding: 40px; width: 100%;">
                        No tienes apiarios asignados en este momento.
                    </div>
                `;
                statColmenas.textContent = "0";
                statAlertas.textContent = "0";
                statVisita.textContent = "Sin visitas";
                return;
            }

            let totalColmenas = 0;
            let totalAlertasActivas = 0;

            apiarios.forEach(api => {
                totalColmenas += api.colmenas || 0;

                // Contar alertas activas asociadas a este apiario
                const criticas = api.criticas || 0;
                const avisos = api.avisos || 0;
                const totalAlertasEsteApiario = criticas + avisos;
                totalAlertasActivas += totalAlertasEsteApiario;

                // Determinar clase de estado de salud
                let saludTexto = "Saludable";
                let saludClase = "saludable";
                let dotStatusClase = "verde";

                if (criticas > 0) {
                    saludTexto = "Crítico";
                    saludClase = "critico";
                    dotStatusClase = "rojo";
                } else if (avisos > 0) {
                    saludTexto = "Atención";
                    saludClase = "atencion";
                    dotStatusClase = "amarillo";
                }

                // Generar tarjeta de apiario dinámicamente
                const card = document.createElement("article");
                card.className = "apiario-card";
                card.setAttribute("data-apiario-id", api.id);
                let yMax = 50, yMid = 40, yMin = 30;
                if ((api.colmenas || 0) > 0 && api.peso_historial && api.peso_historial.length > 0) {
                    let pDatos = api.peso_historial;
                    let pMax = Math.max(...pDatos) + 5;
                    let pMin = Math.max(0, Math.min(...pDatos) - 5);
                    yMax = Math.round(pMax);
                    yMin = Math.round(pMin);
                    yMid = Math.round((yMax + yMin) / 2);
                }

                const hoy = new Date();
                const hace3 = new Date(hoy); hace3.setDate(hoy.getDate() - 3);
                const hace7 = new Date(hoy); hace7.setDate(hoy.getDate() - 7);
                const formatter = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });

                card.innerHTML = `
                    <div class="apiario-card-header">
                        <span class="status-dot ${dotStatusClase}"></span>
                        <div class="apiario-info">
                            <h3>${api.nombre}</h3>
                            <p>${api.localidad || 'Ubicación'} · ${api.colmenas || 0} colmenas</p>
                        </div>
                        <a href="dashboardApiario.html?id=${api.id}" class="ver-colmenas">Ver colmenas ›</a>
                    </div>

                    <div class="apiario-card-body">
                        <div class="salud-box">
                            <span class="label">Salud</span>
                            <strong class="estado ${saludClase}">${saludTexto}</strong>
                            <div class="conteo-colmenas">
                                <span class="dot verde"></span><span>${Math.max(0, (api.colmenas || 0) - totalAlertasEsteApiario)}</span>
                                <span class="dot amarillo"></span><span>${avisos}</span>
                                <span class="dot rojo"></span><span>${criticas}</span>
                            </div>
                        </div>

                        ${(api.colmenas || 0) > 0 ? `
                        <div class="chart-box">
                            <div class="chart-canvas-wrap">
                                <div class="chart-axis-y"><span>${yMax} kg</span><span>${yMid} kg</span><span>${yMin} kg</span></div>
                                <canvas class="mini-chart" id="chart-apiario-${api.id}"></canvas>
                            </div>
                            <div class="chart-axis-x">
                                <span style="text-transform: lowercase">${formatter.format(hace7)}</span>
                                <span style="text-transform: lowercase">${formatter.format(hace3)}</span>
                                <span style="text-transform: lowercase">${formatter.format(hoy)}</span>
                            </div>
                            <p class="chart-caption">Peso promedio · últimos 7 días</p>
                        </div>
                        ` : `
                        <div class="chart-box" style="display: flex; align-items: center; justify-content: center; height: 100px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; margin: 20px 0;">
                            <p class="chart-caption" style="margin: 0; text-align: center; color: var(--color-text-gray);">Sin colmenas registradas<br><span style="font-size: 0.8em; opacity: 0.7;">No hay historial de peso</span></p>
                        </div>
                        `}

                        <div class="alerta-box">
                            ${totalAlertasEsteApiario > 0 
                                ? `<span class="alerta-pill">${totalAlertasEsteApiario} alerta${totalAlertasEsteApiario > 1 ? 's' : ''}</span>`
                                : `<span class="alerta-pill" style="background-color: var(--color-bg-alert-green); color: var(--color-alert-green); border-color: rgba(76, 175, 80, 0.2);">Sin alertas</span>`
                            }
                        </div>
                    </div>
                `;

                apiariosList.appendChild(card);

                // Dibujar la gráfica lineal en el Canvas si hay colmenas
                if ((api.colmenas || 0) > 0) {
                    dibujarMiniGrafica(`chart-apiario-${api.id}`, api.peso_historial);
                }
            });

            // Actualizar estadísticas superiores
            statColmenas.textContent = totalColmenas;
            statAlertas.textContent = totalAlertasActivas;
            statVisita.textContent = "Hace 1 día";

        } catch (error) {
            console.error("Error al cargar apiarios de apicultor:", error);
            
            // Restablecer los KPIs de las tarjetas a '--'
            statColmenas.textContent = "--";
            statAlertas.textContent = "--";
            statVisita.textContent = "--";

            // Mostrar mensaje de error en la lista de apiarios
            apiariosList.innerHTML = `
                <div style="text-align: center; color: var(--color-text-gray); padding: 40px; width: 100%;">
                    <p style="font-weight: 500; font-size: 16px; margin-bottom: 8px; color: var(--color-text-white);">Error al cargar apiarios</p>
                    <p style="font-size: 14px;">No se pudo conectar con el servidor local. Verifique que el servicio esté encendido.</p>
                </div>
            `;
        }
    }

    cargarMisApiarios();
});
