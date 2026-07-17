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

public class VisitasControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void listarVisitas(Context ctx) {
        String email = ctx.sessionAttribute("usuarioLogueado");
        if (email == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String rolUsuario = ctx.sessionAttribute("rolUsuario");

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode visitas = mapper.createArrayNode();

            String sql;
            PreparedStatement stmt;

            if ("apicultor".equals(rolUsuario)) {
                // Apicultor: solo ve sus propias visitas
                sql = "SELECT sv.fecha, c.codigo as colmena, u.nombre as apicultor, " +
                      "v.estado_colonia, CASE WHEN v.reina_vista = 1 THEN 'Vista' ELSE 'No vista' END as reina, v.notas " +
                      "FROM SESION_VISITA sv " +
                      "JOIN USUARIO u ON sv.usuario_id = u.id " +
                      "JOIN VISITA v ON v.sesion_id = sv.id " +
                      "JOIN COLMENA c ON v.colmena_id = c.id " +
                      "WHERE u.email = ? " +
                      "ORDER BY sv.fecha DESC, sv.id DESC " +
                      "LIMIT 50";
                stmt = conn.prepareStatement(sql);
                stmt.setString(1, email);
            } else {
                // Admin: ve todas las visitas
                sql = "SELECT sv.fecha, c.codigo as colmena, u.nombre as apicultor, " +
                      "v.estado_colonia, CASE WHEN v.reina_vista = 1 THEN 'Vista' ELSE 'No vista' END as reina, v.notas " +
                      "FROM SESION_VISITA sv " +
                      "JOIN USUARIO u ON sv.usuario_id = u.id " +
                      "JOIN VISITA v ON v.sesion_id = sv.id " +
                      "JOIN COLMENA c ON v.colmena_id = c.id " +
                      "ORDER BY sv.fecha DESC, sv.id DESC " +
                      "LIMIT 50";
                stmt = conn.prepareStatement(sql);
            }

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd MMM", new java.util.Locale("es", "ES"));
            try (stmt; ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ObjectNode node = mapper.createObjectNode();
                    java.sql.Date fecha = rs.getDate("fecha");
                    node.put("fecha", fecha != null ? sdf.format(fecha) : "");
                    node.put("colmena", rs.getString("colmena"));
                    node.put("apicultor", rs.getString("apicultor"));
                    node.put("estado_colonia", rs.getString("estado_colonia") != null ? rs.getString("estado_colonia") : "N/A");
                    node.put("reina", rs.getString("reina"));
                    node.put("notas", rs.getString("notas") != null ? rs.getString("notas") : "");
                    visitas.add(node);
                }
            }
            ctx.status(200).json(visitas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void crearVisita(Context ctx) {
        String email = ctx.sessionAttribute("usuarioLogueado");
        if (email == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                // 1. Obtener ID del usuario a partir del email de la sesión
                int usuarioId = 1;
                String sqlUser = "SELECT id FROM USUARIO WHERE email = ?";
                try (PreparedStatement stmtUser = conn.prepareStatement(sqlUser)) {
                    stmtUser.setString(1, email);
                    try (ResultSet rs = stmtUser.executeQuery()) {
                        if (rs.next()) {
                            usuarioId = rs.getInt("id");
                        }
                    }
                }

                // 2. Obtener apiario_id de la colmena seleccionada
                int colmenaId = body.get("colmena_id").asInt();
                int apiarioId = 1;
                String sqlColmena = "SELECT apiario_id FROM COLMENA WHERE id = ?";
                try (PreparedStatement stmtColmena = conn.prepareStatement(sqlColmena)) {
                    stmtColmena.setInt(1, colmenaId);
                    try (ResultSet rs = stmtColmena.executeQuery()) {
                        if (rs.next()) {
                            apiarioId = rs.getInt("apiario_id");
                        }
                    }
                }

                // 3. Extraer campos adicionales
                double kgCosechados = body.has("kg_cosechados") ? body.get("kg_cosechados").asDouble() : 0.0;
                String tipoSesion = kgCosechados > 0 ? "cosecha" : "visita";
                String fecha = body.has("fecha") ? body.get("fecha").asText() : new java.sql.Date(System.currentTimeMillis()).toString();
                String estadoColonia = body.has("estado_colonia") ? body.get("estado_colonia").asText() : "Saludable";
                boolean reinaVista = body.has("reina_vista") ? body.get("reina_vista").asBoolean() : false;
                String notas = body.has("notes") ? body.get("notes").asText() : (body.has("notas") ? body.get("notas").asText() : "");
                String calidadMiel = body.has("calidad_miel") ? body.get("calidad_miel").asText() : "";

                // 4. Iniciar transacción e insertar registros en cascada
                conn.setAutoCommit(false);
                try {
                    // a) Insertar en SESION_VISITA
                    String sqlSesion = "INSERT INTO SESION_VISITA (apiario_id, usuario_id, tipo, fecha, hora_inicio) VALUES (?, ?, ?, ?, '12:00:00')";
                    int sesionId = 0;
                    try (PreparedStatement stmtSesion = conn.prepareStatement(sqlSesion, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                        stmtSesion.setInt(1, apiarioId);
                        stmtSesion.setInt(2, usuarioId);
                        stmtSesion.setString(3, tipoSesion);
                        stmtSesion.setString(4, fecha);
                        stmtSesion.executeUpdate();
                        try (ResultSet keys = stmtSesion.getGeneratedKeys()) {
                            if (keys.next()) {
                                sesionId = keys.getInt(1);
                            }
                        }
                    }

                    // b) Insertar en VISITA
                    String sqlVisita = "INSERT INTO VISITA (colmena_id, sesion_id, hora_inicio, hora_fin, estado_colonia, reina_vista, notas) VALUES (?, ?, '12:00:00', '12:30:00', ?, ?, ?)";
                    try (PreparedStatement stmtVisita = conn.prepareStatement(sqlVisita)) {
                        stmtVisita.setInt(1, colmenaId);
                        stmtVisita.setInt(2, sesionId);
                        stmtVisita.setString(3, estadoColonia);
                        stmtVisita.setBoolean(4, reinaVista);
                        stmtVisita.setString(5, notas);
                        stmtVisita.executeUpdate();
                    }

                    // c) Insertar en COSECHA si los kilos son mayores a 0
                    if (kgCosechados > 0) {
                        String sqlCosecha = "INSERT INTO COSECHA (colmena_id, sesion_id, kg_miel, calidad, validado_con_peso) VALUES (?, ?, ?, ?, 0)";
                        try (PreparedStatement stmtCosecha = conn.prepareStatement(sqlCosecha)) {
                            stmtCosecha.setInt(1, colmenaId);
                            stmtCosecha.setInt(2, sesionId);
                            stmtCosecha.setDouble(3, kgCosechados);
                            stmtCosecha.setString(4, calidadMiel);
                            stmtCosecha.executeUpdate();
                        }
                    }

                    conn.commit();

                    ObjectNode res = mapper.createObjectNode();
                    res.put("mensaje", "Visita y registros guardados con éxito");
                    res.put("id", sesionId);
                    ctx.status(201).json(res);
                } catch (Exception ex) {
                    conn.rollback();
                    throw ex;
                } finally {
                    conn.setAutoCommit(true);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al guardar la visita\"}");
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
