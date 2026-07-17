document.addEventListener("DOMContentLoaded", () => {
    // 1. Get Colmena ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const colmenaId = urlParams.get('id');

    // 2. DOM Elements
    const elCodigo = document.getElementById("colmena-codigo");
    const elSubtitle = document.getElementById("page-subtitle");
    
    // IA Banner
    const elIaTag = document.getElementById("ia-tag");
    const elIaMsg = document.getElementById("ia-msg");
    const elHoraDet = document.getElementById("hora-deteccion");
    
    // Metrics
    const valPeso = document.getElementById("val-peso");
    const valTempInt = document.getElementById("val-temp-int");
    const valHumInt = document.getElementById("val-hum-int");
    const valTempExt = document.getElementById("val-temp-ext");
    const valHumExt = document.getElementById("val-hum-ext");

    // Lists
    const alertList = document.getElementById("colmena-alerts");
    const historyList = document.getElementById("colmena-history");

    // Chart instance
    let pesoChart = null;

    // 3. Fetch Data from Backend
    function fetchDashboardData() {
        if (!colmenaId) {
            console.warn("No se especificó la colmena. Usando 'C-01' por defecto.");
            colmenaId = 'C-01';
        }

        fetch(`/api/dashboard/colmena?id=${colmenaId}`)
            .then(res => {
                if(!res.ok) throw new Error("Error al cargar la colmena");
                return res.json();
            })
            .then(data => {
                renderizarDashboard(data);
            })
            .catch(err => {
                console.error("Error al cargar el dashboard de la colmena:", err);
                
                // MOCK DATA PARA VERCEL
                const randomPeso = parseFloat((Math.random() * 10 + 20).toFixed(1));
                let defaultColmenaData = {
                    codigo: "C-01",
                    apiario: "Apiario Vercel",
                    ecotipo: "Apis mellifera",
                    iaDiagnostico: { estado: "Normal", mensaje: "Colmena estable, actividad de forrajeo adecuada." },
                    lecturas: [
                        { fecha: "10 Jul", peso: (randomPeso).toFixed(1), temp_interna: 34.5, hum_interna: 60, temp_externa: 28, hum_externa: 55 },
                        { fecha: "11 Jul", peso: (randomPeso - 0.2).toFixed(1), temp_interna: 34.4, hum_interna: 59, temp_externa: 27, hum_externa: 50 },
                        { fecha: "12 Jul", peso: (randomPeso - 0.5).toFixed(1), temp_interna: 34.2, hum_interna: 61, temp_externa: 26, hum_externa: 52 },
                        { fecha: "13 Jul", peso: (randomPeso - 1.0).toFixed(1), temp_interna: 34.0, hum_interna: 62, temp_externa: 25, hum_externa: 55 },
                        { fecha: "14 Jul", peso: (randomPeso - 1.2).toFixed(1), temp_interna: 33.8, hum_interna: 60, temp_externa: 24, hum_externa: 58 },
                    ],
                    alertas: [
                        { nivel: "aviso", mensaje: "Leve descenso de humedad", fecha: "hace 2 días" }
                    ],
                    historial: [
                        { tipo: "Revisión", fecha: "Hace 5 días", resumen: "Revisión general, todo en orden." },
                        { tipo: "Cosecha", fecha: "Hace 1 mes", resumen: "Cosecha de 15 kg de miel." }
                    ]
                };

                let storedColmenaData = localStorage.getItem('colmenaData');
                if (storedColmenaData) {
                    try {
                        const parsed = JSON.parse(storedColmenaData);
                        if (parsed && parsed.lecturas && parsed.lecturas.length > 0) defaultColmenaData = parsed;
                    } catch(e) {
                        console.error('Error parsing colmenaData', e);
                    }
                }

                renderizarDashboard(defaultColmenaData);
            });
    }

    // 4. Render Data
    function renderizarDashboard(data) {
        // Header
        elCodigo.textContent = data.codigo;
        elSubtitle.innerHTML = `Apiario ${data.apiario} · Ecotipo: ${data.ecotipo} · <span class="monitoreo-status">Monitoreo activo</span>`;
        
        // IA Diagnostic
        const now = new Date();
        elHoraDet.textContent = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        elIaTag.textContent = data.iaDiagnostico.estado;
        elIaMsg.textContent = data.iaDiagnostico.mensaje;

        // Metricas (Latest reading)
        if (data.lecturas && data.lecturas.length > 0) {
            const last = data.lecturas[0];
            valPeso.textContent = last.peso ? `${last.peso} kg` : '-- kg';
            valTempInt.textContent = last.temp_interna ? `${last.temp_interna} °C` : '-- °C';
            valHumInt.textContent = last.hum_interna ? `${last.hum_interna} %` : '-- %';
            if (valTempExt) valTempExt.textContent = last.temp_externa ? `${last.temp_externa} °C` : '-- °C';
            if (valHumExt) valHumExt.textContent = last.hum_externa ? `${last.hum_externa} %` : '-- %';
        } else {
            valPeso.textContent = '-- kg';
            valTempInt.textContent = '-- °C';
            valHumInt.textContent = '-- %';
            if (valTempExt) valTempExt.textContent = '-- °C';
            if (valHumExt) valHumExt.textContent = '-- %';
        }

        // Render Alertas
        alertList.innerHTML = '';
        if (data.alertas && data.alertas.length > 0) {
            data.alertas.forEach(alerta => {
                const li = document.createElement("li");
                li.className = "alert-item";
                
                const dotClass = alerta.nivel === 'critico' ? 'red' : (alerta.nivel === 'aviso' ? 'yellow' : 'green');
                const timeAgo = alerta.fecha || 'reciente';
                const capLevel = alerta.nivel.charAt(0).toUpperCase() + alerta.nivel.slice(1);

                li.innerHTML = `
                    <span class="dot-indicator ${dotClass}"></span>
                    <div class="alert-item-content">
                        <span class="alert-title">${alerta.mensaje}</span>
                        <span class="alert-meta">${capLevel} · ${timeAgo}</span>
                    </div>
                `;
                alertList.appendChild(li);
            });
        } else {
            alertList.innerHTML = '<li class="alert-item"><div class="alert-meta">No hay alertas recientes</div></li>';
        }

        // Render Historial
        historyList.innerHTML = '';
        if (data.historial && data.historial.length > 0) {
            data.historial.forEach(h => {
                const li = document.createElement("li");
                li.className = "history-card";
                const tagClass = h.tipo.toLowerCase() === 'cosecha' ? 'cosecha' : 'visita';

                li.innerHTML = `
                    <span class="h-tag ${tagClass}">${h.tipo}</span>
                    <div class="h-content">
                        <span class="h-date">${h.fecha}</span>
                        <span class="h-desc">${h.resumen}</span>
                    </div>
                `;
                historyList.appendChild(li);
            });
        } else {
            historyList.innerHTML = '<li class="history-card"><div class="h-desc">No hay historial reciente</div></li>';
        }

        // Render Chart
        renderChart(data.lecturas || []);
    }

    function renderChart(lecturas) {
        const ctx = document.getElementById('colmenaPesoChart').getContext('2d');
        
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js no está cargado. Saltando renderizado de gráfica.");
            return;
        }
        
        // Reverse so the oldest is on the left
        const datos = [...lecturas].reverse();
        
        const labels = datos.map(d => d.fecha);
        const pesos = datos.map(d => d.peso);

        if (pesoChart) {
            pesoChart.destroy();
        }

                pesoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Peso (kg)',
                    data: pesos,
                    borderColor: "#F2A900",
                    backgroundColor: 'rgba(242, 169, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#F2A900",
                    pointBorderColor: '#1E1E1E',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E1E1E',
                        titleColor: '#8A7A5A',
                        bodyColor: '#F5F5F5',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#8A7A5A', stepSize: 5 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8A7A5A', maxTicksLimit: 5 }
                    }
                }
            }
        });
    }

    // Initialize
    fetchDashboardData();

    const btnMantenimiento = document.getElementById("btn-mantenimiento");
    if (btnMantenimiento) {
        btnMantenimiento.addEventListener("click", () => {
            if (colmenaId) {
                window.location.href = `mantenimientoModulo.html?id=${colmenaId}`;
            } else {
                window.location.href = `mantenimientoModulo.html`;
            }
        });
    }

    const btnIa = document.getElementById("btn-ia");
    if (btnIa) {
        btnIa.addEventListener("click", () => {
            if (colmenaId) {
                window.location.href = `diagnosticoIA.html?id=${colmenaId}`;
            } else {
                alert("Por favor, selecciona una colmena válida primero.");
            }
        });
    }


});
