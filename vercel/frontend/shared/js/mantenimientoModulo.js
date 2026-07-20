document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. CONTADOR DE CARACTERES DEL TEXTAREA
    // ==========================================
    const textareaDesc = document.getElementById('desc-mantenimiento');
    const charCounter = document.getElementById('char-count');
    const maxLength = textareaDesc.getAttribute('maxlength'); // Debe ser 500

    // Función para actualizar el texto del contador
    function actualizarContador() {
        const currentLength = textareaDesc.value.length;
        charCounter.textContent = `${currentLength} / ${maxLength}`;
    }

    // Escuchar el evento 'input' para que se actualice cada vez que se teclea
    textareaDesc.addEventListener('input', actualizarContador);

    // Llamar la función al inicio por si el textarea ya tiene texto (como en este caso)
    actualizarContador();


    // ==========================================
    // 2. LÓGICA DE ENVÍO DE FORMULARIO
    // ==========================================
    const formMantenimiento = document.getElementById('form-mantenimiento');
    const btnCancelar = document.querySelector('.btn-outline-cancel');

    // Manejar el submit
    formMantenimiento.addEventListener('submit', (e) => {
        e.preventDefault();

        // Para recolectar el radio button seleccionado:
        const tipoEventoSeleccionado = document.querySelector('input[name="tipo_evento"]:checked').value;
        const moduloSeleccionado = document.querySelector('select[name="modulo_id"]').value;
        const fechaEvento = document.querySelector('input[type="date"]').value;
        const descripcion = textareaDesc.value;

        console.log("--- Datos del Evento de Mantenimiento ---");
        console.log("Módulo:", moduloSeleccionado);
        console.log("Tipo:", tipoEventoSeleccionado);
        console.log("Fecha:", fechaEvento);
        console.log("Descripción:", descripcion);

        alert('Evento de mantenimiento guardado correctamente. Revisa la consola para más detalles.');
        
        // Aquí agregarías tu código fetch para enviar al backend (Javalin)
    });

    // Manejar el cancelar
    btnCancelar.addEventListener('click', () => {
        // Podrías redirigir a la vista de colmenas o simplemente resetear el formulario
        if(confirm('¿Estás seguro de que quieres cancelar y perder los cambios?')) {
            formMantenimiento.reset();
            actualizarContador(); // Actualizar contador tras limpiar
        }
    });

});