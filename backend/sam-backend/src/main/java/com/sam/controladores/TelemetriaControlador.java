package com.sam.controladores;

import io.javalin.http.Context;
import java.util.Map;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

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
            
            String identificador = String.valueOf(payload.get("identificador"));
            if (identificador == null || "null".equals(identificador)) {
                identificador = String.valueOf(payload.get("modulo_id"));
            }

            try (Connection conn = com.sam.Conexion.conectar()) {
                if (conn == null) throw new Exception("Error de conexión");
                
                int moduloId = -1;
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM MODULO_MONITOREO WHERE identificador = ? OR id = ? LIMIT 1")) {
                    stmt.setString(1, identificador);
                    try {
                        stmt.setInt(2, Integer.parseInt(identificador));
                    } catch (NumberFormatException e) {
                        stmt.setInt(2, -1);
                    }
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            moduloId = rs.getInt("id");
                        }
                    }
                }
                
                if (moduloId != -1) {
                    String insertSql = "INSERT INTO LECTURA_SENSOR (modulo_id, tipo_sensor, origen, valor, timestamp_dispositivo) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
                    try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                        if (payload.containsKey("peso")) {
                            stmt.setInt(1, moduloId); stmt.setString(2, "peso"); stmt.setString(3, "interna"); stmt.setDouble(4, Double.parseDouble(String.valueOf(payload.get("peso")))); stmt.addBatch();
                        }
                        if (payload.containsKey("temperatura_interna")) {
                            stmt.setInt(1, moduloId); stmt.setString(2, "temp"); stmt.setString(3, "interna"); stmt.setDouble(4, Double.parseDouble(String.valueOf(payload.get("temperatura_interna")))); stmt.addBatch();
                        }
                        if (payload.containsKey("humedad_interna")) {
                            stmt.setInt(1, moduloId); stmt.setString(2, "humedad"); stmt.setString(3, "interna"); stmt.setDouble(4, Double.parseDouble(String.valueOf(payload.get("humedad_interna")))); stmt.addBatch();
                        }
                        if (payload.containsKey("temperatura_externa")) {
                            stmt.setInt(1, moduloId); stmt.setString(2, "temp"); stmt.setString(3, "externa"); stmt.setDouble(4, Double.parseDouble(String.valueOf(payload.get("temperatura_externa")))); stmt.addBatch();
                        }
                        if (payload.containsKey("humedad_externa")) {
                            stmt.setInt(1, moduloId); stmt.setString(2, "humedad"); stmt.setString(3, "externa"); stmt.setDouble(4, Double.parseDouble(String.valueOf(payload.get("humedad_externa")))); stmt.addBatch();
                        }
                        stmt.executeBatch();
                    }
                } else {
                    System.out.println("Módulo no encontrado: " + identificador);
                }
            }
            
            // Responde con HTTP 201 (Created) como espera tu ESP32
            ctx.status(201).json("{\"mensaje\": \"Datos recibidos correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al procesar los datos\"}");
        }
    }
}
