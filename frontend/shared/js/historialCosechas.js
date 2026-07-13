document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos del resumen
    const elTotal = document.getElementById('total-cosecha');
    const elPromedio = document.getElementById('promedio-colmena');
    const elPorcentaje = document.getElementById('porcentaje-validado');
    
    // Cargar Resumen
    fetch('/api/cosechas/resumen')
        .then(res => res.json())
        .then(data => {
            elTotal.innerText = `${data.totalTemporada || 0} kg`;
            elPromedio.innerText = `${data.promedioColmena ? data.promedioColmena.toFixed(1) : 0} kg`;
            elPorcentaje.innerText = `${data.porcentajeValidado ? data.porcentajeValidado.toFixed(0) : 0} %`;
        })
        .catch(err => console.error("Error cargando resumen", err));

    // Cargar Gráfica
    fetch('/api/cosechas/grafica')
        .then(res => res.json())
        .then(data => {
            const chartContainer = document.getElementById('chart-bars');
            chartContainer.innerHTML = '';
            
            // max value to scale the bars (assuming max height is ~100px or 100%)
            const maxVal = Math.max(...data.map(d => d.total), 40); // 40 as default scale max
            
            data.forEach(item => {
                const percentage = (item.total / maxVal) * 100;
                
                const wrapper = document.createElement('div');
                wrapper.className = 'bar-wrapper';
                
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = `${percentage}%`;
                
                const label = document.createElement('div');
                label.className = 'bar-label';
                label.innerText = item.colmena.replace('C-0', 'C').replace('C-', 'C'); // e.g., C-01 -> C1
                
                wrapper.appendChild(bar);
                wrapper.appendChild(label);
                
                chartContainer.appendChild(wrapper);
            });
        })
        .catch(err => console.error("Error cargando gráfica", err));

    // Cargar Tabla
    const tbody = document.getElementById('tabla-cosechas-body');
    fetch('/api/cosechas')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            data.forEach(cosecha => {
                const tr = document.createElement('tr');
                
                const dotClass = cosecha.validado_con_peso ? 'green' : 'gray';
                const validadoText = cosecha.validado_con_peso ? 'Sí' : 'No (sin sensor)';

                tr.innerHTML = `
                    <td>${cosecha.fecha}</td>
                    <td><strong>${cosecha.colmena}</strong></td>
                    <td>${cosecha.apicultor}</td>
                    <td>${cosecha.kg}</td>
                    <td>${cosecha.calidad || 'No definida'}</td>
                    <td><span class="status-dot ${dotClass}"></span>${validadoText}</td>
                `;
                
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Error cargando tabla de cosechas", err);
            tbody.innerHTML = '<tr><td colspan="6">Error al cargar datos</td></tr>';
        });
});
