package com.sam.controladores;

import io.javalin.http.Context;
import java.util.Map;

public class UmbralesControlador {
    
    public static void guardarUmbrales(Context ctx) {
        try {
            Map payload = ctx.bodyAsClass(Map.class);
            System.out.println("Nuevos umbrales recibidos: " + payload);
            
            // TODO: Agregar consulta SQL (UPDATE APIARIO_UMBRALES SET temp_min=?, temp_max=? ...)
            // usando com.sam.Conexion.conectar()
            
            ctx.status(200).json("{\"mensaje\": \"Umbrales guardados correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al guardar los umbrales\"}");
        }
    }
}
