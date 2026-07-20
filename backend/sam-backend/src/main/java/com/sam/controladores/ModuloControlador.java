package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.Map;

public class ModuloControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerModulo(Context ctx) {
        String colmenaIdStr = ctx.pathParam("colmenaId");
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // Obtener el ID de la colmena a partir del codigo C-0X
            int colmenaId = -1;
            int apiarioId = -1;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT id, apiario_id FROM COLMENA WHERE codigo = ? OR id = ?")) {
                stmt.setString(1, colmenaIdStr);
                stmt.setString(2, colmenaIdStr);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        colmenaId = rs.getInt("id");
                        apiarioId = rs.getInt("apiario_id");
                    }
                }
            }

            if (colmenaId == -1) {
                ctx.status(404).json("{\"mensaje\": \"Colmena no encontrada\"}");
                return;
            }

            ObjectNode res = mapper.createObjectNode();
            res.put("apiario_id", apiarioId);
            res.put("colmena_id", colmenaId);

            // Obtener datos del modulo
            try (PreparedStatement stmt = conn.prepareStatement("SELECT * FROM MODULO_MONITOREO WHERE colmena_id = ?")) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        res.put("id", rs.getInt("id"));
                        res.put("identificador", rs.getString("identificador"));
                        res.put("tipo", rs.getString("tipo"));
                        res.put("estado", rs.getString("estado"));
                        res.put("instalado", rs.getString("fecha_instalacion"));
                        res.put("ultimo_fallo", rs.getString("ultimo_fallo"));
                    } else {
                        res.put("identificador", "---");
                        res.put("tipo", "---");
                        res.put("estado", "---");
                        res.put("instalado", "---");
                        res.put("ultimo_fallo", "---");
                    }
                }
            }

            // Obtener ultima lectura
            try (PreparedStatement stmt = conn.prepareStatement("SELECT fecha FROM LECTURA_SENSOR WHERE colmena_id = ? ORDER BY fecha DESC LIMIT 1")) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        res.put("ultima_lectura", rs.getTimestamp("fecha").toString());
                    } else {
                        res.put("ultima_lectura", "---");
                    }
                }
            }

            // Contar eventos de mantenimiento en VISITA
            try (PreparedStatement stmt = conn.prepareStatement("SELECT COUNT(*) as cuenta FROM VISITA WHERE colmena_id = ? AND notas LIKE '%Mantenimiento del módulo:%'")) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        res.put("eventos", rs.getInt("cuenta"));
                    }
                }
            }

            // Historial reciente
            ArrayNode historial = mapper.createArrayNode();
            try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT v.notas, s.fecha FROM VISITA v JOIN SESION_VISITA s ON v.sesion_id = s.id " +
                "WHERE v.colmena_id = ? AND v.notas LIKE '%Mantenimiento del módulo:%' ORDER BY s.fecha DESC LIMIT 5")) {
                stmt.setInt(1, colmenaId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode h = mapper.createObjectNode();
                        h.put("fecha", rs.getDate("fecha").toString());
                        h.put("detalle", rs.getString("notas"));
                        historial.add(h);
                    }
                }
            }
            res.set("historial", historial);

            ctx.status(200).json(res);

        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void registrarMantenimiento(Context ctx) {
        String colmenaIdStr = ctx.pathParam("colmenaId");
        
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        
        try {
            Map payload = ctx.bodyAsClass(Map.class);
            String tipoEvento = (String) payload.get("tipo_evento");
            String fecha = (String) payload.get("fecha");
            String descripcion = (String) payload.get("descripcion");

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                
                // Obtener usuario_id
                int usuarioId = 1; // Default
                if (usuarioActual != null) {
                    try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                        stmt.setString(1, usuarioActual);
                        try (ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) usuarioId = rs.getInt("id");
                        }
                    }
                }

                // Obtener apiario_id y colmena_id real
                int colmenaId = -1;
                int apiarioId = -1;
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id, apiario_id FROM COLMENA WHERE codigo = ? OR id = ?")) {
                    stmt.setString(1, colmenaIdStr);
                    stmt.setString(2, colmenaIdStr);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            colmenaId = rs.getInt("id");
                            apiarioId = rs.getInt("apiario_id");
                        }
                    }
                }

                if (colmenaId == -1) {
                    ctx.status(404).json("{\"mensaje\": \"Colmena no encontrada\"}");
                    return;
                }

                conn.setAutoCommit(false);
                try {
                    // Crear SESION_VISITA
                    int sesionId = -1;
                    String sqlSesion = "INSERT INTO SESION_VISITA (apiario_id, usuario_id, tipo, fecha, hora_inicio, hora_fin, cierre_automatico) VALUES (?, ?, 'visita', ?, CURTIME(), CURTIME(), 1)";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlSesion, Statement.RETURN_GENERATED_KEYS)) {
                        stmt.setInt(1, apiarioId);
                        stmt.setInt(2, usuarioId);
                        stmt.setString(3, fecha);
                        stmt.executeUpdate();
                        try (ResultSet rs = stmt.getGeneratedKeys()) {
                            if (rs.next()) sesionId = rs.getInt(1);
                        }
                    }

                    // Crear VISITA
                    String notas = "Mantenimiento del módulo: [" + tipoEvento.toUpperCase() + "] " + descripcion;
                    String sqlVisita = "INSERT INTO VISITA (colmena_id, sesion_id, estado_colonia, reina_vista, notas) VALUES (?, ?, 'Mantenimiento de hardware', 0, ?)";
                    try (PreparedStatement stmt = conn.prepareStatement(sqlVisita)) {
                        stmt.setInt(1, colmenaId);
                        stmt.setInt(2, sesionId);
                        stmt.setString(3, notas);
                        stmt.executeUpdate();
                    }

                    conn.commit();
                    ctx.status(201).json("{\"mensaje\": \"Mantenimiento registrado correctamente\"}");
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
}
