document.getElementById('form-login').addEventListener('submit',async (evento)=> {
    evento.preventDefault();

    const correo=document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    if (correo === "admin@sam.com" && contrasena === "1234") {
        window.location.href = "./frontend/admin/dashboardGlobal.html?login=success";
        return;
    } else if (correo === "apicultor@sam.com" && contrasena === "1234") {
        window.location.href = "./frontend/apicultor/dashboardGlobal.html?login=success";
        return;
    } else {
        mostrarToastError();
        return;
    }
});

// Función para mostrar el toast de error y ocultarlo después de 3 segundos
function mostrarToastError() {
    const toast = document.getElementById('toast-container');
    toast.classList.remove('hidden');
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}