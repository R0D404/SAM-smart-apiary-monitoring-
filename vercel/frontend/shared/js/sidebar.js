document.addEventListener("DOMContentLoaded", () => {
    const userAvatarEl = document.getElementById("sidebar-user-avatar");
    const userNameEl = document.getElementById("sidebar-user-name");
    const userPhotoEl = document.getElementById("sidebar-user-photo");
    const headerAvatarEl = document.getElementById("header-user-avatar");

    function renderUserProfile(user) {
        if (!user || !user.nombre) {
            if (userAvatarEl) userAvatarEl.textContent = "--";
            if (userNameEl)   userNameEl.textContent   = "---";
            if (userPhotoEl)  userPhotoEl.classList.remove("loaded");
            if (headerAvatarEl) headerAvatarEl.textContent = "--";
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
        if (headerAvatarEl) headerAvatarEl.textContent = iniciales;

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
            
            // MOCK DATA PARA VERCEL
            let mockUser = {
                nombre: "Administrador SAM",
                email: "admin@sam.com"
            };
            if (window.location.pathname.includes('/apicultor/')) {
                mockUser = {
                    nombre: "Apicultor Invitado",
                    email: "apicultor@sam.com"
                };
            }
            renderUserProfile(mockUser);
        });

    // Event listeners para botones de "Mi Cuenta"
    const botonesMiCuenta = document.querySelectorAll(".user-account, #btn-mi-cuenta, .user-info-btn");
    botonesMiCuenta.forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = "miCuenta.html";
        });
    });
});
