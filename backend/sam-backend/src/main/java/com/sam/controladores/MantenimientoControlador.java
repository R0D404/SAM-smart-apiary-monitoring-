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
import java.text.SimpleDateFormat;

public class MantenimientoControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerMantenimiento(Context ctx) {
        // colmenaId puede ser el DB integer ID de la colmena
        String colmenaIdStr = ctx.queryParam("colmenaId");
        int colmenaId = 0;

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {

            // Si viene el parámetro, intentar parsear como entero
            if (colmenaIdStr != null && !colmenaIdStr.isEmpty()) {
                try {
                    colmenaId = Integer.parseInt(colmenaIdStr);
                } catch (NumberFormatException e) {
                    // Si viene como código (C-01), buscar el db_id
                    String sqlByCodigo = "SELECT id FROM COLMENA WHERE codigo = ? AND estado <> 'de_baja' LIMIT 1";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlByCodigo)) {
                        stmt.setString(1, colmenaIdStr);
                        try (ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) colmenaId = rs.getInt("id");
                        }
                    }
                }
            }

            // Si aún no tenemos ID, tomar la primera colmena disponible
            if (colmenaId == 0) {
                String sqlFirst = "SELECT id FROM COLMENA WHERE estado <> 'de_baja' ORDER BY id ASC LIMIT 1";
                try (PreparedStatement stmt = conn.prepareStatement(sqlFirst);
                     ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) colmenaId = rs.getInt("id");
                }
            }

            ObjectNode response = mapper.createObjectNode();

            // 1. Datos del módulo
            ObjectNode moduloNode = mapper.createObjectNode();
            String sqlModulo = "SELECT m.identificador, m.tipo, m.estado, m.fecha_instalacion, " +
                               "(SELECT COUNT(*) FROM EVENTO_MANTENIMIENTO WHERE colmena_id = c.id) as total_eventos " +
                               "FROM COLMENA c " +
                               "LEFT JOIN MODULO_MONITOREO m ON m.colmena_id = c.id " +
                               "WHERE c.id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlModulo)) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String ident = rs.getString("identificador");
                        moduloNode.put("identificador", ident != null ? ident : "Sin registrar");
                        moduloNode.put("tipo", rs.getString("tipo") != null ? rs.getString("tipo") : "N/A");
                        moduloNode.put("estado", rs.getString("estado") != null ? rs.getString("estado") : "inactivo");

                        java.sql.Date fechaInst = rs.getDate("fecha_instalacion");
                        moduloNode.put("fecha_instalacion", fechaInst != null ? new SimpleDateFormat("dd/MM/yyyy").format(fechaInst) : "—");
                        moduloNode.put("total_eventos", rs.getInt("total_eventos"));
                    } else {
                        moduloNode.put("identificador", "N/A");
                        moduloNode.put("tipo", "N/A");
                        moduloNode.put("estado", "inactivo");
                        moduloNode.put("fecha_instalacion", "—");
                        moduloNode.put("total_eventos", 0);
                    }
                }
            }
            response.set("modulo", moduloNode);

            // 2. Historial de eventos
            ArrayNode eventosNode = response.putArray("eventos");
            String sqlEventos = "SELECT id, tipo_evento, fecha, descripcion FROM EVENTO_MANTENIMIENTO WHERE colmena_id = ? ORDER BY fecha DESC, id DESC";
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            try (PreparedStatement stmt = conn.prepareStatement(sqlEventos)) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode ev = mapper.createObjectNode();
                        ev.put("id", rs.getInt("id"));
                        ev.put("tipo_evento", rs.getString("tipo_evento"));
                        java.sql.Date f = rs.getDate("fecha");
                        ev.put("fecha", f != null ? sdf.format(f) : "");
                        ev.put("descripcion", rs.getString("descripcion"));
                        eventosNode.add(ev);
                    }
                }
            }

            // 3. Lista de colmenas para el selector
            ArrayNode colmenasNode = response.putArray("colmenas");
            String sqlColmenas = "SELECT c.id, c.codigo, a.nombre as apiario FROM COLMENA c JOIN APIARIO a ON c.apiario_id = a.id WHERE c.estado <> 'de_baja' ORDER BY a.nombre ASC, c.codigo ASC";
            try (PreparedStatement stmt = conn.prepareStatement(sqlColmenas);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ObjectNode col = mapper.createObjectNode();
                    col.put("id", rs.getInt("id"));
                    col.put("codigo", rs.getString("codigo"));
                    col.put("apiario", rs.getString("apiario"));
                    colmenasNode.add(col);
                }
            }

            ctx.status(200).json(response);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearMantenimiento(Context ctx) {
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            int colmenaId = body.get("colmena_id").asInt();
            String tipoEvento = body.get("tipo_evento").asText();
            String fecha = body.get("fecha").asText();
            String descripcion = body.get("descripcion").asText();

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                String sql = "INSERT INTO EVENTO_MANTENIMIENTO (colmena_id, tipo_evento, fecha, descripcion) VALUES (?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, colmenaId);
                    stmt.setString(2, tipoEvento);
                    stmt.setString(3, fecha);
                    stmt.setString(4, descripcion);
                    stmt.executeUpdate();

                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Evento de mantenimiento guardado");
                    ctx.status(201).json(res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
