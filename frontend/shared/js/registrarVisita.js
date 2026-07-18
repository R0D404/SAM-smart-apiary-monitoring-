document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const selectColmena = document.getElementById('colmena');
    const inputFecha = document.getElementById('fecha');
    const inputEstado = document.getElementById('estado-colonia');
    const inputKg = document.getElementById('kg-cosechados');
    const inputCalidad = document.getElementById('calidad-miel');
    const checkReina = document.getElementById('reina-vista');
    const inputNotas = document.getElementById('notas');
    const btnGuardar = document.getElementById('btn-guardar');

    // Summary Elements
    const checkResumenColmena = document.getElementById('check-colmena');
    const txtResumenColmena = document.getElementById('resumen-colmena');
    const txtResumenApiario = document.getElementById('resumen-apiario');
    
    const checkResumenEstado = document.getElementById('check-estado');
    const txtResumenEstado = document.getElementById('resumen-estado');
    const txtResumenReina = document.getElementById('resumen-reina');
    
    const checkResumenCosecha = document.getElementById('check-cosecha');
    const txtResumenCosechaKg = document.getElementById('resumen-cosecha-kg');
    const txtResumenCosechaCal = document.getElementById('resumen-cosecha-calidad');
    
    const txtEstadoForm = document.getElementById('estado-formulario');

    // Set today's date by default
    if (inputFecha) {
        const today = new Date().toISOString().split('T')[0];
        inputFecha.value = today;
    }

    function updateSummary() {
        // No resumen card anymore, but we can still validate the date to enable/disable button if we wanted to
        // For now, we just leave this empty or minimal.
    }

    // Attach listeners
    const formInputs = [selectColmena, inputFecha, inputEstado, inputKg, inputCalidad, checkReina, inputNotas];
    formInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateSummary);
            input.addEventListener('change', updateSummary);
        }
    });

    // Helper for Toast Notifications
    function mostrarToast(mensaje, tipo = 'error') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-notification ${tipo}`;
        
        let iconSvg = '';
        if (tipo === 'success') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon-wrapper">
                ${iconSvg}
            </div>
            <div class="toast-content">
                <h4>${tipo === 'success' ? 'Éxito' : 'Error'}</h4>
                <p>${mensaje}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hidden');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // Save Button Action
    if (btnGuardar) {
        btnGuardar.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Validate Required Fields
            if (!selectColmena || !selectColmena.value) {
                mostrarToast('Por favor, selecciona una colmena.', 'error');
                selectColmena.focus();
                return;
            }
            if (!inputFecha || !inputFecha.value) {
                mostrarToast('Por favor, selecciona una fecha.', 'error');
                inputFecha.focus();
                return;
            }
            if (!inputEstado || inputEstado.value.trim() === '') {
                mostrarToast('Por favor, ingresa el estado de la colonia.', 'error');
                inputEstado.focus();
                return;
            }

            // All required fields filled -> Simulate Network Error since there is no backend
            btnGuardar.textContent = 'Guardando...';
            btnGuardar.disabled = true;

            setTimeout(() => {
                mostrarToast('Error de conexión al servidor (Backend no disponible)', 'error');
                btnGuardar.textContent = 'Guardar visita';
                btnGuardar.disabled = false;
            }, 1500);
        });
    }

    // Initialize summary
    updateSummary();
});
