/**
 * dashboardGlobal.js
 * --------------------------------------------------
 * Módulo principal del Dashboard Global de SAM.
 * Toda la información que se muestra (estadísticas,
 * gráficas y apiarios) se alimenta desde objetos JS
 * que el backend (Javalin) actualizará vía fetch/AJAX.
 * --------------------------------------------------
 */

// =========================================
// 1. DATOS SIMULADOS (serán reemplazados por el backend)
// =========================================

/**
 * Datos de las tarjetas de estadísticas.
 * El backend retornará un objeto con esta estructura.
 * Por defecto son nulos hasta que el backend responda.
 */
let dashboardStats = {
    produccionTotal: null,
    colmenasActivas: null,
    alertasActivas: null,
    apicultores: null
};

/**
 * Datos para la gráfica de producción mensual (línea).
 * labels: meses a mostrar en el eje X.
 * data: producción en kg por cada mes.
 * null hasta que el backend envíe datos reales.
 */
let produccionMensualData = null;

/**
 * Datos para la gráfica de producción por colmena (barras).
 * labels: identificadores de cada colmena.
 * data: producción en kg por colmena.
 * null hasta que el backend envíe datos reales.
 */
let produccionColmenaData = null;

/**
 * Datos de los apiarios.
 * Cada apiario tiene: nombre, ubicación, número de colmenas y estado.
 * El estado puede ser: "verde", "amarillo" o "rojo".
 * Arreglo vacío hasta que el backend envíe datos.
 */
let apiariosData = [];

/**
 * Datos del usuario logueado.
 * El nombre y la foto dependen del backend.
 * null hasta que el backend responda.
 */
let userData = {
    nombre: null
};

// =========================================
// 2. REFERENCIAS AL DOM
// =========================================
const statProduccionEl   = document.getElementById("stat-produccion-total");
const statColmenasEl     = document.getElementById("stat-colmenas-activas");
const statAlertasEl      = document.getElementById("stat-alertas-activas");
const statApicultoresEl  = document.getElementById("stat-apicultores");
const apiariosContainer  = document.getElementById("apiarios-container");
const userAvatarEl       = document.getElementById("sidebar-user-avatar");
const userNameEl         = document.getElementById("sidebar-user-name");
const userPhotoEl        = document.getElementById("sidebar-user-photo");

// =========================================
// 3. FUNCIONES DE RENDERIZADO
// =========================================

/**
 * Actualiza las tarjetas de estadísticas en el DOM.
 * Si un valor es null, muestra '--' como placeholder.
 * @param {Object} stats - Objeto con los datos de estadísticas.
 */
function renderStats(stats) {
    const placeholder = "--";
    if (statProduccionEl)  statProduccionEl.textContent  = stats.produccionTotal  ?? placeholder;
    if (statColmenasEl)    statColmenasEl.textContent    = stats.colmenasActivas  ?? "-- / --";
    if (statAlertasEl)     statAlertasEl.textContent     = stats.alertasActivas   ?? placeholder;
    if (statApicultoresEl) statApicultoresEl.textContent = stats.apicultores      ?? placeholder;
}

/**
 * Actualiza el perfil de usuario en el sidebar.
 * Si el nombre es null, muestra placeholders.
 * Las iniciales se generan automáticamente a partir del nombre.
 * Si hay fotoUrl, intenta cargar la imagen; si falla, muestra iniciales.
 * @param {Object} user - { nombre: string|null, fotoUrl: string|null }
 */
