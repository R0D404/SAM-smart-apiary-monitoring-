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

public class AlertasControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarAlertas(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        String rol = ctx.sessionAttribute("rol");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            int usuarioId = -1;
            if ("apicultor".equals(rol)) {
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, usuarioActual);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
            }
            
            ArrayNode alertas = mapper.createArrayNode();
            String sql = "SELECT c.codigo as colmena, a.mensaje, a.nivel, a.atendida " +
                         "FROM ALERTA a " +
                         "JOIN COLMENA c ON a.colmena_id = c.id " +
                         ("apicultor".equals(rol) ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = c.apiario_id AND aa.usuario_id = " + usuarioId + " " : "") +
                         "ORDER BY a.id DESC";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("colmena", rs.getString("colmena"));
                        node.put("mensaje", rs.getString("mensaje"));
                        
                        boolean atendida = rs.getBoolean("atendida");
                        if (atendida) {
                            node.put("nivel", "atendida");
                        } else {
                            String nivel = rs.getString("nivel");
                            node.put("nivel", "critico".equalsIgnoreCase(nivel) ? "critica" : "aviso");
                        }
                        
                        node.put("tiempo", "Reciente");
                        alertas.add(node);
                    }
                }
            }
            ctx.status(200).json(alertas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearAlerta(Context ctx) {
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "INSERT INTO ALERTA (colmena_id, tipo, nivel, mensaje, atendida) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, body.get("colmena_id").asInt());
                    stmt.setString(2, body.has("tipo") ? body.get("tipo").asText() : "umbral");
                    stmt.setString(3, body.has("nivel") ? body.get("nivel").asText() : "aviso");
                    stmt.setString(4, body.has("mensaje") ? body.get("mensaje").asText() : "");
                    stmt.setBoolean(5, body.has("atendida") ? body.get("atendida").asBoolean() : false);
                    stmt.executeUpdate();

                    try (ResultSet keys = stmt.getGeneratedKeys()) {
                        if (keys.next()) {
                            ObjectNode res = mapper.createObjectNode();
                            res.put("mensaje", "Alerta creada");
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

    public static void actualizarAlerta(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "UPDATE ALERTA SET atendida=? WHERE id=?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setBoolean(1, body.has("atendida") ? body.get("atendida").asBoolean() : true);
                    stmt.setInt(2, id);
                    stmt.executeUpdate();
                    
                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Alerta actualizada");
                    ctx.status(200).json(res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void eliminarAlerta(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "DELETE FROM ALERTA WHERE id=?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
                ObjectNode res = mapper.createObjectNode();
                res.put("mensaje", "Alerta eliminada");
                ctx.status(200).json(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
