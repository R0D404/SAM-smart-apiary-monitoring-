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
}
