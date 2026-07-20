document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const colmenaId = urlParams.get('id');

    if (!colmenaId) {
        alert("No se especificó la colmena");
        window.history.back();
        return;
    }

    // ==========================================
    // 0. CARGAR DATOS DEL MÓDULO E HISTORIAL
    // ==========================================
    function cargarDatos() {
        fetch(`/api/modulos/${colmenaId}`)
            .then(res => {
                if (!res.ok) throw new Error("Error al cargar módulo");
                return res.json();
            })
            .then(data => {
                // Populate breadcrumbs
                const bcColmena = document.getElementById('bc-colmena');
                const bcModulo = document.getElementById('bc-modulo');
                if (bcColmena) bcColmena.textContent = colmenaId;
                if (bcModulo) bcModulo.textContent = `Módulo ${data.identificador}`;
                
                // Populate summary list
                const listaModulo = document.querySelector('.data-list.module-data');
                if (listaModulo) {
                    listaModulo.innerHTML = `
                        <li><span>Identificador</span> <span>${data.identificador}</span></li>
                        <li><span>Tipo</span> <span style="text-transform: capitalize">${data.tipo}</span></li>
                        <li><span>Estado</span> <span style="text-transform: capitalize">${data.estado}</span></li>
                        <li><span>Instalado</span> <span>${data.instalado}</span></li>
                        <li><span>Última lectura</span> <span>${data.ultima_lectura.split(' ')[0]}</span></li>
                        <li><span>Eventos registrados</span> <span>${data.eventos || 0}</span></li>
                    `;
                }

                // Populate history list
                const historyList = document.querySelector('.history-list.module-history');
                if (historyList) {
                    if (data.historial && data.historial.length > 0) {
                        historyList.innerHTML = data.historial.map(h => `
                            <li>
                                <div class="timeline-dot"></div>
                                <div class="history-item-content">
                                    <span class="history-date">${h.fecha}</span>
                                    <span class="history-desc">${h.detalle}</span>
                                </div>
                            </li>
                        `).join('');
                    } else {
                        historyList.innerHTML = `<li class="empty-state">No hay historial reciente disponible.</li>`;
                    }
                }
            })
            .catch(console.error);
    }
    cargarDatos();

    // ==========================================
    // 1. CONTADOR DE CARACTERES DEL TEXTAREA
    // ==========================================
    const textareaDesc = document.getElementById('desc-mantenimiento');
    const charCounter = document.getElementById('char-count');
    const maxLength = textareaDesc.getAttribute('maxlength') || 500;

    function actualizarContador() {
        const currentLength = textareaDesc.value.length;
        if(charCounter) charCounter.textContent = `${currentLength} / ${maxLength}`;
    }

    if(textareaDesc) {
        textareaDesc.addEventListener('input', actualizarContador);
        actualizarContador();
    }

    // ==========================================
    // 2. LÓGICA DE ENVÍO DE FORMULARIO
    // ==========================================
    const formMantenimiento = document.getElementById('form-mantenimiento');
    const btnCancelar = document.querySelector('.btn-outline-cancel');

    if (formMantenimiento) {
        formMantenimiento.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btnSubmit = formMantenimiento.querySelector('button[type="submit"]');
            
            const tipoEventoSeleccionado = document.querySelector('input[name="tipo_evento"]:checked');
            if (!tipoEventoSeleccionado) {
                alert("Seleccione un tipo de evento");
                return;
            }
            
            const fechaEvento = document.querySelector('input[type="date"]').value;
            const descripcion = textareaDesc.value.trim();

            if (!fechaEvento || !descripcion) {
                alert("Completa todos los campos");
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = "Guardando...";

            fetch(`/api/modulos/${colmenaId}/mantenimiento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_evento: tipoEventoSeleccionado.value,
                    fecha: fechaEvento,
                    descripcion: descripcion
                })
            })
            .then(res => {
                if(!res.ok) throw new Error("Error al guardar");
                return res.json();
            })
            .then(() => {
                alert('Mantenimiento guardado correctamente');
                formMantenimiento.reset();
                actualizarContador();
                cargarDatos(); // Reload history and module data
            })
            .catch(err => {
                console.error(err);
                alert("Hubo un error al guardar");
            })
            .finally(() => {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Guardar evento";
            });
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if(confirm('¿Estás seguro de que quieres cancelar y perder los cambios?')) {
                window.history.back();
            }
        });
    }
});