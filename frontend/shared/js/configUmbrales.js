document.addEventListener('DOMContentLoaded', () => {

    // Referencia al botón de guardar
    const btnGuardar = document.getElementById('btn-guardar-umbrales');

    // Función para recolectar datos de la tabla cuando quieras enviarlos a la BD
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            // Ejemplo de recolección de datos
            const umbrales = [];
            const filas = document.querySelectorAll('#tabla-umbrales-body tr');

            filas.forEach(fila => {
                const variable = fila.querySelector('.text-variable').innerText;
                const inputs = fila.querySelectorAll('.input-umbral');
                
                // Creamos un objeto con los datos de la fila
                const datosFila = {
                    variable: variable,
                    min: inputs[0].value,
                    max: inputs[1].value,
                    tasa: inputs[2].value
                };
                
                umbrales.push(datosFila);
            });

            console.log("Datos listos para enviar al backend:", umbrales);
            
            // Visual feedback
            const originalText = btnGuardar.innerText;
            btnGuardar.innerText = '¡Guardado!';
            btnGuardar.style.backgroundColor = 'var(--color-alert-green)';
            setTimeout(() => {
                btnGuardar.innerText = originalText;
                btnGuardar.style.backgroundColor = '';
            }, 2000);
            
            /*
            // Aquí iría tu fetch a Javalin
            fetch('/api/umbrales/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(umbrales)
            }).then(response => {
                // Manejar éxito
            });
            */
        });
    }

});