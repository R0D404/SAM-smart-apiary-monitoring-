document.addEventListener('DOMContentLoaded', () => {
    const btnGuardar = document.getElementById('btn-guardar-umbrales');

    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.input-umbral');
            let allValid = true;

            inputs.forEach(input => {
                const val = input.value.trim();
                // Validate if it is a number (allow decimal/negatives). Allow empty strings for NULLs.
                if (val !== "" && isNaN(Number(val))) {
                    allValid = false;
                    input.style.borderColor = "#F44336"; // Mark red border
                } else {
                    input.style.borderColor = ""; // Clear styling
                }
            });

            if (allValid) {
                const originalText = btnGuardar.textContent;
                btnGuardar.textContent = 'Guardando...';
                btnGuardar.disabled = true;

                // Build payload from inputs
                const payload = {};
                inputs.forEach(input => {
                    const val = input.value.trim();
                    payload[input.id] = val === "" ? null : parseFloat(val);
                });

                fetch('/api/umbrales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => {
                    if (!res.ok) throw new Error('Error al guardar');
                    showSuccessToast(
                        "¡Umbrales Guardados!", 
                        "Los límites normales se actualizaron correctamente para este apiario."
                    );
                })
                .catch(err => {
                    console.error(err);
                    showErrorToast(
                        "Error de conexión al servidor", 
                        "El backend no está disponible en este momento."
                    );
                })
                .finally(() => {
                    btnGuardar.textContent = originalText;
                    btnGuardar.disabled = false;
                });

            } else {
                showErrorToast(
                    "Error de Validación", 
                    "Por favor, introduce únicamente valores numéricos válidos o deja el campo vacío en los campos de umbrales."
                );
            }
        });
    }

    // Cargar umbrales actuales desde el backend
    fetch('/api/umbrales')
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("No hay umbrales");
        })
        .then(data => {
            if(data) {
                for (const [key, value] of Object.entries(data)) {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = (value === null || value === undefined) ? "" : value;
                    }
                }
            }
        })
        .catch(err => console.log("Cargando umbrales predeterminados o sin guardar."));

});