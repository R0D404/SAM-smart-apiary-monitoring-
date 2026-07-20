document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch data from API
    try {
        const res = await fetch('/api/historial');
        if (!res.ok) throw new Error('Error fetching historial');
        
        const data = await res.json();
        renderHistorialData(data);

    } catch (error) {
        console.warn('Error fetching historial, usando mock data:', error);
        
        // Mock data
        const mockData = {
            totalTemporada: "450 kg",
            promedioColmena: "25 kg",
            mejorColmena: "C-003",
            visitasRegistradas: "12",
            produccionAcumulada: {
                labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                data: [0, 0, 50, 120, 210, 290, 350, 400, 450, 450, 450, 450]
            },
            produccionPorColmena: {
                labels: ["C-001", "C-002", "C-003", "C-004", "C-005", "C-006", "C-007", "C-008", "C-009", "C-010"],
                data: [20, 22, 35, 18, 25, 28, 24, 30, 21, 27]
            },
            historialCosechas: [
                { fecha: "15 Oct 2023", colmena: "C-003", kg: "15", calidad: "Alta", validada: "Sí" },
                { fecha: "12 Oct 2023", colmena: "C-008", kg: "12", calidad: "Media", validada: "Sí" },
                { fecha: "05 Oct 2023", colmena: "C-001", kg: "8", calidad: "Alta", validada: "No" },
                { fecha: "28 Sep 2023", colmena: "C-005", kg: "14", calidad: "Alta", validada: "Sí" },
                { fecha: "20 Sep 2023", colmena: "C-002", kg: "10", calidad: "Baja", validada: "No" }
            ]
        };
        
        renderHistorialData(mockData);
    }
});

function renderHistorialData(data) {
    // 2. Update KPIs
    document.getElementById('kpi-total').textContent = data.totalTemporada || '-- kg';
    document.getElementById('kpi-promedio').textContent = data.promedioColmena || '-- kg';
    document.getElementById('kpi-mejor').textContent = data.mejorColmena || '--';
    document.getElementById('kpi-visitas').textContent = data.visitasRegistradas || '--';

    // 3. Render Line Chart (Producción acumulada)
    const lineCanvas = document.getElementById('lineChart');
    if (lineCanvas) {
        const ctxLine = lineCanvas.getContext('2d');
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: data.produccionAcumulada.labels,
                datasets: [{
                    label: 'Producción (kg)',
                    data: data.produccionAcumulada.data,
                    borderColor: '#F2A900',
                    backgroundColor: 'rgba(242, 169, 0, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#F2A900',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#3b3222', drawBorder: false },
                        ticks: { color: '#9c9993' }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9c9993' }
                    }
                }
            }
        });
    }

    // 4. Render Bar Chart (Producción por colmena)
    const barLabelsCount = data.produccionPorColmena.labels.length;
    const barWrapper = document.getElementById('barChartWrapper');
    if (barWrapper) {
        if (barLabelsCount > 15) {
            barWrapper.style.width = Math.max(1000, barLabelsCount * 40) + 'px';
        }
        
        const ctxBar = document.getElementById('barChart').getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: data.produccionPorColmena.labels,
                datasets: [{
                    label: 'Producción (kg)',
                    data: data.produccionPorColmena.data,
                    backgroundColor: '#F2A900',
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#3b3222', drawBorder: false },
                        ticks: { color: '#9c9993' }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9c9993' }
                    }
                }
            }
        });
    }

    // 5. Populate Table
    const tbody = document.getElementById('historial-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        data.historialCosechas.forEach(row => {
            const tr = document.createElement('tr');
            
            const validadaClass = row.validada === 'Sí' ? 'si' : 'no';
            
            tr.innerHTML = `
                <td>${row.fecha}</td>
                <td class="col-colmena">${row.colmena}</td>
                <td>${row.kg}</td>
                <td>${row.calidad}</td>
                <td class="col-validada ${validadaClass}">${row.validada}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}
