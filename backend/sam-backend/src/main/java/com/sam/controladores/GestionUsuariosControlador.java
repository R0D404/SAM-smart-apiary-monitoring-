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

public class GestionUsuariosControlador {
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
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
            
            String sql = "SELECT u.id, u.nombre, r.nombre as rol_nombre, u.activo, " +
                         "(SELECT GROUP_CONCAT(a.nombre SEPARATOR ', ') " +
                         " FROM APIARIO_APICULTOR aa JOIN APIARIO a ON aa.apiario_id = a.id " +
                         " WHERE aa.usuario_id = u.id) as apiarios " +
                         "FROM USUARIO u JOIN CATALAGO_ROL r ON u.rol_id = r.id " +
                         "ORDER BY u.id ASC";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("id", rs.getInt("id"));
                        node.put("nombre", rs.getString("nombre"));
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
                String sql = "INSERT INTO USUARIO (rol_id, nombre, email, password_hash, activo, creado_en) VALUES (?, ?, ?, ?, 1, CURRENT_DATE)";
                try (PreparedStatement stmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setInt(1, rolId);
                    stmt.setString(2, nombre);
                    stmt.setString(3, email);
                    stmt.setString(4, password); // Should hash in real prod
                    stmt.executeUpdate();

                    try (ResultSet keys = stmt.getGeneratedKeys()) {
                        if (keys.next()) {
                            ObjectNode res = mapper.createObjectNode();
                            res.put("mensaje", "Usuario creado con éxito");
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

    public static void actualizarUsuario(Context ctx) {
        int id = Integer.parseInt(ctx.pathParam("id"));
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "UPDATE USUARIO SET nombre = ?, email = ?, rol_id = ?, activo = ? WHERE id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, body.get("nombre").asText());
                    stmt.setString(2, body.get("email").asText());
                    stmt.setInt(3, body.get("rol_id").asInt());
                    stmt.setBoolean(4, body.has("activo") ? body.get("activo").asBoolean() : true);
                    stmt.setInt(5, id);
                    stmt.executeUpdate();
                    
                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Usuario actualizado con éxito");
                    ctx.status(200).json(res);
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
