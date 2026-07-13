document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GENERADOR DE CONTRASEÑA
    // ==========================================
    const btnGenerar = document.getElementById('btn-generar-pwd');
    const inputPassword = document.getElementById('input-password');

    // Función para crear una contraseña tipo "Bee-XXXXXX"
    function generarContrasena() {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let sufijo = '';
        for (let i = 0; i < 6; i++) {
            sufijo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return `Bee-${sufijo}`;
    }

    btnGenerar.addEventListener('click', () => {
        inputPassword.value = generarContrasena();
    });


    // ==========================================
    // 2. LÓGICA DE TARJETAS DE APIARIOS Y RESUMEN
    // ==========================================
    const checkboxCards = document.querySelectorAll('.checkbox-card');
    const textoResumen = document.getElementById('resumen-texto');

    // Función que calcula el total de apiarios y colmenas seleccionadas
    function actualizarResumen() {
        let apiariosSeleccionados = 0;
        let totalColmenas = 0;

        checkboxCards.forEach(card => {
            const input = card.querySelector('input[type="checkbox"]');
            if (input.checked) {
                apiariosSeleccionados++;
                // Obtenemos el número de colmenas desde el atributo data-colmenas del HTML
                totalColmenas += parseInt(input.getAttribute('data-colmenas'));
            }
        });

        // Modificamos el texto según los totales
        if (apiariosSeleccionados === 0) {
            textoResumen.textContent = "0 apiarios seleccionados · 0 colmenas";
        } else {
            const palabraApiario = apiariosSeleccionados === 1 ? 'apiario seleccionado' : 'apiarios seleccionados';
            textoResumen.textContent = `${apiariosSeleccionados} ${palabraApiario} · ${totalColmenas} colmenas`;
        }
    }

    // Inicializar el clic en cada tarjeta
    checkboxCards.forEach(card => {
        const input = card.querySelector('input[type="checkbox"]');
        
        card.addEventListener('click', (e) => {
            // Prevenir doble ejecución si se hace clic en el input real
            if (e.target !== input) {
                input.checked = !input.checked;
            }

            // Cambiar clase visual
            if (input.checked) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }

            // Llamar a actualizar los totales
            actualizarResumen();
        });
    });

    // Asegurarse de que el resumen arranque con los valores iniciales correctos
    actualizarResumen();

    // ==========================================
    // 3. ENVÍO DEL FORMULARIO (Ejemplo para Javalin)
    // ==========================================
    const formNuevoApicultor = document.getElementById('form-nuevo-apicultor');

    formNuevoApicultor.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que se recargue la página

        alert('Formulario listo para enviar. Revisa la consola para ver los datos.');
        // Aquí puedes capturar los datos y hacer tu fetch('url', { method: 'POST'... }) hacia Javalin.
    });

});