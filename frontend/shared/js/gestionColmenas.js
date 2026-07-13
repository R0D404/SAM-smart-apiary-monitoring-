document.addEventListener('DOMContentLoaded', () => {
            const btnAbrir = document.getElementById('btn-abrir-formulario');
            const btnCerrar = document.getElementById('btn-cerrar-formulario');
            const modal = document.getElementById('input-form');

            // Abrir el formulario
            btnAbrir.addEventListener('click', () => {
                modal.classList.add('activo');
            });

            // Cerrar el formulario desde la "X"
            btnCerrar.addEventListener('click', () => {
                modal.classList.remove('activo');
            });

            // (Opcional) Cerrar el formulario si el usuario hace clic fuera de la caja
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('activo');
                }
            });
        });