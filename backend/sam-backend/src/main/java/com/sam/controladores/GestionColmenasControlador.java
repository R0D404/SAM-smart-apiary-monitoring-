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
            String sql = "SELECT c.codigo, a.nombre as apiario, c.ecotipo, c.estado, m.identificador as monitoreo " +
                         "FROM COLMENA c " +
                         "JOIN APIARIO a ON c.apiario_id = a.id " +
                         "LEFT JOIN MODULO_MONITOREO m ON m.colmena_id = c.id";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
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
}
