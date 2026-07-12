document.addEventListener('DOMContentLoaded', () => {
    
    // Referencia al cuerpo de la tabla en el HTML
    const tbody = document.getElementById('tabla-alertas-body');

    /**
     * Función que recibe los datos de la base de datos y los dibuja
     * @param {Array} datos - Arreglo de objetos con las alertas.
     */
    function renderizarTablaAlertas(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #797165; padding: 40px;">
                        No hay alertas registradas en este momento.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(alerta => {
            const tr = document.createElement('tr');
            
            // Configurar colores dependiendo del nivel/estado de la alerta
            let dotClass = '';
            let textClass = '';
            
            // Lógica basada en tu diseño (puedes adaptar los condicionales según tu BD)
            if (alerta.nivel === 'critica') {
                dotClass = 'dot-red';
                textClass = 'text-red';
            } else if (alerta.nivel === 'aviso') {
                dotClass = 'dot-yellow';
                textClass = 'text-yellow';
            } else if (alerta.nivel === 'atendida') {
                dotClass = 'text-teal-dark'; // El diseño usa un verde turquesa para normales/atendidas
                textClass = 'text-teal-dark';
            }

            tr.innerHTML = `
                <td>
                    <div class="td-colmena">
                        <span class="dot ${dotClass}"></span>
                        ${alerta.colmena}
                    </div>
                </td>
                <td class="td-mensaje">${alerta.mensaje}</td>
                <td>${alerta.tipo}</td>
                <td>${alerta.fecha}</td>
                <td class="${textClass}">${alerta.estado}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    /* 
    ========================================================================
    EJEMPLO DE CÓMO INYECTAR LOS DATOS (PARA CUANDO TENGAS LA BD)
    ========================================================================
    
    // Simulación de datos extraídos de la BD basándonos en tu diseño:
    const datosEjemplo = [
        { nivel: 'critica', colmena: 'C-06', mensaje: 'Pérdida de 4.2 kg en 1.5 h — posible robo o enjambre', tipo: 'Tasa de cambio', fecha: 'hoy 11:20', estado: 'Activa' },
        { nivel: 'aviso', colmena: 'C-03', mensaje: 'Humedad interna 78% sobre umbral de la franja', tipo: 'Umbral', fecha: 'hoy 14:20', estado: 'Activa' },
        { nivel: 'aviso', colmena: 'C-05', mensaje: 'Temp. interna 37.8°C, 2.1°C sobre lo normal', tipo: 'Umbral', fecha: 'ayer 16:40', estado: 'Activa' },
        { nivel: 'atendida', colmena: 'C-01', mensaje: 'Peso estable dentro de rango', tipo: 'Umbral', fecha: 'ayer 09:10', estado: 'Atendida' },
        { nivel: 'atendida', colmena: 'C-02', mensaje: 'Caída de peso explicada por cosecha registrada', tipo: 'Tasa de cambio', fecha: '24 may', estado: 'Atendida' },
        { nivel: 'atendida', colmena: 'C-04', mensaje: 'Humedad normalizada tras ventilación', tipo: 'Umbral', fecha: '22 may', estado: 'Atendida' }
    ];
    
    // Llamar la función (Descomenta esto para ver los datos visualmente antes de conectar la BD real)
    // renderizarTablaAlertas(datosEjemplo);

    fetch('tu_url_del_backend/alertas')
        .then(res => res.json())
        .then(datosReales => {
            renderizarTablaAlertas(datosReales);
        });
    */
});