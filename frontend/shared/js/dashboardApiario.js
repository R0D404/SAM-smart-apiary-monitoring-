// =========================================
// 1. ESTADO GLOBAL (Datos del Apiario)
// =========================================
let apiarioStats = null;
let evolucionPesoData = null;
let colmenasData = [];
let userData = { nombre: null };

// =========================================
// 2. REFERENCIAS AL DOM
// =========================================
const statSaludEstadoEl   = document.getElementById("stat-salud-estado");
const statSaludDescEl     = document.getElementById("stat-salud-desc");
const statPesoPromedioEl  = document.getElementById("stat-peso-promedio");
const statAlertasActivasEl = document.getElementById("stat-alertas-activas");
const statUltimaVisitaEl  = document.getElementById("stat-ultima-visita");

const colmenasContainer   = document.getElementById("colmenas-container");
const userAvatarEl        = document.getElementById("sidebar-user-avatar");
const userNameEl          = document.getElementById("sidebar-user-name");
const userPhotoEl         = document.getElementById("sidebar-user-photo");

// =========================================
// 3. FUNCIONES DE RENDERIZADO
// =========================================

function renderStats(stats) {
    const placeholder = "--";
    
    // Salud
    if (statSaludEstadoEl) {
        statSaludEstadoEl.textContent = stats?.saludEstado || placeholder;
        
        // Remove old classes
        statSaludEstadoEl.classList.remove("green", "red");
        // Update dots logic
        const dotYellow = document.querySelector(".salud-dots .dot.yellow");
        const dotGreen = document.querySelector(".salud-dots .dot.green");
        const dotRed = document.querySelector(".salud-dots .dot.red");
        
        if (dotYellow) dotYellow.className = "dot";
        if (dotGreen) dotGreen.className = "dot";
        if (dotRed) dotRed.className = "dot";
        
        const dots = document.querySelectorAll(".salud-dots .dot");
        
        let colorClass = "";
        if (stats?.saludEstado === "Aviso" || stats?.saludEstado === "Precaución") {
            colorClass = "yellow";
            if (dots.length >= 1) dots[0].classList.add(colorClass);
        } else if (stats?.saludEstado === "Óptimo" || stats?.saludEstado === "Bien") {
            colorClass = "green";
            statSaludEstadoEl.classList.add("green");
            if (dots.length >= 1) dots[0].classList.add(colorClass);
        } else if (stats?.saludEstado === "Crítico" || stats?.saludEstado === "Peligro") {
            colorClass = "red";
            statSaludEstadoEl.classList.add("red");
            if (dots.length >= 1) dots[0].classList.add(colorClass);
        }
    }
    
    if (statSaludDescEl) {
        statSaludDescEl.textContent = stats?.saludDesc || placeholder;
    }

    // Otros stats
    if (statPesoPromedioEl) statPesoPromedioEl.textContent = stats?.pesoPromedio || placeholder;
    if (statAlertasActivasEl) statAlertasActivasEl.textContent = stats?.alertasActivas || placeholder;
    if (statUltimaVisitaEl) statUltimaVisitaEl.textContent = stats?.ultimaVisita || placeholder;
}

function renderUserProfile(user) {
    if (!user || !user.nombre) {
        if (userAvatarEl) userAvatarEl.textContent = "--";
        if (userNameEl)   userNameEl.textContent   = "---";
        if (userPhotoEl)  userPhotoEl.classList.remove("loaded");
        return;
    }

    const iniciales = user.nombre
        .split(" ")
        .filter(p => p.length > 0)
        .map(p => p[0].toUpperCase())
        .slice(0, 2)
        .join("");

    if (userAvatarEl) userAvatarEl.textContent = iniciales;
    if (userNameEl)   userNameEl.textContent   = user.nombre;

    if (userPhotoEl && user.fotoUrl) {
        userPhotoEl.onload = () => userPhotoEl.classList.add("loaded");
        userPhotoEl.onerror = () => userPhotoEl.classList.remove("loaded");
        userPhotoEl.src = user.fotoUrl;
    } else if (userPhotoEl) {
        userPhotoEl.classList.remove("loaded");
    }
}

