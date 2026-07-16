document.addEventListener("DOMContentLoaded", () => {
    const userAvatarEl = document.getElementById("sidebar-user-avatar");
    const userNameEl = document.getElementById("sidebar-user-name");
    const userPhotoEl = document.getElementById("sidebar-user-photo");

    function renderUserProfile(user) {
        if (!user || !user.nombre) {
            if (userAvatarEl) userAvatarEl.textContent = "--";
            if (userNameEl)   userNameEl.textContent   = "---";
            if (userPhotoEl)  userPhotoEl.classList.remove("loaded");
            return;
        }

        const iniciales = user.nombre
            .split(" ")
            .filter(p => p.length > 0)
            .map(p => p[0].toUpperCase())
            .slice(0, 2)
            .join("");

        if (userAvatarEl) userAvatarEl.textContent = iniciales;
        if (userNameEl)   userNameEl.textContent   = user.nombre;

        if (userPhotoEl && user.fotoUrl) {
            userPhotoEl.onload = () => userPhotoEl.classList.add("loaded");
            userPhotoEl.onerror = () => userPhotoEl.classList.remove("loaded");
            userPhotoEl.src = user.fotoUrl;
        } else if (userPhotoEl) {
            userPhotoEl.classList.remove("loaded");
        }
    }

    // Cargar perfil del usuario actual
    fetch("/api/dashboard")
        .then(response => {
            if (!response.ok) throw new Error("No hay sesión activa");
            return response.json();
        })
        .then(data => {
            if (data.usuario) {
                renderUserProfile(data.usuario);
            }
        })
        .catch(error => {
            console.warn("No se pudo cargar el perfil del usuario (servidor apagado):", error);
            renderUserProfile(null);
        });

    // Redirección al hacer clic en los elementos de "Mi Cuenta" o perfil de usuario en la barra lateral
    document.addEventListener("click", (e) => {
        const target = e.target.closest("#btn-mi-cuenta, .user-account, .btn-mi-cuenta, .user-profile, .user-info-btn");
        if (target) {
            // Evitar conflictos con links <a>
            if (target.tagName === 'A' && target.getAttribute('href')) {
                return;
            }
            window.location.href = "miCuenta.html";
        }
    });
});
