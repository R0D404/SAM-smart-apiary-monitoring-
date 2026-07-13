package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class DashboardControlador {
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerDashboard(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        ObjectNode response = mapper.createObjectNode();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // 1. Obtener nombre del usuario
            String nombreUsuario = "Admin";
            try (PreparedStatement stmt = conn.prepareStatement("SELECT nombre FROM USUARIO WHERE email = ?")) {
                stmt.setString(1, usuarioActual);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        nombreUsuario = rs.getString("nombre");
                    }
                }
            }
            ObjectNode usuarioNode = mapper.createObjectNode();
            usuarioNode.put("nombre", nombreUsuario);
            response.set("usuario", usuarioNode);

            // 2. Stats
            double produccionTotal = 0;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT SUM(kg_miel) as total FROM COSECHA")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) produccionTotal = rs.getDouble("total");
                }
            }

            int colmenasTotal = 0;
            int colmenasActivas = 0;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT count(*) as total, sum(case when estado='activa' then 1 else 0 end) as activas FROM COLMENA")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        colmenasTotal = rs.getInt("total");
                        colmenasActivas = rs.getInt("activas");
                    }
                }
            }

            int alertasActivas = 0;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT count(*) as total FROM ALERTA WHERE atendida = false")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) alertasActivas = rs.getInt("total");
                }
            }

            int apicultores = 0;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT count(*) as total FROM USUARIO WHERE rol_id = (SELECT id FROM CATALAGO_ROL WHERE nombre = 'apicultor' LIMIT 1)")) {
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) apicultores = rs.getInt("total");
                }
            }

            ObjectNode statsNode = mapper.createObjectNode();
            statsNode.put("produccionTotal", String.format("%.1f kg", produccionTotal));
            statsNode.put("colmenasActivas", colmenasActivas + " / " + colmenasTotal);
            statsNode.put("alertasActivas", alertasActivas);
            statsNode.put("apicultores", apicultores);
            response.set("stats", statsNode);

            // 3. Apiarios
            ArrayNode apiariosArray = mapper.createArrayNode();
            try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT a.id, a.nombre, a.estado as ubicacion, " +
                "(SELECT count(*) FROM COLMENA c WHERE c.apiario_id = a.id) as num_colmenas, " +
                "(SELECT count(*) FROM ALERTA al JOIN COLMENA c ON al.colmena_id = c.id WHERE c.apiario_id = a.id AND al.atendida = false AND al.nivel = 'critico') as criticas, " +
                "(SELECT count(*) FROM ALERTA al JOIN COLMENA c ON al.colmena_id = c.id WHERE c.apiario_id = a.id AND al.atendida = false AND al.nivel = 'aviso') as avisos " +
                "FROM APIARIO a")) {
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

            // 4. Producción por colmena (mock por ahora o leer de DB real si hay)
            ObjectNode produccionColmena = mapper.createObjectNode();
            ArrayNode labelsColmena = mapper.createArrayNode();
            ArrayNode dataColmena = mapper.createArrayNode();
            try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT c.codigo, sum(co.kg_miel) as total_miel FROM COLMENA c " +
                "LEFT JOIN COSECHA co ON co.colmena_id = c.id " +
                "GROUP BY c.id ORDER BY total_miel DESC LIMIT 5")) {
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

            // 5. Producción Mensual (mock)
            ObjectNode produccionMensual = mapper.createObjectNode();
            ArrayNode labelsMensual = mapper.createArrayNode();
            ArrayNode dataMensual = mapper.createArrayNode();
            labelsMensual.add("Oct").add("Nov").add("Dic").add("Ene").add("Feb").add("Mar");
            dataMensual.add(45).add(60).add(30).add(0).add(10).add(80);
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
