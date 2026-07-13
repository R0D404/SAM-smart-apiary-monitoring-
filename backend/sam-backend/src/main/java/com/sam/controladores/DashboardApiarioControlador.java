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

public class DashboardApiarioControlador {
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void obtenerDashboardApiario(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        String idParam = ctx.pathParam("id");
        int apiarioId = 0;
        try {
            apiarioId = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            ctx.status(400).json("{\"mensaje\": \"ID inválido\"}");
            return;
        }

        ObjectNode response = mapper.createObjectNode();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // 1. Apiario Info
            ObjectNode apiarioNode = mapper.createObjectNode();
            try (PreparedStatement stmt = conn.prepareStatement("SELECT nombre, localidad, municipio FROM APIARIO WHERE id = ?")) {
                stmt.setInt(1, apiarioId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        apiarioNode.put("nombre", rs.getString("nombre"));
                        apiarioNode.put("ubicacion", rs.getString("localidad") + ", " + rs.getString("municipio"));
                    } else {
                        ctx.status(404).json("{\"mensaje\": \"Apiario no encontrado\"}");
                        return;
                    }
                }
            }
            response.set("apiario", apiarioNode);

            // 2. Colmenas Data
            ArrayNode colmenasArray = mapper.createArrayNode();
            int colmenasTotal = 0;
            int alertasActivas = 0;
            try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT c.id, c.codigo, c.estado, " +
                "(SELECT count(*) FROM ALERTA al WHERE al.colmena_id = c.id AND al.atendida = false AND al.nivel = 'critico') as criticas, " +
                "(SELECT count(*) FROM ALERTA al WHERE al.colmena_id = c.id AND al.atendida = false AND al.nivel = 'aviso') as avisos, " +
                "(SELECT ROUND(valor, 1) FROM LECTURA_SENSOR l JOIN MODULO_MONITOREO m ON l.modulo_id = m.id WHERE m.colmena_id = c.id AND l.tipo_sensor = 'peso' ORDER BY l.timestamp_dispositivo DESC LIMIT 1) as peso, " +
                "(SELECT ROUND(valor, 1) FROM LECTURA_SENSOR l JOIN MODULO_MONITOREO m ON l.modulo_id = m.id WHERE m.colmena_id = c.id AND l.tipo_sensor = 'temp' ORDER BY l.timestamp_dispositivo DESC LIMIT 1) as temp, " +
                "(SELECT ROUND(valor, 1) FROM LECTURA_SENSOR l JOIN MODULO_MONITOREO m ON l.modulo_id = m.id WHERE m.colmena_id = c.id AND l.tipo_sensor = 'humedad' ORDER BY l.timestamp_dispositivo DESC LIMIT 1) as humedad " +
                "FROM COLMENA c WHERE c.apiario_id = ?")) {
                stmt.setInt(1, apiarioId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        colmenasTotal++;
                        ObjectNode colmena = mapper.createObjectNode();
                        colmena.put("id", rs.getString("codigo"));
                        
                        int criticas = rs.getInt("criticas");
                        int avisos = rs.getInt("avisos");
                        if (criticas > 0) {
                            colmena.put("estado", "rojo");
                            colmena.put("estadoTexto", "Atención Requerida");
                            alertasActivas++;
                        } else if (avisos > 0) {
                            colmena.put("estado", "amarillo");
                            colmena.put("estadoTexto", "Aviso");
                            alertasActivas++;
                        } else {
                            colmena.put("estado", "verde");
                            colmena.put("estadoTexto", "Saludable");
                        }
                        
                        double peso = rs.getDouble("peso");
                        if (rs.wasNull()) colmena.put("peso", "--");
                        else colmena.put("peso", String.valueOf(peso));
                        
                        double temp = rs.getDouble("temp");
                        if (rs.wasNull()) colmena.put("temp", "--");
                        else colmena.put("temp", String.valueOf(temp));
                        
                        double hum = rs.getDouble("humedad");
                        if (rs.wasNull()) colmena.put("humedad", "--");
                        else colmena.put("humedad", String.valueOf(hum));
                        
                        colmenasArray.add(colmena);
                    }
                }
            }
            response.set("colmenas", colmenasArray);
            // 3. Stats Generales del apiario
            String ultimaVisita = "--";
            try (PreparedStatement stmt = conn.prepareStatement("SELECT MAX(fecha) as ultima FROM SESION_VISITA WHERE apiario_id = ?")) {
                stmt.setInt(1, apiarioId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next() && rs.getDate("ultima") != null) {
                        ultimaVisita = rs.getDate("ultima").toString();
                    }
                }
            }

            double pesoPromedio = 0;
            boolean tienePeso = false;
            try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT AVG(ultima_lectura) as prom FROM (" +
                "  SELECT (SELECT valor FROM LECTURA_SENSOR l JOIN MODULO_MONITOREO m ON l.modulo_id = m.id WHERE m.colmena_id = c.id AND l.tipo_sensor = 'peso' ORDER BY l.timestamp_dispositivo DESC LIMIT 1) as ultima_lectura " +
                "  FROM COLMENA c WHERE c.apiario_id = ? " +
                ") as sub WHERE ultima_lectura IS NOT NULL")) {
                stmt.setInt(1, apiarioId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        pesoPromedio = rs.getDouble("prom");
                        if (!rs.wasNull()) tienePeso = true;
                    }
                }
            }

            ObjectNode statsNode = mapper.createObjectNode();
            if (colmenasTotal == 0) {
                statsNode.put("saludEstado", "N/A");
                statsNode.put("saludDesc", "Sin colmenas");
            } else {
                statsNode.put("saludEstado", alertasActivas > 0 ? "Crítico" : "Óptimo");
                statsNode.put("saludDesc", alertasActivas > 0 ? "Revisión urgente" : "Parámetros normales");
            }
            statsNode.put("pesoPromedio", tienePeso ? String.format("%.1f kg", pesoPromedio) : "--");
            statsNode.put("alertasActivas", colmenasTotal == 0 ? "--" : String.valueOf(alertasActivas));
            statsNode.put("ultimaVisita", ultimaVisita);
            response.set("stats", statsNode);

            // 4. Evolucion Peso (Chart)
            if (colmenasTotal > 0 && tienePeso) {
                ObjectNode evolucionPeso = mapper.createObjectNode();
                ArrayNode labels = mapper.createArrayNode();
                ArrayNode data = mapper.createArrayNode();
                
                try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT DATE_FORMAT(dia, '%a') as dia_semana, peso_promedio FROM (" +
                    "  SELECT DATE(timestamp_dispositivo) as dia, AVG(valor) as peso_promedio " +
                    "  FROM LECTURA_SENSOR l " +
                    "  JOIN MODULO_MONITOREO m ON l.modulo_id = m.id " +
                    "  JOIN COLMENA c ON m.colmena_id = c.id " +
                    "  WHERE c.apiario_id = ? AND l.tipo_sensor = 'peso' " +
                    "  GROUP BY DATE(timestamp_dispositivo) " +
                    "  ORDER BY dia DESC LIMIT 7" +
                    ") sub ORDER BY dia ASC")) {
                    stmt.setInt(1, apiarioId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                            labels.add(rs.getString("dia_semana"));
                            data.add(Math.round(rs.getDouble("peso_promedio") * 10.0) / 10.0);
                        }
                    }
                }
                
                // Si no hay 7 dias de datos, o esta vacio, enviar al menos un punto
                if (data.size() == 0) {
                    labels.add("Hoy");
                    data.add(Math.round(pesoPromedio * 10.0) / 10.0);
                }

                ArrayNode datasets = mapper.createArrayNode();
                ObjectNode ds = mapper.createObjectNode();
                ds.put("label", "Peso promedio (kg)");
                ds.set("data", data);
                datasets.add(ds);
                evolucionPeso.set("labels", labels);
                evolucionPeso.set("datasets", datasets);
                response.set("evolucionPeso", evolucionPeso);
            }

            ctx.status(200).json(response);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error del servidor\"}");
        }
    }
}
