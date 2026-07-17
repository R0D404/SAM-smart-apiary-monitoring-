document.addEventListener('DOMContentLoaded', () => {
    // Generar contraseña aleatoria
    const btnGenerar = document.getElementById('btn-generar-pwd');
    const inputPassword = document.getElementById('input-password');

    if (btnGenerar && inputPassword) {
        btnGenerar.addEventListener('click', () => {
            const length = 10;
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
            let retVal = "";
            for (let i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            inputPassword.value = "Bee-" + retVal;
        });
    }

    // Manejo de checkboxes (Apiarios asignados)
    const checkboxCards = document.querySelectorAll('.checkbox-card');
    const resumenTexto = document.getElementById('resumen-texto');

    function actualizarResumen() {
        let seleccionados = 0;
        let colmenasTotales = 0;

        checkboxCards.forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                card.classList.add('active');
                seleccionados++;
                colmenasTotales += parseInt(checkbox.dataset.colmenas || 0);
            } else {
                card.classList.remove('active');
            }
        });

        if (resumenTexto) {
            resumenTexto.textContent = `${seleccionados} apiario${seleccionados !== 1 ? 's' : ''} seleccionado${seleccionados !== 1 ? 's' : ''} · ${colmenasTotales} colmena${colmenasTotales !== 1 ? 's' : ''}`;
        }
    }

    checkboxCards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', actualizarResumen);
    });

    // Form submit
    const formNuevo = document.getElementById('form-nuevo-apicultor');
    if (formNuevo) {
        formNuevo.addEventListener('submit', (e) => {
            e.preventDefault();

            const payload = {
                nombre: document.getElementById('input-nombre').value,
                email: document.getElementById('input-email').value,
                password: document.getElementById('input-password').value,
                rol_id: 2 // Apicultor
            };

            fetch('/api/gestion/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("No se pudo crear el apicultor. Comprueba si el usuario o correo ya existen.");
            })
            .then(() => {
                showSuccessToast("¡Éxito!", "Cuenta de apicultor creada e invitada correctamente.");
                formNuevo.reset();
                actualizarResumen();
            })
            .catch(err => {
                showErrorToast("Error de Registro", err.message);
            });
        });
    }
});