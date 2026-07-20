package com.sam.controladores;

import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.util.Map;

public class PerfilControlador {
    
    public static void actualizarPerfil(Context ctx) {
        try {
            Map payload = ctx.bodyAsClass(Map.class);
            System.out.println("Actualizando perfil con datos: " + payload);
            
            // TODO: Agregar consulta SQL (UPDATE USUARIO SET nombre=?, email=?, password_hash=? WHERE email=?)
            // usando com.sam.Conexion.conectar()
            
            ctx.status(200).json("{\"mensaje\": \"Perfil actualizado correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al actualizar el perfil\"}");
        }
    }

    public static void subirFoto(Context ctx) {
        try {
            UploadedFile foto = ctx.uploadedFile("foto");
            if (foto != null) {
                System.out.println("Foto recibida: " + foto.filename());
                
                // TODO: Guardar archivo en sistema de archivos local o bucket y actualizar BD
                
                ctx.status(200).json("{\"mensaje\": \"Foto de perfil actualizada\"}");
            } else {
                ctx.status(400).json("{\"mensaje\": \"No se recibió ninguna foto\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error al procesar la foto\"}");
        }
    }
}
