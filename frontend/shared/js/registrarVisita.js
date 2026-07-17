document.addEventListener('DOMContentLoaded', () => {
    const selectColmena = document.getElementById('colmena');
    const inputFecha = document.getElementById('fecha');
    const inputEstado = document.getElementById('estado-colonia');
    const inputKg = document.getElementById('kg-cosechados');
    const inputCalidad = document.getElementById('calidad-miel');
    const checkboxReina = document.getElementById('reina-vista');
    const textareaNotas = document.getElementById('notas');
    const btnGuardar = document.getElementById('btn-guardar');

    // Elementos del resumen
    const resumenColmena = document.getElementById('resumen-colmena');
    const resumenApiario = document.getElementById('resumen-apiario');
    const resumenEstado = document.getElementById('resumen-estado');
    const resumenReina = document.getElementById('resumen-reina');
    const resumenCosechaKg = document.getElementById('resumen-cosecha-kg');
    const resumenCosechaCalidad = document.getElementById('resumen-cosecha-calidad');
    const estadoFormulario = document.getElementById('estado-formulario');

    // Por defecto, poner la fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (inputFecha) inputFecha.value = hoy;

    let colmenasMap = {};

    // Cargar colmenas
    fetch('/api/gestion/colmenas')
        .then(res => {
            if (!res.ok) throw new Error("Error cargando colmenas");
            return res.json();
        })
        .then(data => {
            if (selectColmena) {
                selectColmena.innerHTML = '<option value="">Selecciona una colmena</option>';
                data.forEach(col => {
                    const option = document.createElement('option');
                    option.value = col.db_id; // El ID de base de datos
                    option.textContent = `${col.id} (${col.apiario})`;
                    selectColmena.appendChild(option);
                    colmenasMap[col.db_id] = col;
                });
            }
        })
        .catch(err => {
            console.error(err);
            if (selectColmena) selectColmena.innerHTML = '<option value="">Error al cargar colmenas</option>';
        });

    // Actualizar resumen
    function actualizarResumen() {
        const colmenaId = selectColmena ? selectColmena.value : '';
        if (colmenaId && colmenasMap[colmenaId]) {
            const col = colmenasMap[colmenaId];
            if (resumenColmena) resumenColmena.textContent = `Colmena: ${col.id}`;
            if (resumenApiario) resumenApiario.textContent = `Apiario: ${col.apiario}`;
        } else {
            if (resumenColmena) resumenColmena.textContent = 'Colmena: —';
            if (resumenApiario) resumenApiario.textContent = 'Apiario: —';
        }

        const estado = (inputEstado && inputEstado.value) ? inputEstado.value : '—';
        const reina = (checkboxReina && checkboxReina.checked) ? 'Reina vista' : 'Reina no vista';
        if (resumenEstado) resumenEstado.textContent = `Estado: ${estado}`;
        if (resumenReina) resumenReina.textContent = reina;

        const kg = (inputKg && inputKg.value) ? inputKg.value : '0.0';
        const calidad = (inputCalidad && inputCalidad.value) ? inputCalidad.value : '—';
        if (resumenCosechaKg) resumenCosechaKg.textContent = `Cosecha: ${kg} kg`;
        if (resumenCosechaCalidad) resumenCosechaCalidad.textContent = calidad;

        // Cambiar el checkbox del estado en el resumen
        const checkEstado = document.getElementById('check-estado');
        if (checkEstado) {
            checkEstado.checked = (inputEstado && inputEstado.value) ? true : false;
        }

        const checkCosecha = document.getElementById('check-cosecha');
        if (checkCosecha) {
            checkCosecha.checked = parseFloat(kg) > 0 ? true : false;
        }

        // Estado del formulario
        if (estadoFormulario) {
            if (colmenaId && inputEstado && inputEstado.value) {
                estadoFormulario.textContent = 'Listo para guardar';
                estadoFormulario.style.color = '#22c55e'; // verde
            } else {
                estadoFormulario.textContent = 'Completa los datos';
                estadoFormulario.style.color = '#ef4444'; // rojo
            }
        }
    }

    if (selectColmena) selectColmena.addEventListener('change', actualizarResumen);
    if (inputEstado) inputEstado.addEventListener('input', actualizarResumen);
    if (checkboxReina) checkboxReina.addEventListener('change', actualizarResumen);
    if (inputKg) inputKg.addEventListener('input', actualizarResumen);
    if (inputCalidad) inputCalidad.addEventListener('input', actualizarResumen);

    // Guardar
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const colmenaId = selectColmena ? selectColmena.value : '';
            const fecha = inputFecha ? inputFecha.value : '';
            const estadoColonia = inputEstado ? inputEstado.value : '';
            const reinaVista = checkboxReina ? checkboxReina.checked : false;
            const notas = textareaNotas ? textareaNotas.value : '';
            const kgCosechados = (inputKg && inputKg.value) ? parseFloat(inputKg.value) : 0;
            const calidadMiel = inputCalidad ? inputCalidad.value : '';

            if (!colmenaId || !estadoColonia || !fecha) {
                mostrarToast('Por favor selecciona una colmena, ingresa el estado de la colonia y la fecha.', 'error');
                return;
            }

            const payload = {
                colmena_id: parseInt(colmenaId),
                fecha: fecha,
                estado_colonia: estadoColonia,
                reina_vista: reinaVista,
                notas: notas,
                kg_cosechados: kgCosechados,
                calidad_miel: calidadMiel
            };

            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';

            fetch('/api/visitas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al guardar la visita");
                return res.json();
            })
            .then(data => {
                mostrarToast('Visita registrada con éxito.', 'success');
                setTimeout(() => {
                    window.location.href = 'historial.html';
                }, 1500);
            })
            .catch(err => {
                console.error(err);
                mostrarToast('Error al guardar la visita. Inténtalo nuevamente.', 'error');
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar visita';
            });
        });
    }

    // Helper: Toast
    function mostrarToast(mensaje, tipo = 'success') {
        let toast = document.getElementById('toast-registro');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-registro';
            toast.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 9999;
                padding: 14px 20px; border-radius: 10px; font-size: .9rem;
                color: #fff; font-family: 'Inter', sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,.35);
                transition: opacity .3s ease;
            `;
            document.body.appendChild(toast);
        }
        toast.style.background = tipo === 'success' ? '#22c55e' : '#ef4444';
        toast.textContent = mensaje;
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
    }
});
