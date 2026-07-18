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
                // Disable button and show loading text
                const originalText = btnGuardar.textContent;
                btnGuardar.textContent = 'Guardando...';
                btnGuardar.disabled = true;

                // Simulate network request delay
                setTimeout(() => {
                    // Simulate network failure as backend is down
                    showErrorToast(
                        "Error de conexión al servidor", 
                        "El backend no está disponible en este momento."
                    );
                    
                    // Reset button
                    btnGuardar.textContent = originalText;
                    btnGuardar.disabled = false;
                }, 1500);
            } else {
                showErrorToast(
                    "Error de Validación", 
                    "Por favor, introduce únicamente valores numéricos válidos en los campos de umbrales."
                );
            }
        });
    }
});