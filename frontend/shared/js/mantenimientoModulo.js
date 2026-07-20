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
                if (bcModulo) bcModulo.textContent = 'Módulo ' + (data.identificador || '');

                // Populate sidebar card — Datos del módulo
                const elId = document.getElementById('modulo-id-text');
                if (elId) elId.textContent = data.identificador || '---';

                const elTipo = document.getElementById('modulo-tipo');
                if (elTipo) {
                    elTipo.textContent = data.tipo || '---';
                    elTipo.style.textTransform = 'capitalize';
                }

                const elEstado = document.getElementById('modulo-estado');
                if (elEstado) {
                    elEstado.style.display = 'inline-block';
                    elEstado.textContent = data.estado ? data.estado.toUpperCase() : '---';
                }

                const elInstalado = document.getElementById('modulo-instalado');
                if (elInstalado) elInstalado.textContent = data.instalado || '---';

                const elUltLectura = document.getElementById('modulo-ultima-lectura');
                if (elUltLectura) {
                    const ul = data.ultima_lectura;
                    elUltLectura.textContent = (ul && ul !== '---') ? ul.split(' ')[0] : '---';
                }

                const elEventos = document.getElementById('modulo-eventos-count');
                if (elEventos) elEventos.textContent = data.eventos !== undefined ? data.eventos : 0;

                // Populate Historial reciente
                const historyList = document.getElementById('timeline-historial');
                if (historyList) {
                    if (data.historial && data.historial.length > 0) {
                        historyList.innerHTML = data.historial.map(h =>
                            '<div style="margin-bottom: 12px; border-left: 2px solid var(--color-primary); padding-left: 12px;">' +
                                '<div style="font-size: 12px; color: var(--color-text-gray);">' + h.fecha + '</div>' +
                                '<div style="font-size: 14px; color: var(--color-text-white);">' + h.detalle + '</div>' +
                            '</div>'
                        ).join('');
                    } else {
                        historyList.innerHTML = '<p style="color: var(--color-text-gray); font-size: 14px; text-align: center; padding: 20px 0;">No hay historial reciente disponible.</p>';
                    }
                }
            })
            .catch(err => console.error('Error cargando módulo:', err));
    }

    // ==========================================
    // 1. CONTADOR DE CARACTERES DEL TEXTAREA
    // ==========================================
    const textareaDesc = document.getElementById('desc-mantenimiento');
    const charCounter = document.getElementById('char-count');
    const maxLength = textareaDesc ? (parseInt(textareaDesc.getAttribute('maxlength')) || 500) : 500;

    function actualizarContador() {
        if (!textareaDesc || !charCounter) return;
        const currentLength = textareaDesc.value.length;
        charCounter.textContent = currentLength + ' / ' + maxLength;
    }

    if (textareaDesc) {
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

            const inputFecha = document.querySelector('input[type="date"]');
            const fechaEvento = inputFecha ? inputFecha.value : '';
            const descripcion = textareaDesc ? textareaDesc.value.trim() : '';

            if (!fechaEvento || !descripcion) {
                alert("Completa todos los campos");
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = "Guardando...";

            fetch('/api/modulos/' + colmenaId + '/mantenimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_evento: tipoEventoSeleccionado.value,
                    fecha: fechaEvento,
                    descripcion: descripcion
                })
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al guardar");
                return res.json();
            })
            .then(() => {
                alert('Mantenimiento guardado correctamente');
                if (formMantenimiento) formMantenimiento.reset();
                actualizarContador();
                cargarDatos();
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
            if (confirm('¿Estás seguro de que quieres cancelar y perder los cambios?')) {
                window.history.back();
            }
        });
    }

    // Cargar datos al iniciar la página
    cargarDatos();
});