function renderUserProfile(user) {
    if (!user || !user.nombre) {
        if (userAvatarEl) userAvatarEl.textContent = "--";
        if (userNameEl)   userNameEl.textContent   = "---";
        if (userPhotoEl)  userPhotoEl.classList.remove("loaded");
        return;
    }

    // Generar iniciales a partir del nombre (ej: "Emmanuel U." -> "EU")
    const iniciales = user.nombre
        .split(" ")
        .filter(p => p.length > 0)
        .map(p => p[0].toUpperCase())
        .slice(0, 2)
        .join("");

    if (userAvatarEl) userAvatarEl.textContent = iniciales;
    if (userNameEl)   userNameEl.textContent   = user.nombre;

    // Manejar foto de perfil
    if (userPhotoEl && user.fotoUrl) {
        userPhotoEl.onload = () => userPhotoEl.classList.add("loaded");
        userPhotoEl.onerror = () => userPhotoEl.classList.remove("loaded");
        userPhotoEl.src = user.fotoUrl;
    } else if (userPhotoEl) {
        userPhotoEl.classList.remove("loaded");
    }
}

/**
 * Renderiza las tarjetas de apiarios dentro del contenedor con scroll.
 * @param {Array} apiarios - Arreglo de objetos apiario.
 */
function renderApiarios(apiarios) {
    if (!apiariosContainer) return;

    // Si no hay apiarios, mostrar el mensaje vacío
    if (!apiarios || apiarios.length === 0) {
        apiariosContainer.innerHTML = '<p class="apiarios-empty" id="apiarios-empty-msg">Sin apiarios registrados. Los datos se cargarán desde el servidor.</p>';
        return;
    }

    apiariosContainer.innerHTML = "";

    apiarios.forEach(apiario => {
        const card = document.createElement("article");
        card.className = "apiario-card";
        card.setAttribute("role", "listitem");
        card.style.cursor = "pointer";
        card.onclick = () => {
            window.location.href = `dashboardApiario.html?id=${apiario.id}`;
        };

        card.innerHTML = `
            <span class="apiario-status-dot ${apiario.estado}" aria-label="Estado: ${apiario.estadoTexto}"></span>
            <div class="apiario-info">
                <h3>${apiario.nombre}</h3>
                <p class="apiario-location">${apiario.ubicacion} · ${apiario.colmenas} colmenas</p>
                <p class="apiario-estado ${apiario.estado}">Estado: ${apiario.estadoTexto}</p>
            </div>
        `;

        apiariosContainer.appendChild(card);
    });
}

// =========================================
// 4. GRÁFICAS (Chart.js)
// =========================================

/** Referencia global a las instancias de Chart para poder destruirlas al actualizar */
let chartProduccionMensual = null;
let chartProduccionColmena = null;

/**
 * Crea o actualiza la gráfica de producción mensual (línea).
 * @param {Object} data - {labels: string[], data: number[]}
 */
