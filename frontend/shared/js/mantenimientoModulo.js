document.addEventListener('DOMContentLoaded', () => {

    // Leer el colmenaId desde los query params (enviado desde dashboardColmena.html)
    const params = new URLSearchParams(window.location.search);
    const colmenaId = params.get('colmenaId') || '';

    // ==========================================
    // 1. CARGAR DATOS DESDE EL BACKEND
    // ==========================================
    async function cargarDatos() {
        try {
            const url = colmenaId
                ? `/api/mantenimiento?colmenaId=${encodeURIComponent(colmenaId)}`
                : '/api/mantenimiento';

            const res = await fetch(url);
            if (!res.ok) throw new Error('Error al cargar datos');
            const data = await res.json();

            // Poblar selector de colmenas
            const selectModulo = document.getElementById('select-colmena');
            if (selectModulo && data.colmenas) {
                selectModulo.innerHTML = '';
                data.colmenas.forEach(col => {
                    const opt = document.createElement('option');
                    opt.value = col.id;
                    opt.textContent = `${col.codigo} · ${col.apiario}`;
                    if (String(col.id) === String(colmenaId)) opt.selected = true;
                    selectModulo.appendChild(opt);
                });
            }

            // Llenar datos del módulo en la tarjeta lateral
            actualizarTarjetaModulo(data.modulo);

            // Llenar historial
            renderHistorial(data.eventos || []);

        } catch (err) {
            console.error('Error cargando datos de mantenimiento:', err);
        }
    }

    // ==========================================
    // 2. ACTUALIZAR TARJETA LATERAL DE MÓDULO
    // ==========================================
    function actualizarTarjetaModulo(modulo) {
        if (!modulo) return;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('mod-identificador', modulo.identificador || '—');
        set('mod-tipo', modulo.tipo || '—');
        set('mod-estado', (modulo.estado || 'inactivo').toUpperCase());
        set('mod-instalado', modulo.fecha_instalacion || '—');
        set('mod-eventos', modulo.total_eventos ?? '0');

        const estadoEl = document.getElementById('mod-estado');
        if (estadoEl) {
            estadoEl.className = 'status-pill';
            estadoEl.classList.add((modulo.estado || '') === 'activo' ? 'status-activo' : 'status-inactivo');
        }
    }

    // ==========================================
    // 3. RENDERIZAR HISTORIAL DE EVENTOS
    // ==========================================
    const TIPO_COLOR = {
        limpieza: 'dot-yellow',
        recalibracion: 'dot-teal',
        reemplazo: 'dot-rojo',
        revision: 'dot-teal',
        fallo: 'dot-rojo',
        instalacion: 'dot-yellow',
    };

    function renderHistorial(eventos) {
        const timeline = document.getElementById('timeline-container');
        if (!timeline) return;

        if (!eventos.length) {
            timeline.innerHTML = '<p style="color:var(--color-text-gray);font-size:.85rem;">Sin eventos registrados aún.</p>';
            return;
        }

        timeline.innerHTML = eventos.map(ev => {
            const tipo = (ev.tipo_evento || '').toLowerCase();
            const dotClass = TIPO_COLOR[tipo] || 'dot-yellow';
            const tipoLabel = ev.tipo_evento
                ? ev.tipo_evento.charAt(0).toUpperCase() + ev.tipo_evento.slice(1)
                : '—';
            return `
            <div class="timeline-item">
                <div class="timeline-dot ${dotClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-title">${tipoLabel}</span>
                        <span class="timeline-date">${ev.fecha || ''}</span>
                    </div>
                    <p class="timeline-text">${ev.descripcion || ''}</p>
                </div>
            </div>`;
        }).join('');
    }

    // ==========================================
    // 4. CONTADOR DE CARACTERES DEL TEXTAREA
    // ==========================================
    const textareaDesc = document.getElementById('desc-mantenimiento');
    const charCounter = document.getElementById('char-count');
    if (textareaDesc && charCounter) {
        const maxLength = textareaDesc.getAttribute('maxlength') || 500;
        function actualizarContador() {
            charCounter.textContent = `${textareaDesc.value.length} / ${maxLength}`;
        }
        textareaDesc.addEventListener('input', actualizarContador);
        actualizarContador();
    }

    // ==========================================
    // 5. SUBMIT DEL FORMULARIO → BACKEND
    // ==========================================
    const formMantenimiento = document.getElementById('form-mantenimiento');
    if (formMantenimiento) {
        formMantenimiento.addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectColmena = document.getElementById('select-colmena');
            const tipoEvento = document.querySelector('input[name="tipo_evento"]:checked');
            const fechaInput = document.querySelector('input[type="date"]');

            if (!selectColmena || !selectColmena.value || !tipoEvento || !fechaInput?.value) {
                mostrarToast('Por favor completa todos los campos requeridos.', 'error');
                return;
            }

            const payload = {
                colmena_id: parseInt(selectColmena.value),
                tipo_evento: tipoEvento.value,
                fecha: fechaInput.value,
                descripcion: textareaDesc ? textareaDesc.value : ''
            };

            try {
                const res = await fetch('/api/mantenimiento', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Error del servidor');

                mostrarToast('Evento de mantenimiento guardado correctamente.', 'success');
                formMantenimiento.reset();
                if (textareaDesc && charCounter) {
                    const maxLength = textareaDesc.getAttribute('maxlength') || 500;
                    charCounter.textContent = `0 / ${maxLength}`;
                }
                // Recargar historial
                await cargarDatos();

            } catch (err) {
                console.error(err);
                mostrarToast('Error al guardar el evento. Inténtalo nuevamente.', 'error');
            }
        });
    }

    // ==========================================
    // 6. CANCELAR → CONFIRMAR Y RESET
    // ==========================================
    const btnCancelar = document.querySelector('.btn-outline-cancel');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cancelar?')) {
                if (formMantenimiento) formMantenimiento.reset();
                if (textareaDesc && charCounter) {
                    const maxLength = textareaDesc.getAttribute('maxlength') || 500;
                    charCounter.textContent = `0 / ${maxLength}`;
                }
            }
        });
    }

    // ==========================================
    // 7. BOTÓN VOLVER A COLMENAS
    // ==========================================
    const btnVolver = document.getElementById('btn-volver-colmenas');
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.history.back();
        });
    }

    // ==========================================
    // 8. HELPER: TOAST NOTIFICATION
    // ==========================================
    function mostrarToast(mensaje, tipo = 'success') {
        let toast = document.getElementById('toast-mantenimiento');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-mantenimiento';
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

    // Iniciar carga
    cargarDatos();
});