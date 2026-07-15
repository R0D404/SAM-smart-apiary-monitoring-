document.addEventListener("DOMContentLoaded", () => {
    const statColmenas = document.getElementById("stat-colmenas-a-cargo");
    const statAlertas = document.getElementById("stat-alertas-activas");
    const statVisita = document.getElementById("stat-ultima-visita");
    const apiariosList = document.getElementById("apiarios-list");

    // Función para dibujar una gráfica simple en Canvas
    function dibujarMiniGrafica(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Configuración básica del canvas
        const width = canvas.width = 120;
        const height = canvas.height = 40;

        // Puntos simulados de peso promedio
        const datos = [32, 35, 34, 38, 41, 40, 42];
        const maxVal = 50;
        const minVal = 30;

        ctx.strokeStyle = "#eab308"; // Amarillo primario de SAM
        ctx.lineWidth = 2;
        ctx.beginPath();

        datos.forEach((val, idx) => {
            const x = (idx / (datos.length - 1)) * width;
            // Invertimos Y para que valores altos estén arriba
            const y = height - ((val - minVal) / (maxVal - minVal)) * height;
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

                        <div class="chart-box">
                            <div class="chart-canvas-wrap">
                                <div class="chart-axis-y"><span>50</span><span>40</span><span>30</span></div>
                                <canvas class="mini-chart" id="chart-apiario-${api.id}"></canvas>
                            </div>
                            <div class="chart-axis-x">
                                <span>23 may</span><span>30 may</span><span>06 jun</span>
                            </div>
                            <p class="chart-caption">Peso promedio · 30 días</p>
                        </div>

                        <div class="alerta-box">
                            ${totalAlertasEsteApiario > 0 
                                ? `<span class="alerta-pill">${totalAlertasEsteApiario} alerta${totalAlertasEsteApiario > 1 ? 's' : ''}</span>`
                                : `<span class="alerta-pill" style="background-color: var(--color-bg-alert-green); color: var(--color-alert-green); border-color: rgba(76, 175, 80, 0.2);">Sin alertas</span>`
                            }
                        </div>
                    </div>
                `;

                apiariosList.appendChild(card);

                // Dibujar la gráfica lineal en el Canvas
                dibujarMiniGrafica(`chart-apiario-${api.id}`);
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
