document.addEventListener('DOMContentLoaded', () => {
    
    // Referencia al cuerpo de la tabla en el HTML
    const tbody = document.getElementById('tabla-visitas-body');

    /**
     * Función que recibe los datos de la base de datos y los dibuja en el HTML
     * @param {Array} datos - Arreglo de objetos con las visitas.
     */
    function renderizarTabla(datos) {
        tbody.innerHTML = ''; // Limpiamos la tabla por si ya tenía datos

        // Si la base de datos no trae nada, mostramos un mensaje vacío
        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #797165; padding: 40px;">
                        No hay registros de visitas disponibles.
                    </td>
                </tr>
            `;
            return;
        }

        // Iteramos los datos y construimos las filas (<tr>)
        datos.forEach(visita => {
            const tr = document.createElement('tr');
            
            // Lógica para atenuar visualmente los datos faltantes como en el diseño original ("No vista")
            const claseReina = visita.reina === 'No vista' ? 'text-muted' : '';
            const claseNotas = visita.notas === 'Poca población' || visita.notas === 'Posible saqueo, vigilar' ? 'text-muted' : '';

            tr.innerHTML = `
                <td>${visita.fecha}</td>
                <td class="text-colmena">${visita.colmena}</td>
                <td>${visita.apicultor}</td>
                <td>${visita.estado_colonia}</td>
                <td class="${claseReina}">${visita.reina}</td>
                <td class="${claseNotas}">${visita.notas}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    /* 
    ========================================================================
    AQUÍ CONECTARÁS TU BASE DE DATOS O FETCH EN EL FUTURO
    ========================================================================
    Solo tendrás que hacer tu petición al backend y luego llamar a la función 
    pasándole la respuesta JSON. Ejemplo:
    
    fetch('tu_url_del_backend/visitas')
        .then(res => res.json())
        .then(datos => {
            renderizarTabla(datos);
        });
    */

});