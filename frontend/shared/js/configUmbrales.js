document.addEventListener('DOMContentLoaded', () => {

    // Referencia al botón de guardar
    const btnGuardar = document.querySelector('.btn-primary');

    // Función para recolectar datos de la tabla cuando quieras enviarlos a la BD
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
        
        /*
        // Aquí iría tu fetch a Javalin
        fetch('/api/umbrales/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(umbrales)
        }).then(response => {
            // Manejar éxito
            alert("Cambios guardados con éxito");
        });
        */
    });

});