document.getElementById('form-login').addEventListener('submit',async (evento)=> {
    evento.preventDefault();

    const correo=document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    try{
        const respuesta = await fetch('/api/auth/login',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: correo,
                password: contrasena
            })
        });
        const datos = await respuesta.json();
        if(respuesta.ok){
            // Redirigir al dashboard según el rol
            if (datos.rol === 'admin') {
                window.location.href = "/frontend/admin/dashboardGlobal.html?login=success";
            } else if (datos.rol === 'apicultor') {
                window.location.href = "/frontend/apicultor/dashboardGlobal.html?login=success";
            } else {
                window.location.href = "/frontend/admin/dashboardGlobal.html?login=success";
            }
        }else{
            mostrarToastError();
        }
    }catch(error){
        console.error("Error en la conexión: ", error);
        mostrarToastError();
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