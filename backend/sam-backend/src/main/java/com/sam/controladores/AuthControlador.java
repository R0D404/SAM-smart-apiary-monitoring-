package com.sam.controladores;

import io.javalin.http.Context;
import com.sam.modelos.Credenciales;

public class AuthControlador {

    public static void manejarLogin(Context ctx) {
        Credenciales credenciales = ctx.bodyAsClass(Credenciales.class);
        
        if ("admin@gmail.com".equals(credenciales.getUsername()) && "1234".equals(credenciales.getPassword())) {
            ctx.status(200).json("{\"mensaje\": \"Login exitoso\"}");
        } else {
            ctx.status(401).json("{\"mensaje\": \"Credenciales inválidas\"}");
        }
    }
}
