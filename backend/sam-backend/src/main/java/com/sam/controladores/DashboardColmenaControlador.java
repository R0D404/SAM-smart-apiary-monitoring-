package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.text.SimpleDateFormat;
import java.util.Date;

public class DashboardColmenaControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerDashboardColmena(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String colmenaCodigo = ctx.queryParam("id");
        if (colmenaCodigo == null || colmenaCodigo.trim().isEmpty()) {
            ctx.status(400).json("{\"mensaje\": \"ID inválido\"}");
            return;
        }

        ObjectNode response = mapper.createObjectNode();
        response.put("codigo", colmenaCodigo);

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // Obtener nombre del usuario
            String nombreUsuario = "Apicultor";
            int usuarioId = -1;
            String rol = ctx.sessionAttribute("rol");

            try (PreparedStatement stmt = conn.prepareStatement("SELECT id, nombre FROM USUARIO WHERE email = ?")) {
                stmt.setString(1, usuarioActual);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        usuarioId = rs.getInt("id");
                        nombreUsuario = rs.getString("nombre");
                    }
                }
            }
            ObjectNode usuarioNode = mapper.createObjectNode();
            usuarioNode.put("nombre", nombreUsuario);
            response.set("usuario", usuarioNode);
            // 1. Info Colmena y Apiario
            String sqlColmena = "SELECT c.id as c_id, c.ecotipo, a.nombre as apiario_nombre " +
                    "FROM COLMENA c JOIN APIARIO a ON c.apiario_id = a.id " +
                    ("apicultor".equals(rol) ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                    "WHERE c.codigo = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlColmena)) {
                stmt.setString(1, colmenaCodigo);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        response.put("apiario", rs.getString("apiario_nombre"));
                        response.put("ecotipo", rs.getString("ecotipo"));
                        int colmenaId = rs.getInt("c_id");

                        // 2. Diagnóstico IA mock o basado en alertas
                        ObjectNode iaDiag = mapper.createObjectNode();
                        try (PreparedStatement stmtIa = conn.prepareStatement(
                            "SELECT nivel, mensaje FROM ALERTA WHERE colmena_id = ? AND atendida = false ORDER BY timestamp DESC LIMIT 1")) {
                            stmtIa.setInt(1, colmenaId);
                            try (ResultSet rsIa = stmtIa.executeQuery()) {
                                if (rsIa.next()) {
                                    iaDiag.put("estado", "critico".equals(rsIa.getString("nivel")) ? "Crítico" : "Aviso");
                                    iaDiag.put("mensaje", rsIa.getString("mensaje"));
                                } else {
                                    iaDiag.put("estado", "Saludable");
                                    iaDiag.put("mensaje", "Sin alertas activas");
                                }
                            }
                        }
                        response.set("iaDiagnostico", iaDiag);

                        // 3. Lecturas
                        ArrayNode lecturasArray = mapper.createArrayNode();
                        // 3a. Última lectura de todas las métricas
                        ObjectNode lecturaActual = mapper.createObjectNode();
                        
                        try (PreparedStatement stmtLecturaAct = conn.prepareStatement(
                            "SELECT tipo_sensor, valor, DATE_FORMAT(timestamp_dispositivo, '%d %b') as fecha_fmt " +
                            "FROM LECTURA_SENSOR l " +
                            "JOIN MODULO_MONITOREO m ON l.modulo_id = m.id " +
                            "WHERE m.colmena_id = ? " +
                            "ORDER BY timestamp_dispositivo DESC LIMIT 10")) {
                            stmtLecturaAct.setInt(1, colmenaId);
                            try (ResultSet rsLect = stmtLecturaAct.executeQuery()) {
                                boolean fechaSet = false;
                                while (rsLect.next()) {
                                    String tipo = rsLect.getString("tipo_sensor");
                                    double val = rsLect.getDouble("valor");
                                    if ("peso".equals(tipo) && !lecturaActual.has("peso")) lecturaActual.put("peso", val);
                                    if ("temp".equals(tipo) && !lecturaActual.has("temp_interna")) lecturaActual.put("temp_interna", val);
                                    if ("humedad".equals(tipo) && !lecturaActual.has("hum_interna")) lecturaActual.put("hum_interna", val);
                                    
                                    if (!fechaSet) {
                                        lecturaActual.put("fecha", rsLect.getString("fecha_fmt"));
                                        fechaSet = true;
                                    }
                                }
                            }
                        }
                        // Default values if empty
                        if (!lecturaActual.has("fecha")) {
                            SimpleDateFormat sdf = new SimpleDateFormat("dd MMM");
                            lecturaActual.put("fecha", sdf.format(new Date()));
                            lecturaActual.put("peso", 0.0);
                            lecturaActual.put("temp_interna", 0.0);
                            lecturaActual.put("hum_interna", 0.0);
                        }
                        lecturasArray.add(lecturaActual);

                        // 3b. Historial de peso para el chart (ultimas 30 lecturas)
                        try (PreparedStatement stmtPesoHist = conn.prepareStatement(
                            "SELECT valor, DATE_FORMAT(timestamp_dispositivo, '%d %b %H:%i') as fecha_fmt " +
                            "FROM LECTURA_SENSOR l " +
                            "JOIN MODULO_MONITOREO m ON l.modulo_id = m.id " +
                            "WHERE m.colmena_id = ? AND l.tipo_sensor = 'peso' " +
                            "ORDER BY timestamp_dispositivo DESC LIMIT 30")) {
                            stmtPesoHist.setInt(1, colmenaId);
                            try (ResultSet rsPeso = stmtPesoHist.executeQuery()) {
                                while (rsPeso.next()) {
                                    ObjectNode hist = mapper.createObjectNode();
                                    hist.put("peso", rsPeso.getDouble("valor"));
                                    hist.put("fecha", rsPeso.getString("fecha_fmt"));
                                    lecturasArray.add(hist);
                                }
                            }
                        }
                        response.set("lecturas", lecturasArray);

                        // 4. Alertas Recientes
                        ArrayNode alertasArray = mapper.createArrayNode();
                        try (PreparedStatement stmtAlertas = conn.prepareStatement(
                            "SELECT nivel, mensaje, DATE_FORMAT(timestamp, '%d %b') as fecha_fmt " +
                            "FROM ALERTA " +
                            "WHERE colmena_id = ? " +
                            "ORDER BY timestamp DESC LIMIT 5")) {
                            stmtAlertas.setInt(1, colmenaId);
                            try (ResultSet rsAlertas = stmtAlertas.executeQuery()) {
                                while (rsAlertas.next()) {
                                    ObjectNode a = mapper.createObjectNode();
                                    a.put("nivel", rsAlertas.getString("nivel"));
                                    a.put("mensaje", rsAlertas.getString("mensaje"));
                                    a.put("fecha", rsAlertas.getString("fecha_fmt"));
                                    alertasArray.add(a);
                                }
                            }
                        }
                        response.set("alertas", alertasArray);

                        // 5. Historial (Visitas y Cosechas)
                        ArrayNode historialArray = mapper.createArrayNode();
                        try (PreparedStatement stmtHist = conn.prepareStatement(
                            "(SELECT 'Cosecha' as tipo, s.fecha, " +
                            "CONCAT(c.kg_miel, ' kg · ', c.calidad, IF(c.validado_con_peso, ' · validada con peso', '')) as resumen " +
                            "FROM COSECHA c JOIN SESION_VISITA s ON c.sesion_id = s.id WHERE c.colmena_id = ?) " +
                            "UNION " +
                            "(SELECT 'Visita' as tipo, s.fecha, " +
                            "v.notas as resumen " +
                            "FROM VISITA v JOIN SESION_VISITA s ON v.sesion_id = s.id WHERE v.colmena_id = ?) " +
                            "ORDER BY fecha DESC LIMIT 5")) {
                            stmtHist.setInt(1, colmenaId);
                            stmtHist.setInt(2, colmenaId);
                            try (ResultSet rsHist = stmtHist.executeQuery()) {
                                while (rsHist.next()) {
                                    ObjectNode h = mapper.createObjectNode();
                                    h.put("tipo", rsHist.getString("tipo"));
                                    
                                    Date f = rsHist.getDate("fecha");
                                    SimpleDateFormat sdf = new SimpleDateFormat("dd MMM");
                                    h.put("fecha", f != null ? sdf.format(f) : "");
                                    
                                    h.put("resumen", rsHist.getString("resumen") != null ? rsHist.getString("resumen") : "");
                                    historialArray.add(h);
                                }
                            }
                        }
                        response.set("historial", historialArray);
                    } else {
                        ctx.status(404).json("{\"mensaje\": \"Colmena no encontrada\"}");
                        return;
                    }
                }
            }
            ctx.json(response);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error de base de datos\"}");
        }
    }
}
