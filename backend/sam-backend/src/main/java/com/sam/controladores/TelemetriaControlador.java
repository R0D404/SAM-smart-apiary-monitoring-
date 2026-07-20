package com.sam.controladores;

import io.javalin.http.Context;
import java.util.Map;

public class TelemetriaControlador {
    
    // Cargar token desde .env de forma segura sin causar crasheos si no existe
    private static String EXPECTED_TOKEN = "SAM_SECURE_TOKEN_2026"; // Fallback por defecto
    static {
        try {
            io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure().ignoreIfMissing().load();
            if (dotenv.get("ESP32_SECRET_TOKEN") != null) {
                EXPECTED_TOKEN = dotenv.get("ESP32_SECRET_TOKEN");
            }
        } catch (Exception e) {
            System.out.println("No se pudo cargar ESP32_SECRET_TOKEN desde .env, usando fallback.");
        }
    }

    public static void recibirDatos(Context ctx) {
        // Validar token de seguridad de hardware
        String clientToken = ctx.header("X-ESP32-TOKEN");
        if (clientToken == null || !clientToken.equals(EXPECTED_TOKEN)) {
            ctx.status(401).json("{\"mensaje\": \"Acceso denegado: Token de hardware inválido\"}");
            return;
        }

        try {
            Map payload = ctx.bodyAsClass(Map.class);
            System.out.println("Telemetría recibida del ESP32: " + payload);
            
            // TODO: Agregar consulta SQL (INSERT INTO LECTURA_SENSOR ...)
            // usando com.sam.Conexion.conectar() para guardar:
            // - humedad_interna
            // - humedad_externa
            // - temperatura_interna
            // - temperatura_externa
            // - peso
            // Relacionándolos con el modulo_id recibido.
            
            // Responde con HTTP 201 (Created) como espera tu ESP32
            ctx.status(201).json("{\"mensaje\": \"Datos recibidos correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al procesar los datos\"}");
        }
    }
}
