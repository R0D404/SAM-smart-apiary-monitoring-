/**
 * mobileNav.js — Inyecta dinámicamente la barra de navegación móvil inferior.
 * Se incluye en TODAS las páginas para garantizar navegación en móvil.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Si ya existe una nav móvil hardcodeada, la eliminamos para evitar duplicados
    const existingNav = document.querySelector(".mobile-nav");
    if (existingNav) existingNav.remove();

    // Detectar rol actual por la URL
    const path = window.location.pathname;
    const isAdmin = path.includes("/admin/");

    // Detectar la página activa
    const currentPage = path.split("/").pop().replace(".html", "");

    // Definir los items de navegación según el rol
    const navItemsApicultor = [
        { href: "dashboardGlobal.html", icon: "dashboard.svg", label: "Dashboard", pages: ["dashboardGlobal", "dashboardApiario", "dashboardColmena"] },
        { href: "misApiarios.html",     icon: "apiarios.svg",  label: "Apiarios",  pages: ["misApiarios", "gestionApiarios"] },
        { href: "colmenas.html",        icon: "colmenas.svg",  label: "Colmenas",  pages: ["colmenas"] },
        { href: "alertas.html",         icon: "alertas.svg",   label: "Alertas",   pages: ["alertas", "configUmbrales"] },
        { href: "registrarVisita.html", icon: "visitas.svg",   label: "Visitas",   pages: ["registrarVisita"] },
        { href: "historial.html",       icon: "historial.svg", label: "Historial", pages: ["historial", "historialCosechas"] },
    ];

    const navItemsAdmin = [
        { href: "dashboardGlobal.html", icon: "dashboard.svg", label: "Dashboard", pages: ["dashboardGlobal", "dashboardApiario", "dashboardColmena"] },
        { href: "gestionApiarios.html", icon: "apiarios.svg",  label: "Apiarios",  pages: ["gestionApiarios"] },
        { href: "gestionColmenas.html", icon: "colmenas.svg",  label: "Colmenas",  pages: ["gestionColmenas"] },
        { href: "alertas.html",         icon: "alertas.svg",   label: "Alertas",   pages: ["alertas", "configUmbrales"] },
        { href: "historialVisita.html", icon: "visitas.svg",   label: "Visitas",   pages: ["historialVisita", "historialCosechas"] },
        { href: "historial.html",       icon: "historial.svg", label: "Historial", pages: ["historial"] },
        { href: "gestionUsuarios.html", icon: "usuarios.svg",  label: "Usuarios",  pages: ["gestionUsuarios", "crearUsuario"] },
    ];

    const navItems = isAdmin ? navItemsAdmin : navItemsApicultor;

    // Crear el elemento nav
    const nav = document.createElement("nav");
    nav.className = "mobile-nav";
    nav.setAttribute("aria-label", "Navegación móvil");

    navItems.forEach(item => {
        const a = document.createElement("a");
        a.href = item.href;
        a.className = "mobile-nav-item";

        // Marcar como activo si la página actual coincide
        if (item.pages.includes(currentPage)) {
            a.classList.add("active");
        }

        a.innerHTML = `
            <img src="../assets/icons/${item.icon}" alt="" class="mobile-nav-icon">
            <span>${item.label}</span>
        `;
        nav.appendChild(a);
    });

    // Insertar en el body (o dentro del .app-shell si existe)
    const appShell = document.querySelector(".app-shell");
    if (appShell) {
        appShell.appendChild(nav);
    } else {
        document.body.appendChild(nav);
    }
});
