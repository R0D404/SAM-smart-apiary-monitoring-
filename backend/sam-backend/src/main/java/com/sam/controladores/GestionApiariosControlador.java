package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.JsonNode;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class GestionApiariosControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarApiarios(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode apiarios = mapper.createArrayNode();
            String sql = "SELECT a.id, a.nombre, a.estado, a.municipio, a.localidad, a.microclima_id, " +
                         "COUNT(c.id) as colmenas, cm.nombre as microclima " +
                         "FROM APIARIO a " +
                         "LEFT JOIN COLMENA c ON a.id = c.apiario_id " +
                         "LEFT JOIN CATALAGO_MICROCLIMA cm ON a.microclima_id = cm.id " +
                         "GROUP BY a.id, a.nombre, a.estado, a.municipio, a.localidad, a.microclima_id, cm.nombre";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("id", rs.getInt("id"));
                        node.put("nombre", rs.getString("nombre"));
                        node.put("estado", rs.getString("estado"));
                        node.put("municipio", rs.getString("municipio"));
                        node.put("localidad", rs.getString("localidad"));
                        node.put("colmenas", rs.getInt("colmenas"));
                        
                        String mc = rs.getString("microclima");
                        node.put("microclima", mc != null ? mc : "Desconocido");
                        node.put("microclima_id", rs.getInt("microclima_id"));
                        
                        apiarios.add(node);
                    }
                }
            }
            ctx.status(200).json(apiarios);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void listarMicroclimas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode microclimas = mapper.createArrayNode();
            try (PreparedStatement stmt = conn.prepareStatement("SELECT id, nombre FROM CATALAGO_MICROCLIMA")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("id", rs.getInt("id"));
                        node.put("nombre", rs.getString("nombre"));
                        microclimas.add(node);
                    }
                }
            }
            ctx.status(200).json(microclimas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearApiario(Context ctx) {
        String emailLogueado = ctx.sessionAttribute("usuarioLogueado");
        if (emailLogueado == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try {
            JsonNode body = mapper.readTree(ctx.body());
            String nombre = body.get("nombre").asText();
            String estado = body.has("estado") ? body.get("estado").asText() : "";
            String municipio = body.has("municipio") ? body.get("municipio").asText() : "";
            String localidad = body.has("localidad") ? body.get("localidad").asText() : "";
            int microclimaId = body.has("microclimaId") ? body.get("microclimaId").asInt() : 1;

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                // Obtener ID del admin
                int adminId = -1;
                try (PreparedStatement s = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    s.setString(1, emailLogueado);
                    ResultSet rs = s.executeQuery();
                    if (rs.next()) adminId = rs.getInt("id");
                }

                if (adminId == -1) {
                    ctx.status(400).json("{\"mensaje\": \"Usuario no válido\"}");
                    return;
                }

                String sql = "INSERT INTO APIARIO (admin_id, microclima_id, nombre, estado, municipio, localidad, creado_en) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, adminId);
                    stmt.setInt(2, microclimaId);
                    stmt.setString(3, nombre);
                    stmt.setString(4, estado);
                    stmt.setString(5, municipio);
                    stmt.setString(6, localidad);
                    stmt.executeUpdate();

                    try (ResultSet keys = stmt.getGeneratedKeys()) {
                        if (keys.next()) {
                            ObjectNode res = mapper.createObjectNode();
                            res.put("mensaje", "Apiario creado con éxito");
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

    public static void actualizarApiario(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "UPDATE APIARIO SET nombre=?, estado=?, municipio=?, localidad=?, microclima_id=? WHERE id=?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, body.get("nombre").asText());
                    stmt.setString(2, body.has("estado") ? body.get("estado").asText() : "");
                    stmt.setString(3, body.has("municipio") ? body.get("municipio").asText() : "");
                    stmt.setString(4, body.has("localidad") ? body.get("localidad").asText() : "");
                    stmt.setInt(5, body.has("microclimaId") ? body.get("microclimaId").asInt() : 1);
                    stmt.setInt(6, id);
                    stmt.executeUpdate();
                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Apiario actualizado");
                    ctx.status(200).json(res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void eliminarApiario(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        int id = Integer.parseInt(ctx.pathParam("id"));
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM APIARIO WHERE id = ?")) {
                stmt.setInt(1, id);
                int rows = stmt.executeUpdate();
                if (rows > 0) {
                    ctx.status(200).json("{\"mensaje\": \"Apiario dado de baja con éxito\"}");
                } else {
                    ctx.status(404).json("{\"mensaje\": \"Apiario no encontrado\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error al eliminar apiario\"}");
        }
    }
}
