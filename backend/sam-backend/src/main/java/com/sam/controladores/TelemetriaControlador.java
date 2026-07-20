package com.sam.controladores;

import io.javalin.http.Context;
import java.util.Map;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Calendar;

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

    private static void evaluarYAlertar(Connection conn, int apiarioId, int colmenaId, String umbralKey, double valor, String nombreMetrica) {
        try {
            int horaActual = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            int franja = (horaActual >= 6 && horaActual < 18) ? 1 : 2; // 1: Dia, 2: Noche

            String sql = "SELECT valor_min, valor_max FROM UMBRAL_CONFIG WHERE (apiario_id IS NULL OR apiario_id = ?) AND tipo_sensor = ? AND (franja_hora IS NULL OR franja_hora = 0 OR franja_hora = ?) ORDER BY apiario_id DESC LIMIT 1";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, apiarioId);
                stmt.setString(2, umbralKey);
                stmt.setInt(3, franja);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Object minObj = rs.getObject("valor_min");
                        Object maxObj = rs.getObject("valor_max");
                        Double min = minObj != null ? ((Number) minObj).doubleValue() : null;
                        Double max = maxObj != null ? ((Number) maxObj).doubleValue() : null;
                        
                        String mensaje = null;
                        if (min != null && valor < min) {
                            mensaje = "El valor de " + nombreMetrica + " (" + String.format("%.2f", valor) + ") ha caído por debajo del mínimo (" + min + ")";
                        } else if (max != null && valor > max) {
                            mensaje = "El valor de " + nombreMetrica + " (" + String.format("%.2f", valor) + ") ha superado el máximo (" + max + ")";
                        }
                        
                        if (mensaje != null) {
                            try (PreparedStatement insert = conn.prepareStatement("INSERT INTO ALERTA (colmena_id, tipo, nivel, mensaje, atendida) VALUES (?, 'umbral', 'critico', ?, false)")) {
                                insert.setInt(1, colmenaId);
                                insert.setString(2, mensaje);
                                insert.executeUpdate();
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
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
                int colmenaId = -1;
                int apiarioId = -1;
                
                try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT m.id, c.id as colmena_id, c.apiario_id " +
                    "FROM MODULO_MONITOREO m " +
                    "JOIN COLMENA c ON m.colmena_id = c.id " +
                    "WHERE m.identificador = ? OR m.id = ? LIMIT 1"
                )) {
                    stmt.setString(1, identificador);
                    try {
                        stmt.setInt(2, Integer.parseInt(identificador));
                    } catch (NumberFormatException e) {
                        stmt.setInt(2, -1);
                    }
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            moduloId = rs.getInt("id");
                            colmenaId = rs.getInt("colmena_id");
                            apiarioId = rs.getInt("apiario_id");
                        }
                    }
                }
                
                if (moduloId != -1) {
                    String insertSql = "INSERT INTO LECTURA_SENSOR (modulo_id, tipo_sensor, origen, valor, timestamp_dispositivo) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
                    try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                        if (payload.containsKey("peso")) {
                            double v = Double.parseDouble(String.valueOf(payload.get("peso")));
                            stmt.setInt(1, moduloId); stmt.setString(2, "peso"); stmt.setString(3, "interna"); stmt.setDouble(4, v); stmt.addBatch();
                            evaluarYAlertar(conn, apiarioId, colmenaId, "peso", v, "Peso");
                        }
                        if (payload.containsKey("temperatura_interna")) {
                            double v = Double.parseDouble(String.valueOf(payload.get("temperatura_interna")));
                            stmt.setInt(1, moduloId); stmt.setString(2, "temp"); stmt.setString(3, "interna"); stmt.setDouble(4, v); stmt.addBatch();
                            evaluarYAlertar(conn, apiarioId, colmenaId, "temp_interna", v, "Temperatura interna");
                        }
                        if (payload.containsKey("humedad_interna")) {
                            double v = Double.parseDouble(String.valueOf(payload.get("humedad_interna")));
                            stmt.setInt(1, moduloId); stmt.setString(2, "humedad"); stmt.setString(3, "interna"); stmt.setDouble(4, v); stmt.addBatch();
                            evaluarYAlertar(conn, apiarioId, colmenaId, "hum_interna", v, "Humedad interna");
                        }
                        if (payload.containsKey("temperatura_externa")) {
                            double v = Double.parseDouble(String.valueOf(payload.get("temperatura_externa")));
                            stmt.setInt(1, moduloId); stmt.setString(2, "temp"); stmt.setString(3, "externa"); stmt.setDouble(4, v); stmt.addBatch();
                            evaluarYAlertar(conn, apiarioId, colmenaId, "temp_externa", v, "Temperatura externa");
                        }
                        if (payload.containsKey("humedad_externa")) {
                            double v = Double.parseDouble(String.valueOf(payload.get("humedad_externa")));
                            stmt.setInt(1, moduloId); stmt.setString(2, "humedad"); stmt.setString(3, "externa"); stmt.setDouble(4, v); stmt.addBatch();
                            evaluarYAlertar(conn, apiarioId, colmenaId, "hum_externa", v, "Humedad externa");
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
