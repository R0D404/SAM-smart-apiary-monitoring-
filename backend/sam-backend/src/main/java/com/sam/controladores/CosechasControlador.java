package com.sam.controladores;

import io.javalin.http.Context;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.cdimascio.dotenv.Dotenv;

public class CosechasControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerResumen(Context ctx) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ObjectNode res = mapper.createObjectNode();
            
            // 1. Total Temporada
            String sqlTotal = "SELECT SUM(kg_miel) as total FROM COSECHA";
            try (PreparedStatement stmt = conn.prepareStatement(sqlTotal); ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    res.put("totalTemporada", rs.getDouble("total"));
                } else {
                    res.put("totalTemporada", 0);
                }
            }

            // 2. Promedio por colmena
            String sqlPromedio = "SELECT AVG(total_col) as promedio FROM (SELECT SUM(kg_miel) as total_col FROM COSECHA GROUP BY colmena_id) as subquery";
            try (PreparedStatement stmt = conn.prepareStatement(sqlPromedio); ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    res.put("promedioColmena", rs.getDouble("promedio"));
                } else {
                    res.put("promedioColmena", 0);
                }
            }

            // 3. Validadas con sensor
            String sqlValidadas = "SELECT (SUM(validado_con_peso) / COUNT(*)) * 100 as porcentaje FROM COSECHA";
            try (PreparedStatement stmt = conn.prepareStatement(sqlValidadas); ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    res.put("porcentajeValidado", rs.getDouble("porcentaje"));
                } else {
                    res.put("porcentajeValidado", 0);
                }
            }

            ctx.status(200).json(res);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void listarCosechas(Context ctx) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode cosechas = mapper.createArrayNode();
            String sql = "SELECT DATE_FORMAT(sv.fecha, '%d %b') as fecha, " +
                         "c.codigo as colmena, " +
                         "u.nombre as apicultor, " +
                         "co.kg_miel as kg, " +
                         "co.calidad, " +
                         "co.validado_con_peso " +
                         "FROM COSECHA co " +
                         "JOIN COLMENA c ON co.colmena_id = c.id " +
                         "JOIN SESION_VISITA sv ON co.sesion_id = sv.id " +
                         "JOIN USUARIO u ON sv.usuario_id = u.id " +
                         "ORDER BY sv.fecha DESC";
                         
            try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ObjectNode node = mapper.createObjectNode();
                    node.put("fecha", rs.getString("fecha"));
                    node.put("colmena", rs.getString("colmena"));
                    node.put("apicultor", rs.getString("apicultor"));
                    node.put("kg", rs.getDouble("kg"));
                    node.put("calidad", rs.getString("calidad"));
                    node.put("validado_con_peso", rs.getBoolean("validado_con_peso"));
                    cosechas.add(node);
                }
            }
            ctx.status(200).json(cosechas);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void graficaProduccion(Context ctx) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            ArrayNode grafica = mapper.createArrayNode();
            String sql = "SELECT c.codigo as colmena, SUM(co.kg_miel) as total " +
                         "FROM COSECHA co JOIN COLMENA c ON co.colmena_id = c.id " +
                         "GROUP BY c.codigo ORDER BY c.codigo";
            try (PreparedStatement stmt = conn.prepareStatement(sql); ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ObjectNode node = mapper.createObjectNode();
                    node.put("colmena", rs.getString("colmena"));
                    node.put("total", rs.getDouble("total"));
                    grafica.add(node);
                }
            }
            ctx.status(200).json(grafica);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }
}
