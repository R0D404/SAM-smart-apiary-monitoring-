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
    
    // Lists
    const alertList = document.getElementById("colmena-alerts");
    const historyList = document.getElementById("colmena-history");

    // Chart instance
    let pesoChart = null;

    // 3. Fetch Data from Backend
    function fetchDashboardData() {
        if (!colmenaId) {
            console.warn("No se especificó la colmena. Cargando panel vacío.");
            renderizarDashboard({
                codigo: "C-Sin ID",
                apiario: "No especificado",
                ecotipo: "N/A",
                iaDiagnostico: { estado: "Normal", mensaje: "Sin diagnóstico disponible" },
                lecturas: [],
                alertas: [],
                historial: []
            });
            return;
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
                renderizarDashboard({
                    codigo: colmenaId,
                    apiario: "--",
                    ecotipo: "--",
                    iaDiagnostico: { estado: "--", mensaje: "Servidor local desconectado" },
                    lecturas: [],
                    alertas: [],
                    historial: []
                });
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
            valPeso.textContent = `${last.peso} kg`;
            valTempInt.textContent = `${last.temp_interna} °C`;
            valHumInt.textContent = `${last.hum_interna} %`;
        } else {
            valPeso.textContent = '-- kg';
            valTempInt.textContent = '-- °C';
            valHumInt.textContent = '-- %';
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
                    borderColor: '#F2A900', // var(--color-primary)
                    backgroundColor: 'rgba(242, 169, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#F2A900',
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

    document.getElementById("btn-mantenimiento").addEventListener("click", () => {
        alert("Funcionalidad de mantenimiento en construcción.");
    });

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

    const btnMiCuenta = document.getElementById("btn-mi-cuenta");
    if (btnMiCuenta) {
        btnMiCuenta.addEventListener("click", () => {
            window.location.href = "miCuenta.html";
        });
    }
});
