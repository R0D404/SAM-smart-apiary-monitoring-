/**
 * configUmbrales.js — Manejo de umbrales con persistencia en localStorage
 * y notificaciones toast al guardar.
 */
document.addEventListener('DOMContentLoaded', () => {
    const btnGuardar = document.getElementById('btn-guardar-umbrales');
    const STORAGE_KEY = 'sam_umbrales';

    // ── Cargar valores guardados desde localStorage ──
    function cargarUmbralesGuardados() {
        try {
            const guardados = localStorage.getItem(STORAGE_KEY);
            if (!guardados) return;

            const valores = JSON.parse(guardados);
            const inputs = document.querySelectorAll('.input-umbral');

            inputs.forEach((input, index) => {
                if (valores[index] !== undefined && valores[index] !== null) {
                    input.value = valores[index];
                }
            });
        } catch (e) {
            console.warn('No se pudieron cargar los umbrales guardados:', e);
        }
    }

    // ── Guardar valores en localStorage ──
    function guardarUmbrales() {
        const inputs = document.querySelectorAll('.input-umbral');
        const valores = [];

        inputs.forEach(input => {
            valores.push(input.value.trim());
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
    }

    // Cargar al inicio
    cargarUmbralesGuardados();

    // ── Evento del botón Guardar ──
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.input-umbral');
            let allValid = true;

            inputs.forEach(input => {
                const val = input.value.trim();
                if (val === "" || isNaN(Number(val))) {
                    allValid = false;
                    input.style.borderColor = "#F44336";
                } else {
                    input.style.borderColor = "";
                }
            });

            if (allValid) {
                // Guardar en localStorage
                guardarUmbrales();

                // Mostrar toast de éxito
                if (typeof showSuccessToast === 'function') {
                    showSuccessToast(
                        "¡Umbrales Guardados!", 
                        "Los límites normales se actualizaron correctamente para este apiario."
                    );
                } else {
                    alert("¡Umbrales guardados correctamente!");
                }
            } else {
                if (typeof showErrorToast === 'function') {
                    showErrorToast(
                        "Error de Validación", 
                        "Por favor, introduce únicamente valores numéricos válidos en los campos de umbrales."
                    );
                } else {
                    alert("Error: introduce únicamente valores numéricos válidos.");
                }
            }
        });
    }
});