function renderColmenas(colmenas) {
    if (!colmenasContainer) return;

    if (!colmenas || colmenas.length === 0) {
        colmenasContainer.innerHTML = '<p class="colmenas-empty" id="colmenas-empty-msg">Sin colmenas registradas. Los datos se cargarán desde el servidor.</p>';
        return;
    }

    colmenasContainer.innerHTML = "";
    
    colmenas.forEach(colmena => {
        const estadoClase = colmena.estado || "verde";
        
        const cardHtml = `
            <article class="colmena-card" tabindex="0" role="button">
                <div class="colmena-status-dot ${estadoClase}"></div>
                <div class="colmena-info-wrapper">
                    <h3 class="colmena-id">${colmena.id || "C-?"}</h3>
                    <p class="colmena-status-text ${estadoClase}">${colmena.estadoTexto || "Verde"}</p>
                </div>
            </article>
        `;
        colmenasContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
}

// =========================================
// 4. CHART.JS - GRÁFICA DE PESO
// =========================================
let chartEvolucionPesoInstance = null;

function renderChartEvolucionPeso(chartData) {
    const canvas = document.getElementById("chart-evolucion-peso");
    if (!canvas) return;

    if (!chartData || !chartData.labels || !chartData.datasets) return;

    if (chartEvolucionPesoInstance) {
        chartEvolucionPesoInstance.destroy();
    }

    const isMobile = window.innerWidth <= 768;

    chartEvolucionPesoInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: index === 0 ? '#F2A900' : '#4CAF50', // Yellow for first, Green for second
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointBackgroundColor: index === 0 ? '#F2A900' : '#4CAF50',
                pointRadius: isMobile ? 2 : 4,
                pointHoverRadius: 6,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'start',
                    labels: {
                        color: '#9c9993',
                        font: { family: "'Inter', sans-serif", size: 11 },
                        usePointStyle: false,
                        boxWidth: 12,
                        boxHeight: 2
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 18, 6, 0.9)',
                    titleColor: '#F5F5F5',
                    bodyColor: '#F2A900',
                    borderColor: '#3b3222',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        color: '#9c9993',
                        font: { family: "'Inter', sans-serif", size: 10 },
                        maxTicksLimit: isMobile ? 4 : 6
                    }
                },
                y: {
                    grid: { color: '#3b3222', drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: '#9c9993',
                        font: { family: "'Inter', sans-serif", size: 10 },
                        stepSize: 5
                    },
                    min: 30,
                    max: 50
                }
            }
        }
    });
}

// =========================================
// 5. OBTENCIÓN DE DATOS (Backend)
// =========================================
function updateDashboard(data) {
    if (data.stats) {
        apiarioStats = data.stats;
        renderStats(apiarioStats);
    }

    if (data.evolucionPeso) {
        evolucionPesoData = data.evolucionPeso;
        renderChartEvolucionPeso(evolucionPesoData);
    }

    if (data.colmenas) {
        colmenasData = data.colmenas;
        renderColmenas(colmenasData);
    }

    if (data.usuario) {
        userData = data.usuario;
        renderUserProfile(userData);
    }
}

function fetchDashboardData() {
    /*
    // ============================================================
    // DESCOMENTAR CUANDO EL BACKEND JAVALIN ESTÉ LISTO
    // ============================================================
    fetch('/api/dashboardApiario/norte')
        .then(response => response.json())
        .then(data => updateDashboard(data))
        .catch(error => console.error('Error:', error));
    */

    renderStats(apiarioStats);
    renderColmenas(colmenasData);
    renderUserProfile(userData);
    console.log('Dashboard Apiario cargado en modo sin backend.');
}

// =========================================
// 6. INICIALIZACIÓN
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    if (userPhotoEl) {
        userPhotoEl.onload = () => userPhotoEl.classList.add("loaded");
        userPhotoEl.onerror = () => userPhotoEl.classList.remove("loaded");
        if (userPhotoEl.complete && userPhotoEl.naturalWidth > 0) {
            userPhotoEl.classList.add("loaded");
        }
    }

    fetchDashboardData();

    // Resize listener para gráficas
    window.addEventListener('resize', () => {
        if (evolucionPesoData) {
            renderChartEvolucionPeso(evolucionPesoData);
        }
    });
});
