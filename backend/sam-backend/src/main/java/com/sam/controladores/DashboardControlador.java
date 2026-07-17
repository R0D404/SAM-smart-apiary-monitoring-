package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class DashboardControlador {
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerDashboard(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        String rolUsuario = ctx.sessionAttribute("rolUsuario");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        
        boolean esApicultor = "apicultor".equals(rolUsuario);

        ObjectNode response = mapper.createObjectNode();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // 1. Obtener ID y nombre del usuario
            String nombreUsuario = "Usuario";
            int usuarioId = -1;
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

            // Condición extra para apicultor
            String joinApiarioFiltro = esApicultor ? " JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId : "";
            String whereApiarioFiltro = esApicultor ? " AND a.id IN (SELECT apiario_id FROM APIARIO_APICULTOR WHERE usuario_id = " + usuarioId + ")" : "";

            // 2. Stats
            double produccionTotal = 0;
            String queryProd = "SELECT SUM(kg_miel) as total FROM COSECHA co JOIN COLMENA c ON co.colmena_id = c.id JOIN APIARIO a ON c.apiario_id = a.id" + whereApiarioFiltro;
            try (PreparedStatement stmt = conn.prepareStatement(queryProd)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) produccionTotal = rs.getDouble("total");
                }
            }

            int colmenasTotal = 0;
            int colmenasActivas = 0;
            String queryCol = "SELECT count(*) as total, sum(case when c.estado='activa' then 1 else 0 end) as activas FROM COLMENA c JOIN APIARIO a ON c.apiario_id = a.id WHERE c.estado <> 'de_baja'" + whereApiarioFiltro;
            try (PreparedStatement stmt = conn.prepareStatement(queryCol)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        colmenasTotal = rs.getInt("total");
                        colmenasActivas = rs.getInt("activas");
                    }
                }
            }

            int alertasActivas = 0;
            String queryAlertas = "SELECT COUNT(*) as total FROM ALERTA al JOIN COLMENA c ON al.colmena_id = c.id JOIN APIARIO a ON c.apiario_id = a.id WHERE al.atendida = false" + whereApiarioFiltro;
            try (PreparedStatement stmt = conn.prepareStatement(queryAlertas)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) alertasActivas = rs.getInt("total");
                }
            }

            int totalApicultores = 0;
            if (!esApicultor) {
                // Admin ve total apicultores
                String queryApic = "SELECT count(*) as total FROM USUARIO WHERE rol_id = (SELECT id FROM CATALAGO_ROL WHERE nombre = 'apicultor' LIMIT 1)";
                try (PreparedStatement stmt = conn.prepareStatement(queryApic)) {
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) totalApicultores = rs.getInt("total");
                    }
                }
            } else {
                // Apicultor no necesita este stat, pero podemos mandar 0
                totalApicultores = 0;
            }

            // 3. Apiarios (Lista)
            ArrayNode listaApiarios = mapper.createArrayNode();
            String queryListaApi = "SELECT a.id, a.nombre, a.ubicacion, a.zona_climatica, " +
                "(SELECT count(*) FROM COLMENA c WHERE c.apiario_id = a.id) as num_colmenas " +
                "FROM APIARIO a " +
                (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                "ORDER BY a.nombre ASC";

            ObjectNode statsNode = mapper.createObjectNode();
            statsNode.put("produccionTotal", String.format("%.1f kg", produccionTotal));
            statsNode.put("colmenasActivas", colmenasActivas + " / " + colmenasTotal);
            statsNode.put("alertasActivas", alertasActivas);
            if (!esApicultor) {
                statsNode.put("apicultores", totalApicultores);
            }
            response.set("stats", statsNode);

            // 3. Apiarios
            ArrayNode apiariosArray = mapper.createArrayNode();
            String queryApiarios = 
                "SELECT a.id, a.nombre, a.estado as ubicacion, " +
                "(SELECT count(*) FROM COLMENA c WHERE c.apiario_id = a.id AND c.estado <> 'de_baja') as num_colmenas, " +
                "(SELECT count(*) FROM ALERTA al JOIN COLMENA c ON al.colmena_id = c.id WHERE c.apiario_id = a.id AND al.atendida = false AND al.nivel = 'critico' AND c.estado <> 'de_baja') as criticas, " +
                "(SELECT count(*) FROM ALERTA al JOIN COLMENA c ON al.colmena_id = c.id WHERE c.apiario_id = a.id AND al.atendida = false AND al.nivel = 'aviso' AND c.estado <> 'de_baja') as avisos " +
                "FROM APIARIO a " +
                (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = a.id AND aa.usuario_id = " + usuarioId + " " : "") +
                "WHERE a.estado IS NULL OR a.estado <> 'de_baja'";
                
            try (PreparedStatement stmt = conn.prepareStatement(queryApiarios)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        ObjectNode apiario = mapper.createObjectNode();
                        apiario.put("id", rs.getInt("id"));
                        apiario.put("nombre", rs.getString("nombre"));
                        apiario.put("ubicacion", rs.getString("ubicacion"));
                        apiario.put("colmenas", rs.getInt("num_colmenas"));
                        
                        int criticas = rs.getInt("criticas");
                        int avisos = rs.getInt("avisos");
                        if (criticas > 0) {
                            apiario.put("estado", "rojo");
                            apiario.put("estadoTexto", "Crítico");
                        } else if (avisos > 0) {
                            apiario.put("estado", "amarillo");
                            apiario.put("estadoTexto", "Aviso");
                        } else {
                            apiario.put("estado", "verde");
                            apiario.put("estadoTexto", "Verde");
                        }
                        apiariosArray.add(apiario);
                    }
                }
            }
            response.set("apiarios", apiariosArray);

            // 4. Producción por colmena
            ObjectNode produccionColmena = mapper.createObjectNode();
            ArrayNode labelsColmena = mapper.createArrayNode();
            ArrayNode dataColmena = mapper.createArrayNode();
            String queryProdCol = 
                "SELECT c.codigo, sum(co.kg_miel) as total_miel FROM COLMENA c " +
                "JOIN APIARIO a ON c.apiario_id = a.id " +
                "LEFT JOIN COSECHA co ON co.colmena_id = c.id " +
                "WHERE c.estado <> 'de_baja' " + whereApiarioFiltro +
                " GROUP BY c.id, c.codigo ORDER BY total_miel DESC LIMIT 5";
            try (PreparedStatement stmt = conn.prepareStatement(queryProdCol)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while(rs.next()) {
                        labelsColmena.add(rs.getString("codigo"));
                        double val = rs.getDouble("total_miel");
                        dataColmena.add(val > 0 ? val : 0);
                    }
                }
            }
            produccionColmena.set("labels", labelsColmena);
            produccionColmena.set("data", dataColmena);
            response.set("produccionColmena", produccionColmena);

            // 5. Producción Mensual (Dinámica)
            ObjectNode produccionMensual = mapper.createObjectNode();
            ArrayNode labelsMensual = mapper.createArrayNode();
            ArrayNode dataMensual = mapper.createArrayNode();
            String queryProdMes = 
                "SELECT DATE_FORMAT(sv.fecha, '%b') as mes, MONTH(sv.fecha) as m_num, SUM(co.kg_miel) as total " +
                "FROM COSECHA co " +
                "JOIN SESION_VISITA sv ON co.sesion_id = sv.id " +
                "JOIN COLMENA c ON co.colmena_id = c.id " +
                "JOIN APIARIO a ON c.apiario_id = a.id " +
                "WHERE YEAR(sv.fecha) = YEAR(CURDATE()) " + whereApiarioFiltro +
                " GROUP BY mes, m_num ORDER BY m_num ASC LIMIT 6";
            try (PreparedStatement stmt = conn.prepareStatement(queryProdMes)) {
                try (ResultSet rs = stmt.executeQuery()) {
                    boolean hasData = false;
                    while(rs.next()) {
                        hasData = true;
                        labelsMensual.add(rs.getString("mes"));
                        dataMensual.add(rs.getDouble("total"));
                    }
                    if (!hasData) {
                        labelsMensual.add("Sin datos");
                        dataMensual.add(0);
                    }
                }
            }
            produccionMensual.set("labels", labelsMensual);
            produccionMensual.set("data", dataMensual);
            response.set("produccionMensual", produccionMensual);

            ctx.status(200).json(response);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error del servidor\"}");
        }
    }
}
