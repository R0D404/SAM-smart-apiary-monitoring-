package com.sam.controladores;

import io.javalin.http.Context;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class HistorialControlador {

    public static void obtenerHistorial(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }
        String rol = ctx.sessionAttribute("rol");

        Dotenv dotenv = null;
        try {
            dotenv = Dotenv.load();
        } catch(Exception e) { }
        
        String dbUrl = (dotenv != null && dotenv.get("DB_URL") != null) ? dotenv.get("DB_URL") : "jdbc:mariadb://localhost:3306/SAM";
        String dbUser = (dotenv != null && dotenv.get("DB_USER") != null) ? dotenv.get("DB_USER") : "root";
        String dbPassword = (dotenv != null && dotenv.get("DB_PASSWORD") != null) ? dotenv.get("DB_PASSWORD") : "0981";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
            
            int usuarioId = -1;
            if ("apicultor".equals(rol)) {
                try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM USUARIO WHERE email = ?")) {
                    stmt.setString(1, usuarioActual);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) usuarioId = rs.getInt("id");
                    }
                }
            }
            boolean esApicultor = "apicultor".equals(rol);
            String joinApicultor = esApicultor ? " JOIN COLMENA c ON co.colmena_id = c.id JOIN APIARIO_APICULTOR aa ON aa.apiario_id = c.apiario_id AND aa.usuario_id = " + usuarioId : "";

            Map<String, Object> response = new HashMap<>();

            // 1. Totales y promedios
            String sqlTotales = esApicultor 
                ? "SELECT SUM(co.kg_miel) as total, COUNT(DISTINCT co.colmena_id) as colmenas FROM COSECHA co" + joinApicultor
                : "SELECT SUM(kg_miel) as total, COUNT(DISTINCT colmena_id) as colmenas FROM COSECHA";
            try (PreparedStatement stmt = conn.prepareStatement(sqlTotales);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    double total = rs.getDouble("total");
                    int colmenas = rs.getInt("colmenas");
                    response.put("totalTemporada", String.format(Locale.US, "%.0f kg", total));
                    response.put("promedioColmena", colmenas > 0 ? String.format(Locale.US, "%.0f kg", total / colmenas) : "0 kg");
                }
            }

            // 2. Mejor colmena
            String sqlMejor = "SELECT c.codigo, SUM(co.kg_miel) as total FROM COSECHA co JOIN COLMENA c ON co.colmena_id = c.id " +
                              (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = c.apiario_id AND aa.usuario_id = " + usuarioId + " " : "") +
                              "GROUP BY c.id, c.codigo ORDER BY total DESC LIMIT 1";
            try (PreparedStatement stmt = conn.prepareStatement(sqlMejor);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    response.put("mejorColmena", rs.getString("codigo") + " • " + String.format(Locale.US, "%.0f kg", rs.getDouble("total")));
                } else {
                    response.put("mejorColmena", "N/A");
                }
            }

            // 3. Visitas registradas
            String sqlVisitas = esApicultor
                ? "SELECT COUNT(DISTINCT v.id) as visitas FROM VISITA v JOIN SESION_VISITA s ON v.sesion_id = s.id JOIN APIARIO_APICULTOR aa ON aa.apiario_id = s.apiario_id WHERE aa.usuario_id = " + usuarioId
                : "SELECT COUNT(*) as visitas FROM VISITA";
            try (PreparedStatement stmt = conn.prepareStatement(sqlVisitas);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    response.put("visitasRegistradas", rs.getInt("visitas"));
                }
            }

            // 4. Produccion Acumulada
            String sqlAcum = "SELECT s.fecha, SUM(co.kg_miel) as total FROM COSECHA co JOIN SESION_VISITA s ON co.sesion_id = s.id " +
                             (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = s.apiario_id AND aa.usuario_id = " + usuarioId + " " : "") +
                             "GROUP BY s.fecha ORDER BY s.fecha ASC";
            List<String> labelsAcum = new ArrayList<>();
            List<Double> dataAcum = new ArrayList<>();
            double acumulado = 0;
            SimpleDateFormat sdf = new SimpleDateFormat("MMM", new Locale("es", "ES"));
            try (PreparedStatement stmt = conn.prepareStatement(sqlAcum);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    acumulado += rs.getDouble("total");
                    java.sql.Date sqlDate = rs.getDate("fecha");
                    String mes = sdf.format(sqlDate);
                    labelsAcum.add(mes.substring(0, 1).toUpperCase() + mes.substring(1));
                    dataAcum.add(acumulado);
                }
            }
            Map<String, Object> prodAcumulada = new HashMap<>();
            prodAcumulada.put("labels", labelsAcum);
            prodAcumulada.put("data", dataAcum);
            response.put("produccionAcumulada", prodAcumulada);

            // 5. Produccion por Colmena (Bar chart)
            String sqlPorColmena = "SELECT c.codigo, SUM(co.kg_miel) as total FROM COSECHA co JOIN COLMENA c ON co.colmena_id = c.id " +
                                   (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = c.apiario_id AND aa.usuario_id = " + usuarioId + " " : "") +
                                   "GROUP BY c.id, c.codigo ORDER BY c.codigo ASC";
            List<String> labelsColmena = new ArrayList<>();
            List<Double> dataColmena = new ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(sqlPorColmena);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    labelsColmena.add(rs.getString("codigo"));
                    dataColmena.add(rs.getDouble("total"));
                }
            }
            Map<String, Object> prodColmena = new HashMap<>();
            prodColmena.put("labels", labelsColmena);
            prodColmena.put("data", dataColmena);
            response.put("produccionPorColmena", prodColmena);

            // 6. Historial de Cosechas (Table)
            String sqlHistorial = "SELECT s.fecha, c.codigo, co.kg_miel, co.calidad, co.validado_con_peso FROM COSECHA co JOIN COLMENA c ON co.colmena_id = c.id JOIN SESION_VISITA s ON co.sesion_id = s.id " +
                                  (esApicultor ? "JOIN APIARIO_APICULTOR aa ON aa.apiario_id = c.apiario_id AND aa.usuario_id = " + usuarioId + " " : "") +
                                  "ORDER BY s.fecha DESC, co.id DESC";
            List<Map<String, Object>> historial = new ArrayList<>();
            SimpleDateFormat sdfFull = new SimpleDateFormat("dd MMM yyyy", new Locale("es", "ES"));
            try (PreparedStatement stmt = conn.prepareStatement(sqlHistorial);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> fila = new HashMap<>();
                    java.sql.Date d = rs.getDate("fecha");
                    fila.put("fecha", d != null ? sdfFull.format(d) : "");
                    fila.put("colmena", rs.getString("codigo"));
                    fila.put("kg", rs.getDouble("kg_miel"));
                    fila.put("calidad", rs.getString("calidad") != null ? rs.getString("calidad") : "N/A");
                    fila.put("validada", rs.getBoolean("validado_con_peso") ? "Sí" : "No (sin sensor)");
                    historial.add(fila);
                }
            }
            response.put("historialCosechas", historial);

            ctx.status(200).json(response);

        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json(Map.of("mensaje", "Error interno de servidor", "error", e.getMessage()));
        }
    }
}
