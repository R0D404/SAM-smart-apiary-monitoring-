document.addEventListener('DOMContentLoaded', () => {
    
    const tbody = document.getElementById('tabla-visitas-body');

    // Datos simulados basados en la captura "A06 · Historial de Visitas (apic).png"
    const visitasMock = [
        { fecha: '24 may', colmena: 'C-02', apicultor: 'Rodrigo G.', estado: 'Fuerte y activa', reina: 'Sí', notas: 'Buena postura, reservas ok' },
        { fecha: '18 may', colmena: 'C-03', apicultor: 'Rodrigo G.', estado: 'Saludable', reina: 'Sí', notas: 'Revisar ventilación' },
        { fecha: '18 may', colmena: 'C-01', apicultor: 'Rodrigo G.', estado: 'Fuerte', reina: 'Sí', notas: 'Sin novedades' },
        { fecha: '12 may', colmena: 'C-05', apicultor: 'Rodrigo G.', estado: 'Moderada', reina: 'No vista', notas: 'Poca población' },
        { fecha: '02 may', colmena: 'C-04', apicultor: 'Rodrigo G.', estado: 'Saludable', reina: 'Sí', notas: 'Lista para cosecha' },
        { fecha: '28 abr', colmena: 'C-06', apicultor: 'Rodrigo G.', estado: 'Débil', reina: 'No vista', notas: 'Posible saqueo, vigilar' }
    ];

    /**
     * Función que renderiza el arreglo de datos en la tabla
     */
    function renderizarTabla(datos) {
        tbody.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #797165; padding: 40px;">
                        No tienes registros de visitas aún.
                    </td>
                </tr>
            `;
            return;
        }

        datos.forEach(visita => {
            const tr = document.createElement('tr');
            
            // Atenuar texto de la reina si no fue vista
            const claseReina = visita.reina === 'No vista' ? 'text-muted' : '';
            
            // Atenuar notas grises oscuras según el diseño de Figma
            const claseNotas = visita.notas === 'Poca población' || visita.notas === 'Posible saqueo, vigilar' || visita.notas === 'Revisar ventilación' || visita.notas === 'Sin novedades' ? 'text-muted' : 'text-muted'; 
            // Nota: En la imagen proporcionada, casi todas las descripciones de notas están en un tono gris/café atenuado. Las pondré todas con la clase text-muted por defecto.

            tr.innerHTML = `
                <td>${visita.fecha}</td>
                <td class="text-colmena">${visita.colmena}</td>
                <td>${visita.apicultor}</td>
                <td>${visita.estado}</td>
                <td class="${claseReina}">${visita.reina}</td>
                <td class="text-muted">${visita.notas}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    // Ejecutamos la función de renderizado
    renderizarTabla(visitasMock);

    // ==========================================
    // LÓGICA DE BOTONES Y FILTROS (Plantilla)
    // ==========================================
    const btnRegistrar = document.querySelector('.btn-primary');
    const btnFiltros = document.querySelectorAll('.filter-btn');

    btnRegistrar.addEventListener('click', () => {
        alert('Se abriría la pantalla o modal para registrar una visita de campo.');
    });

    btnFiltros.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Quitar clase active a todos
            btnFiltros.forEach(b => b.classList.remove('active', 'outline'));
            btnFiltros.forEach(b => b.classList.add('outline'));
            
            // Poner clase active al presionado
            e.target.classList.remove('outline');
            e.target.classList.add('active');
        });
    });
});