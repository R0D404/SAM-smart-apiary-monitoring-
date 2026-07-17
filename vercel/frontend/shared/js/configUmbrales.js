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
                showSuccessToast(
                    "¡Umbrales Guardados!", 
                    "Los límites normales se actualizaron correctamente para este apiario."
                );
            } else {
                showErrorToast(
                    "Error de Validación", 
                    "Por favor, introduce únicamente valores numéricos válidos en los campos de umbrales."
                );
            }
        });
    }
});