function renderChartProduccionMensual(data) {
    const ctx = document.getElementById("chart-produccion-mensual");
    if (!ctx) return;

    // Si la gráfica ya existe, la destruimos para redibujar
    if (chartProduccionMensual) {
        chartProduccionMensual.destroy();
    }

    chartProduccionMensual = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Producción (kg)",
                data: data.data,
                borderColor: "#F2A900",
                backgroundColor: "rgba(242, 169, 0, 0.08)",
                borderWidth: 2.5,
                pointBackgroundColor: "#F2A900",
                pointBorderColor: "#F2A900",
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#2A1E10",
                    titleColor: "#F2A900",
                    bodyColor: "#F5F5F5",
                    borderColor: "#3b3222",
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(59, 50, 34, 0.4)",
                        drawBorder: false
                    },
                    ticks: {
                        color: "#9c9993",
                        font: { size: 11, family: "'Inter', sans-serif" }
                    }
                },
                y: {
                    grid: {
                        color: "rgba(59, 50, 34, 0.4)",
                        drawBorder: false
                    },
                    ticks: {
                        color: "#9c9993",
                        font: { size: 11, family: "'Inter', sans-serif" },
                        stepSize: 15
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Crea o actualiza la gráfica de producción por colmena (barras).
 * @param {Object} data - {labels: string[], data: number[]}
 */
function renderChartProduccionColmena(data) {
    const ctx = document.getElementById("chart-produccion-colmena");
    if (!ctx) return;

    if (chartProduccionColmena) {
        chartProduccionColmena.destroy();
    }

    // Dynamic width for many colmenas
    const wrapper = document.getElementById("barChartWrapperGlobal");
    if (wrapper && data.labels.length > 15) {
        wrapper.style.width = Math.max(1000, data.labels.length * 40) + 'px';
    }

    chartProduccionColmena = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Producción (kg)",
                data: data.data,
                backgroundColor: "#F2A900",
                borderColor: "#F2A900",
                borderWidth: 0,
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#2A1E10",
                    titleColor: "#F2A900",
                    bodyColor: "#F5F5F5",
                    borderColor: "#3b3222",
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#9c9993",
                        font: { size: 11, family: "'Inter', sans-serif" }
                    }
                },
                y: {
                    grid: {
                        color: "rgba(59, 50, 34, 0.4)",
                        drawBorder: false
                    },
                    ticks: {
                        color: "#9c9993",
                        font: { size: 11, family: "'Inter', sans-serif" },
                        stepSize: 10
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// =========================================
// 5. FUNCIONES PARA ACTUALIZAR DESDE BACKEND
// =========================================

/**
 * Función pública para actualizar TODOS los datos del dashboard.
 * El backend (Javalin) puede llamar a esta función después de un fetch.
 *
 * Ejemplo de uso desde el backend:
 *   fetch('/api/dashboard')
 *     .then(res => res.json())
 *     .then(data => updateDashboard(data));
 *
 * @param {Object} data - Objeto completo del dashboard
 * @param {Object} data.stats - Estadísticas generales
 * @param {Object} data.produccionMensual - Datos de gráfica de línea
 * @param {Object} data.produccionColmena - Datos de gráfica de barras
 * @param {Array}  data.apiarios - Arreglo de apiarios
 */
function updateDashboard(data) {
    if (data.stats) {
        dashboardStats = data.stats;
        renderStats(dashboardStats);
    }

    if (data.produccionMensual) {
        produccionMensualData = data.produccionMensual;
        renderChartProduccionMensual(produccionMensualData);
    }

    if (data.produccionColmena) {
        produccionColmenaData = data.produccionColmena;
        renderChartProduccionColmena(produccionColmenaData);
    }

    if (data.apiarios) {
        apiariosData = data.apiarios;
        renderApiarios(apiariosData);
    }

    if (data.usuario) {
        userData = data.usuario;
        renderUserProfile(userData);
    }
}

/**
 * Función para cargar datos del dashboard desde el backend.
 * Descomenta y ajusta la URL cuando el backend esté listo.
 */
function fetchDashboardData() {
    fetch('/api/dashboard')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar datos del dashboard');
            return response.json();
        })
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error cargando dashboard:', error);
            // Fallback a los mock stats si falla
            renderStats(dashboardStats);
            renderApiarios(apiariosData);
            renderUserProfile(userData);
        });
}

// =========================================
// 6. INICIALIZACIÓN
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // Configurar la foto de perfil del HTML:
    // Si la imagen del src carga bien, mostrarla; si no, queda oculta (iniciales visibles)
    if (userPhotoEl) {
        userPhotoEl.onload = () => userPhotoEl.classList.add("loaded");
        userPhotoEl.onerror = () => userPhotoEl.classList.remove("loaded");

        // Si la imagen ya se cargó (cache del navegador), verificar manualmente
        if (userPhotoEl.complete && userPhotoEl.naturalWidth > 0) {
            userPhotoEl.classList.add("loaded");
        }
    }

    // Renderizar datos iniciales
    fetchDashboardData();

    // Comprobar si venimos de un login exitoso
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
        const toast = document.getElementById('toast-success');
        if (toast) {
            toast.classList.remove('hidden');
            // Ocultar después de 4 segundos
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }
        
        // Limpiar la URL para que no vuelva a salir si recargan la página
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
