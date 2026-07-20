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

public class GestionUsuariosControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarUsuarios(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode usuariosNode = mapper.createArrayNode();
            
            String sql = "SELECT u.id, u.nombre, u.email, r.nombre as rol_nombre, u.activo, " +
                         "(SELECT GROUP_CONCAT(a.nombre SEPARATOR ', ') " +
                         " FROM APIARIO_APICULTOR aa JOIN APIARIO a ON aa.apiario_id = a.id " +
                         " WHERE aa.usuario_id = u.id) as apiarios, " +
                         "(SELECT GROUP_CONCAT(a.id SEPARATOR ',') " +
                         " FROM APIARIO_APICULTOR aa JOIN APIARIO a ON aa.apiario_id = a.id " +
                         " WHERE aa.usuario_id = u.id) as apiario_ids " +
                         "FROM USUARIO u JOIN CATALAGO_ROL r ON u.rol_id = r.id " +
                         "ORDER BY u.id ASC";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("id", rs.getInt("id"));
                        node.put("nombre", rs.getString("nombre"));
                        node.put("email", rs.getString("email"));
                        node.put("rol", capitalize(rs.getString("rol_nombre")));
                        
                        String apiariosAsignados = rs.getString("apiarios");
                        if (rs.getInt("id") == 1) { // Admin has access to all
                            node.put("apiariosAsignados", "Todos");
                        } else if (apiariosAsignados == null || apiariosAsignados.isEmpty()) {
                            node.put("apiariosAsignados", "— sin asignar");
                        } else {
                            // Strip "Apiario " for brevity as seen in the mockup
                            apiariosAsignados = apiariosAsignados.replace("Apiario ", "");
                            node.put("apiariosAsignados", apiariosAsignados);
                        }
                        
                        ArrayNode apiarioIdsArray = mapper.createArrayNode();
                        String apiarioIds = rs.getString("apiario_ids");
                        if (apiarioIds != null && !apiarioIds.isEmpty()) {
                            for (String aid : apiarioIds.split(",")) {
                                apiarioIdsArray.add(Integer.parseInt(aid));
                            }
                        }
                        node.set("apiario_ids", apiarioIdsArray);
                        
                        node.put("activo", rs.getBoolean("activo"));
                        usuariosNode.add(node);
                    }
                }
            }
            ctx.status(200).json(usuariosNode);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
    
    private static String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    public static void crearUsuario(Context ctx) {
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            String nombre = body.get("nombre").asText();
            String email = body.get("email").asText();
            String password = body.has("password") ? body.get("password").asText() : "123456";
            int rolId = body.has("rol_id") ? body.get("rol_id").asInt() : 2;

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                conn.setAutoCommit(false);
                try {
                    String sqlUsuario = "INSERT INTO USUARIO (rol_id, nombre, email, password_hash, creado_en) VALUES (?, ?, ?, ?, CURDATE())";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlUsuario, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                        stmt.setInt(1, rolId);
                        stmt.setString(2, nombre);
                        stmt.setString(3, email);
                        stmt.setString(4, password);
                        stmt.executeUpdate();

                        try (ResultSet rs = stmt.getGeneratedKeys()) {
                            if (rs.next()) {
                                int userId = rs.getInt(1);
                                ObjectNode res = mapper.createObjectNode();
                                res.put("id", userId);
                                res.put("mensaje", "Usuario creado con éxito");

                                // Asignar apiarios si existen
                                if (body.has("apiarios") && body.get("apiarios").isArray()) {
                                    String sqlApiario = "INSERT INTO APIARIO_APICULTOR (usuario_id, apiario_id, asignado_en) VALUES (?, ?, CURDATE())";
                                    try (PreparedStatement stmtApiario = conn.prepareStatement(sqlApiario)) {
                                        for (JsonNode apiarioIdNode : body.get("apiarios")) {
                                            stmtApiario.setInt(1, userId);
                                            stmtApiario.setInt(2, apiarioIdNode.asInt());
                                            stmtApiario.addBatch();
                                        }
                                        stmtApiario.executeBatch();
                                    }
                                }
                                
                                conn.commit();
                                ctx.status(201).json(res);
                            }
                        }
                    }
                } catch (Exception e) {
                    conn.rollback();
                    throw e;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void actualizarUsuario(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                conn.setAutoCommit(false);
                try {
                    String sql = "UPDATE USUARIO SET nombre = ?, email = ?, rol_id = ?, activo = ? WHERE id = ?";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setString(1, body.get("nombre").asText());
                        stmt.setString(2, body.get("email").asText());
                        stmt.setInt(3, body.get("rol_id").asInt());
                        stmt.setBoolean(4, body.has("activo") ? body.get("activo").asBoolean() : true);
                        stmt.setInt(5, id);
                        stmt.executeUpdate();

                        if (body.has("apiarios")) {
                            String sqlDelete = "DELETE FROM APIARIO_APICULTOR WHERE usuario_id = ?";
                            try (PreparedStatement stmtDel = conn.prepareStatement(sqlDelete)) {
                                stmtDel.setInt(1, id);
                                stmtDel.executeUpdate();
                            }

                            if (body.get("apiarios").isArray()) {
                                String sqlApiario = "INSERT INTO APIARIO_APICULTOR (usuario_id, apiario_id, asignado_en) VALUES (?, ?, CURDATE())";
                                try (PreparedStatement stmtApiario = conn.prepareStatement(sqlApiario)) {
                                    for (JsonNode apiarioIdNode : body.get("apiarios")) {
                                        stmtApiario.setInt(1, id);
                                        stmtApiario.setInt(2, apiarioIdNode.asInt());
                                        stmtApiario.addBatch();
                                    }
                                    stmtApiario.executeBatch();
                                }
                            }
                        }
                        
                        conn.commit();
                        ObjectNode res = mapper.createObjectNode();
                        res.put("mensaje", "Usuario actualizado con éxito");
                        ctx.status(200).json(res);
                    }
                } catch (Exception e) {
                    conn.rollback();
                    throw e;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void eliminarUsuario(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "DELETE FROM USUARIO WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
                ObjectNode res = mapper.createObjectNode();
                res.put("mensaje", "Usuario eliminado con éxito");
                ctx.status(200).json(res);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
