package com.sam.controladores;

import io.javalin.http.Context;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

public class UmbralesControlador {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerUmbrales(Context ctx) {
        try (Connection conn = com.sam.Conexion.conectar()) {
            Map<String, Double> payload = new HashMap<>();
            String sql = "SELECT tipo_sensor, franja_hora, valor_min, valor_max, tasa_max_hora FROM UMBRAL_CONFIG WHERE apiario_id IS NULL OR apiario_id = 1";
            try (PreparedStatement stmt = conn.prepareStatement(sql);
                 ResultSet rs = stmt.executeQuery()) {
                while(rs.next()) {
                    String tipo = rs.getString("tipo_sensor");
                    int franja = rs.getInt("franja_hora");
                    Double min = rs.getObject("valor_min") != null ? rs.getDouble("valor_min") : null;
                    Double max = rs.getObject("valor_max") != null ? rs.getDouble("valor_max") : null;
                    Double tasa = rs.getObject("tasa_max_hora") != null ? rs.getDouble("tasa_max_hora") : null;

                    if ("peso".equals(tipo)) {
                        payload.put("peso_min", min);
                        payload.put("peso_max", max);
                        payload.put("peso_tasa", tasa);
                    } else if ("hum_interna".equals(tipo)) {
                        payload.put("hum_min", min);
                        payload.put("hum_max", max);
                        payload.put("hum_tasa", tasa);
                    } else if ("temp_externa".equals(tipo)) {
                        payload.put("temp_ext_min", min);
                        payload.put("temp_ext_max", max);
                        payload.put("temp_ext_tasa", tasa);
                    } else if ("hum_externa".equals(tipo)) {
                        payload.put("hum_ext_min", min);
                        payload.put("hum_ext_max", max);
                        payload.put("hum_ext_tasa", tasa);
                    } else if ("temp_interna".equals(tipo)) {
                        if (franja == 1) {
                            payload.put("temp_dia_min", min);
                            payload.put("temp_dia_max", max);
                            payload.put("temp_dia_tasa", tasa);
                        } else if (franja == 2) {
                            payload.put("temp_noche_min", min);
                            payload.put("temp_noche_max", max);
                            payload.put("temp_noche_tasa", tasa);
                        }
                    }
                }
            }
            ctx.json(payload);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error al obtener los umbrales\"}");
        }
    }

    public static void guardarUmbrales(Context ctx) {
        try (Connection conn = com.sam.Conexion.conectar()) {
            Map<String, Double> payload = mapper.readValue(ctx.body(), new TypeReference<Map<String, Double>>() {});
            
            // Delete old umbrales
            try (PreparedStatement del = conn.prepareStatement("DELETE FROM UMBRAL_CONFIG")) {
                del.executeUpdate();
            }

            String sql = "INSERT INTO UMBRAL_CONFIG (tipo_sensor, franja_hora, valor_min, valor_max, tasa_max_hora) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement ins = conn.prepareStatement(sql)) {
                // peso
                guardarFila(ins, "peso", 0, payload.get("peso_min"), payload.get("peso_max"), payload.get("peso_tasa"));
                // hum_interna
                guardarFila(ins, "hum_interna", 0, payload.get("hum_min"), payload.get("hum_max"), payload.get("hum_tasa"));
                // temp_externa
                guardarFila(ins, "temp_externa", 0, payload.get("temp_ext_min"), payload.get("temp_ext_max"), payload.get("temp_ext_tasa"));
                // hum_externa
                guardarFila(ins, "hum_externa", 0, payload.get("hum_ext_min"), payload.get("hum_ext_max"), payload.get("hum_ext_tasa"));
                // temp_interna dia
                guardarFila(ins, "temp_interna", 1, payload.get("temp_dia_min"), payload.get("temp_dia_max"), payload.get("temp_dia_tasa"));
                // temp_interna noche
                guardarFila(ins, "temp_interna", 2, payload.get("temp_noche_min"), payload.get("temp_noche_max"), payload.get("temp_noche_tasa"));
            }
            
            ctx.status(200).json("{\"mensaje\": \"Umbrales guardados correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al guardar los umbrales\"}");
        }
    }

    private static void guardarFila(PreparedStatement ins, String tipo, int franja, Double min, Double max, Double tasa) throws Exception {
        ins.setString(1, tipo);
        ins.setInt(2, franja);
        if (min != null) ins.setDouble(3, min); else ins.setNull(3, Types.DECIMAL);
        if (max != null) ins.setDouble(4, max); else ins.setNull(4, Types.DECIMAL);
        if (tasa != null) ins.setDouble(5, tasa); else ins.setNull(5, Types.DECIMAL);
        ins.executeUpdate();
    }
}
