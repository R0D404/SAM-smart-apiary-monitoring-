document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch data from API
    try {
        const res = await fetch('/api/historial');
        if (!res.ok) throw new Error('Error fetching historial');
        
        const data = await res.json();
        
        // 2. Update KPIs
        document.getElementById('kpi-total').textContent = data.totalTemporada || '-- kg';
        document.getElementById('kpi-promedio').textContent = data.promedioColmena || '-- kg';
        document.getElementById('kpi-mejor').textContent = data.mejorColmena || '--';
        document.getElementById('kpi-visitas').textContent = data.visitasRegistradas || '--';

        // 3. Render Line Chart (Producción acumulada)
        const ctxLine = document.getElementById('lineChart').getContext('2d');
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

        // 4. Render Bar Chart (Producción por colmena)
        const barLabelsCount = data.produccionPorColmena.labels.length;
        if (barLabelsCount > 15) {
            document.getElementById('barChartWrapper').style.width = Math.max(1000, barLabelsCount * 40) + 'px';
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

        // 5. Populate Table
        const tbody = document.getElementById('historial-tbody');
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

    } catch (error) {
        console.error('Error:', error);
    }
});
