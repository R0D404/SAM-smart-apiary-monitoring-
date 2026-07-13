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
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarAlertas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode alertas = mapper.createArrayNode();
            String sql = "SELECT c.codigo as colmena, a.mensaje, a.nivel, a.atendida " +
                         "FROM ALERTA a " +
                         "JOIN COLMENA c ON a.colmena_id = c.id " +
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
}
