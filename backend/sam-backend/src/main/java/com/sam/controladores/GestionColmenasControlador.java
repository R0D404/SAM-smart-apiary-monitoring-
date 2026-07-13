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

public class GestionColmenasControlador {
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarColmenas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode colmenas = mapper.createArrayNode();
            String sql = "SELECT c.id as db_id, c.codigo, a.nombre as apiario, c.ecotipo, c.estado, m.identificador as monitoreo " +
                         "FROM COLMENA c " +
                         "JOIN APIARIO a ON c.apiario_id = a.id " +
                         "LEFT JOIN MODULO_MONITOREO m ON m.colmena_id = c.id";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("db_id", rs.getInt("db_id"));
                        node.put("id", rs.getString("codigo"));
                        node.put("apiario", rs.getString("apiario"));
                        
                        String monitoreo = rs.getString("monitoreo");
                        node.put("monitoreo", monitoreo != null ? monitoreo : "Sin asignar");
                        
                        node.put("ecotipo", rs.getString("ecotipo"));
                        
                        String estado = rs.getString("estado");
                        if ("activa".equalsIgnoreCase(estado)) {
                            node.put("estado", "verde");
                            node.put("estadoTexto", "Saludable");
                        } else {
                            node.put("estado", "rojo");
                            node.put("estadoTexto", "Atención Requerida");
                        }
                        
                        colmenas.add(node);
                    }
                }
            }
            ctx.status(200).json(colmenas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearColmena(Context ctx) {
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "INSERT INTO COLMENA (apiario_id, codigo, ecotipo, estado, fecha_instalacion) VALUES (?, ?, ?, ?, CURRENT_DATE)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, body.get("apiario_id").asInt());
                    stmt.setString(2, body.get("codigo").asText());
                    stmt.setString(3, body.has("ecotipo") ? body.get("ecotipo").asText() : "Hibrida");
                    stmt.setString(4, body.has("estado") ? body.get("estado").asText() : "activa");
                    stmt.executeUpdate();

                    try (ResultSet keys = stmt.getGeneratedKeys()) {
                        if (keys.next()) {
                            ObjectNode res = mapper.createObjectNode();
                            res.put("mensaje", "Colmena creada");
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

    public static void actualizarColmena(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "UPDATE COLMENA SET apiario_id=?, codigo=?, ecotipo=?, estado=? WHERE id=?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, body.get("apiario_id").asInt());
                    stmt.setString(2, body.get("codigo").asText());
                    stmt.setString(3, body.get("ecotipo").asText());
                    stmt.setString(4, body.get("estado").asText());
                    stmt.setInt(5, id);
                    stmt.executeUpdate();
                    
                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Colmena actualizada");
                    ctx.status(200).json(res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void eliminarColmena(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "DELETE FROM COLMENA WHERE id=?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
                ObjectNode res = mapper.createObjectNode();
                res.put("mensaje", "Colmena eliminada");
                ctx.status(200).json(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
