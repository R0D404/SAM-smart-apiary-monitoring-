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
import java.util.ArrayList;
import java.util.List;

public class VisitasControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    // -----------------------------------------------
    // Utilidad: filtros de fecha y apiario desde query params
    // -----------------------------------------------
    private static String construirWhereFecha(String fechaParam, List<Object> params) {
        if (fechaParam == null || fechaParam.isBlank()) return "";
        // Puede ser: YYYY, YYYY-MM, YYYY-MM-DD
        if (fechaParam.matches("\\d{4}")) {
            params.add(fechaParam);
            return " AND YEAR(sv.fecha) = ?";
        } else if (fechaParam.matches("\\d{4}-\\d{2}")) {
            String[] parts = fechaParam.split("-");
            params.add(Integer.parseInt(parts[0]));
            params.add(Integer.parseInt(parts[1]));
            return " AND YEAR(sv.fecha) = ? AND MONTH(sv.fecha) = ?";
        } else if (fechaParam.matches("\\d{4}-\\d{2}-\\d{2}")) {
            params.add(fechaParam);
            return " AND sv.fecha = ?";
        }
        return "";
    }

    // -----------------------------------------------
    // GET /visitas — visitas normales (no cosechas, no mantenimiento)
    // -----------------------------------------------
    public static void listarVisitas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String apiarioParam = ctx.queryParam("apiario_id");
        String fechaParam = ctx.queryParam("fecha");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode result = mapper.createArrayNode();
            List<Object> params = new ArrayList<>();

            int usuarioId = -1;
            String rol = ctx.sessionAttribute("rol");
            if ("apicultor".equals(rol)) {
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, ctx.sessionAttribute("usuarioLogueado"));
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
            }

            String sql = "SELECT sv.fecha, c.codigo as colmena, a.nombre as apiario, u.nombre as apicultor, " +
                         "v.estado_colonia, IF(v.reina_vista=1, 'Sí', 'No') as reina, v.notas " +
                         "FROM VISITA v " +
                         "JOIN COLMENA c ON v.colmena_id = c.id " +
                         "JOIN APIARIO a ON c.apiario_id = a.id " +
                         ("apicultor".equals(rol) ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                         "JOIN SESION_VISITA sv ON v.sesion_id = sv.id " +
                         "JOIN USUARIO u ON sv.usuario_id = u.id " +
                         "WHERE sv.tipo = 'visita' AND v.estado_colonia != 'Mantenimiento de hardware'";

            if (apiarioParam != null && !apiarioParam.isBlank()) {
                sql += " AND a.id = ?";
                params.add(Integer.parseInt(apiarioParam));
            }
            sql += construirWhereFecha(fechaParam, params);
            sql += " ORDER BY sv.fecha DESC, v.id DESC LIMIT 200";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (int i = 0; i < params.size(); i++) {
                    Object p = params.get(i);
                    if (p instanceof Integer) stmt.setInt(i + 1, (Integer) p);
                    else stmt.setString(i + 1, p.toString());
                }
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("fecha", rs.getDate("fecha").toString());
                        node.put("colmena", rs.getString("colmena"));
                        node.put("apiario", rs.getString("apiario"));
                        node.put("apicultor", rs.getString("apicultor"));
                        node.put("estado_colonia", rs.getString("estado_colonia"));
                        node.put("reina", rs.getString("reina"));
                        node.put("notas", rs.getString("notas"));
                        result.add(node);
                    }
                }
            }
            ctx.status(200).json(result);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    // -----------------------------------------------
    // GET /visitas/cosechas — registros de cosecha
    // -----------------------------------------------
    public static void listarCosechasVisitas(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String apiarioParam = ctx.queryParam("apiario_id");
        String fechaParam = ctx.queryParam("fecha");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode result = mapper.createArrayNode();
            List<Object> params = new ArrayList<>();

            int usuarioId = -1;
            String rol = ctx.sessionAttribute("rol");
            if ("apicultor".equals(rol)) {
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, ctx.sessionAttribute("usuarioLogueado"));
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
            }

            String sql = "SELECT sv.fecha, c.codigo as colmena, a.nombre as apiario, u.nombre as apicultor, " +
                         "co.kg_miel, co.calidad, IF(co.validado_con_peso=1,'Sí','No') as validada " +
                         "FROM COSECHA co " +
                         "JOIN COLMENA c ON co.colmena_id = c.id " +
                         "JOIN APIARIO a ON c.apiario_id = a.id " +
                         ("apicultor".equals(rol) ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                         "JOIN SESION_VISITA sv ON co.sesion_id = sv.id " +
                         "JOIN USUARIO u ON sv.usuario_id = u.id " +
                         "WHERE sv.tipo = 'cosecha'";

            if (apiarioParam != null && !apiarioParam.isBlank()) {
                sql += " AND a.id = ?";
                params.add(Integer.parseInt(apiarioParam));
            }
            sql += construirWhereFecha(fechaParam, params);
            sql += " ORDER BY sv.fecha DESC, co.id DESC LIMIT 200";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (int i = 0; i < params.size(); i++) {
                    Object p = params.get(i);
                    if (p instanceof Integer) stmt.setInt(i + 1, (Integer) p);
                    else stmt.setString(i + 1, p.toString());
                }
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("fecha", rs.getDate("fecha").toString());
                        node.put("colmena", rs.getString("colmena"));
                        node.put("apiario", rs.getString("apiario"));
                        node.put("apicultor", rs.getString("apicultor"));
                        node.put("kg_miel", rs.getString("kg_miel"));
                        node.put("calidad", rs.getString("calidad"));
                        node.put("validada", rs.getString("validada"));
                        result.add(node);
                    }
                }
            }
            ctx.status(200).json(result);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    // -----------------------------------------------
    // GET /visitas/mantenimiento — registros de mantenimiento de hardware
    // -----------------------------------------------
    public static void listarMantenimientos(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String apiarioParam = ctx.queryParam("apiario_id");
        String fechaParam = ctx.queryParam("fecha");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode result = mapper.createArrayNode();
            List<Object> params = new ArrayList<>();

            int usuarioId = -1;
            String rol = ctx.sessionAttribute("rol");
            if ("apicultor".equals(rol)) {
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, ctx.sessionAttribute("usuarioLogueado"));
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
            }

            String sql = "SELECT sv.fecha, c.codigo as colmena, a.nombre as apiario, u.nombre as tecnico, v.notas " +
                         "FROM VISITA v " +
                         "JOIN COLMENA c ON v.colmena_id = c.id " +
                         "JOIN APIARIO a ON c.apiario_id = a.id " +
                         ("apicultor".equals(rol) ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                         "JOIN SESION_VISITA sv ON v.sesion_id = sv.id " +
                         "JOIN USUARIO u ON sv.usuario_id = u.id " +
                         "WHERE v.estado_colonia = 'Mantenimiento de hardware'";

            if (apiarioParam != null && !apiarioParam.isBlank()) {
                sql += " AND a.id = ?";
                params.add(Integer.parseInt(apiarioParam));
            }
            sql += construirWhereFecha(fechaParam, params);
            sql += " ORDER BY sv.fecha DESC, v.id DESC LIMIT 200";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (int i = 0; i < params.size(); i++) {
                    Object p = params.get(i);
                    if (p instanceof Integer) stmt.setInt(i + 1, (Integer) p);
                    else stmt.setString(i + 1, p.toString());
                }
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("fecha", rs.getDate("fecha").toString());
                        node.put("colmena", rs.getString("colmena"));
                        node.put("apiario", rs.getString("apiario"));
                        node.put("tecnico", rs.getString("tecnico"));
                        String notas = rs.getString("notas");
                        // Extraer tipo: "Mantenimiento del módulo: [TIPO] descripción"
                        String tipo = "—";
                        String desc = notas != null ? notas : "—";
                        if (notas != null) {
                            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\[([^\\]]+)\\]").matcher(notas);
                            if (m.find()) tipo = m.group(1);
                            desc = notas.replaceAll("^Mantenimiento del módulo: \\[[^\\]]+\\] ?", "").trim();
                        }
                        node.put("tipo", tipo);
                        node.put("descripcion", desc);
                        result.add(node);
                    }
                }
            }
            ctx.status(200).json(result);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    // -----------------------------------------------
    // GET /visitas/apiarios — lista de apiarios disponibles
    // -----------------------------------------------
    public static void listarApiariosDisponibles(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        
        String rol = ctx.sessionAttribute("rol");
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        
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

            ArrayNode result = mapper.createArrayNode();
            String sql = "SELECT a.id, a.nombre FROM APIARIO a ";
            if ("apicultor".equals(rol)) {
                sql += "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " ";
            }
            sql += "ORDER BY a.nombre";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode node = mapper.createObjectNode();
                        node.put("id", rs.getInt("id"));
                        node.put("nombre", rs.getString("nombre"));
                        result.add(node);
                    }
                }
            }
            ctx.status(200).json(result);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearVisita(Context ctx) {
        if (ctx.sessionAttribute("usuarioLogueado") == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        
        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = com.sam.Conexion.conectar()) {
                
                int usuarioId = -1;
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, usuarioActual);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
                
                if (usuarioId == -1) {
                    ctx.status(403).json("{\"mensaje\": \"Usuario no válido\"}");
                    return;
                }

                conn.setAutoCommit(false); // Transactions for multi-table inserts
                
                try {
                    // 1. Insert SESION_VISITA
                    int sesionId = -1;
                    String sqlSesion = "INSERT INTO SESION_VISITA (apiario_id, usuario_id, tipo, fecha, hora_inicio) VALUES (?, ?, ?, ?, CURRENT_TIME)";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlSesion, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                        stmt.setInt(1, body.get("apiario_id").asInt());
                        stmt.setInt(2, usuarioId);
                        stmt.setString(3, "visita"); // by default we use visita
                        stmt.setString(4, body.has("fecha") ? body.get("fecha").asText() : java.time.LocalDate.now().toString());
                        stmt.executeUpdate();
                        try (ResultSet keys = stmt.getGeneratedKeys()) {
                            if (keys.next()) sesionId = keys.getInt(1);
                        }
                    }
                    
                    if (sesionId == -1) throw new Exception("Failed to insert SESION_VISITA");

                    // 2. Insert VISITA
                    int visitaId = -1;
                    String sqlVisita = "INSERT INTO VISITA (colmena_id, sesion_id, estado_colonia, reina_vista, notas) VALUES (?, ?, ?, ?, ?)";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlVisita, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                        stmt.setInt(1, body.get("colmena_id").asInt());
                        stmt.setInt(2, sesionId);
                        stmt.setString(3, body.has("estado") ? body.get("estado").asText() : "OK");
                        stmt.setInt(4, body.has("reina_vista") && body.get("reina_vista").asBoolean() ? 1 : 0);
                        stmt.setString(5, body.has("notas") ? body.get("notas").asText() : "");
                        stmt.executeUpdate();
                        try (ResultSet keys = stmt.getGeneratedKeys()) {
                            if (keys.next()) visitaId = keys.getInt(1);
                        }
                    }

                    // 3. Insert COSECHA if kg_cosechados exists and is > 0
                    if (body.has("kg_cosechados") && !body.get("kg_cosechados").isNull()) {
                        double kg = body.get("kg_cosechados").asDouble();
                        if (kg > 0) {
                            String sqlCosecha = "INSERT INTO COSECHA (sesion_id, colmena_id, kg_miel, calidad) VALUES (?, ?, ?, ?)";
                            try (PreparedStatement stmt = conn.prepareStatement(sqlCosecha)) {
                                stmt.setInt(1, sesionId);
                                stmt.setInt(2, body.get("colmena_id").asInt());
                                stmt.setDouble(3, kg);
                                stmt.setString(4, body.has("calidad_miel") && !body.get("calidad_miel").isNull() ? body.get("calidad_miel").asText() : "");
                                stmt.executeUpdate();
                            }
                        }
                    }

                    conn.commit();

                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Visita registrada con éxito");
                    res.put("sesion_id", sesionId);
                    res.put("visita_id", visitaId);
                    ctx.status(201).json(res);

                } catch (Exception e) {
                    conn.rollback();
                    throw e;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno: " + e.getMessage() + "\"}");
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
