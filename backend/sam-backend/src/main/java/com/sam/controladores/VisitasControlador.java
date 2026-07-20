package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class VisitasControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarVisitas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode visitas = mapper.createArrayNode();
            
            // Fetch real data from VISITA and SESION_VISITA
            String sql = "SELECT sv.fecha, c.codigo as colmena, u.nombre as apicultor, " +
                         "v.estado_colonia, IF(v.reina_vista=1, 'Sí', 'No') as reina, v.notas " +
                         "FROM VISITA v " +
                         "JOIN COLMENA c ON v.colmena_id = c.id " +
                         "JOIN SESION_VISITA sv ON v.sesion_id = sv.id " +
                         "JOIN USUARIO u ON sv.usuario_id = u.id " +
                         "ORDER BY sv.fecha DESC, v.id DESC LIMIT 50";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("fecha", rs.getDate("fecha").toString());
                        node.put("colmena", rs.getString("colmena"));
                        node.put("apicultor", rs.getString("apicultor"));
                        node.put("estado_colonia", rs.getString("estado_colonia"));
                        node.put("reina", rs.getString("reina"));
                        node.put("notas", rs.getString("notas"));
                        visitas.add(node);
                    }
                }
            }
            ctx.status(200).json(visitas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearVisita(Context ctx) {
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "INSERT INTO SESION_VISITA (apiario_id, usuario_id, tipo, fecha, hora_inicio) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, body.get("apiario_id").asInt());
                    stmt.setInt(2, body.get("usuario_id").asInt());
                    stmt.setString(3, body.has("tipo") ? body.get("tipo").asText() : "rutina");
                    stmt.setString(4, body.has("fecha") ? body.get("fecha").asText() : "2026-01-01");
                    stmt.setString(5, body.has("hora_inicio") ? body.get("hora_inicio").asText() : "12:00:00");
                    stmt.executeUpdate();

                    try (ResultSet keys = stmt.getGeneratedKeys()) {
                        if (keys.next()) {
                            ObjectNode res = mapper.createObjectNode();
                            res.put("mensaje", "Visita creada");
                            res.put("id", keys.getInt(1));
                            ctx.status(201).json(res);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void actualizarVisita(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "UPDATE SESION_VISITA SET tipo=?, fecha=? WHERE id=?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, body.get("tipo").asText());
                    stmt.setString(2, body.get("fecha").asText());
                    stmt.setInt(3, id);
                    stmt.executeUpdate();
                    
                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Visita actualizada");
                    ctx.status(200).json(res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void eliminarVisita(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "DELETE FROM SESION_VISITA WHERE id=?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
                ObjectNode res = mapper.createObjectNode();
                res.put("mensaje", "Visita eliminada");
                ctx.status(200).json(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
