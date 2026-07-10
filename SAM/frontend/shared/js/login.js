document.getElementById('form-login').addEventListener('submit',async (evento)=> {
    evento.preventDefault();

    const correo=document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    try{
        const respuesta = await fetch('/api/login',{
            method: 'POST',
            headers: {
                'Content-Type': 'aplication/json'
            },
            body: JSON.stringify({correo,contrasena})
        });
        const datos = await respuesta.json();
        if(respuesta.ok){
            mensajeDiv.style.color = "green";
            mensajeDiv.textContent = datos.mensaje;
        }else{
            mensajeDiv.style.color = "red";
            mensajeDiv.textContent = datos.mensaje;
        }
    }catch(error){
        console.error("Error  en la conexión: ",error);
        mensajeDiv.style.color="red";
        mensajeDiv.textContent = "Error al conectar con el servidor";
    }
});