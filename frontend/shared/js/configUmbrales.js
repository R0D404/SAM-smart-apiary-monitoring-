document.addEventListener('DOMContentLoaded', () => {
    const btnGuardar = document.getElementById('btn-guardar-umbrales');

    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.input-umbral');
            let allValid = true;

            inputs.forEach(input => {
                const val = input.value.trim();
                // Validate if it is a number (allow decimal/negatives)
                if (val === "" || isNaN(Number(val))) {
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
                    payload[input.id] = parseFloat(input.value.trim());
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
                    "Por favor, introduce únicamente valores numéricos válidos en los campos de umbrales."
                );
            }
        });
    }
});