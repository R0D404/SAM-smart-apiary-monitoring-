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
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
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
            // 1. Info Colmena y Apiario
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT c.id as c_id, c.ecotipo, a.nombre as apiario_nombre " +
                    "FROM COLMENA c JOIN APIARIO a ON c.apiario_id = a.id WHERE c.codigo = ?")) {
                stmt.setString(1, colmenaCodigo);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        response.put("apiario", rs.getString("apiario_nombre"));
                        response.put("ecotipo", rs.getString("ecotipo"));
                        int colmenaId = rs.getInt("c_id");

                        // 2. Diagnóstico IA mock
                        ObjectNode iaDiag = mapper.createObjectNode();
                        iaDiag.put("estado", "Aviso");
                        iaDiag.put("mensaje", "Humedad interna elevada");
                        response.set("iaDiagnostico", iaDiag);

                        // 3. Última lectura (Mockeada)
                        ArrayNode lecturasArray = mapper.createArrayNode();
                        ObjectNode lectura = mapper.createObjectNode();
                        lectura.put("peso", 38.4);
                        lectura.put("temp_interna", 34.6);
                        lectura.put("hum_interna", 78.0);
                        
                        SimpleDateFormat sdf = new SimpleDateFormat("dd MMM");
                        lectura.put("fecha", sdf.format(new Date()));
                        lecturasArray.add(lectura);
                        
                        // Fake history data for chart
                        for(int i=1; i<30; i+=3) {
                            ObjectNode hist = mapper.createObjectNode();
                            hist.put("peso", 38.4 - (Math.random() * 5));
                            hist.put("fecha", "Hace " + i + " d");
                            lecturasArray.add(hist);
                        }
                        response.set("lecturas", lecturasArray);

                        // 4. Alertas Recientes (Mockeadas)
                        ArrayNode alertasArray = mapper.createArrayNode();
                        ObjectNode a1 = mapper.createObjectNode();
                        a1.put("nivel", "aviso");
                        a1.put("mensaje", "Hum. interna 78%");
                        a1.put("fecha", "hoy");
                        
                        ObjectNode a2 = mapper.createObjectNode();
                        a2.put("nivel", "critico");
                        a2.put("mensaje", "Peso -3kg en 2h");
                        a2.put("fecha", "24 may");
                        
                        ObjectNode a3 = mapper.createObjectNode();
                        a3.put("nivel", "normal");
                        a3.put("mensaje", "Temp. estable");
                        a3.put("fecha", "22 may");
                        
                        alertasArray.add(a1);
                        alertasArray.add(a2);
                        alertasArray.add(a3);
                        response.set("alertas", alertasArray);

                        // 5. Historial (Mockeado)
                        ArrayNode historialArray = mapper.createArrayNode();
                        ObjectNode h1 = mapper.createObjectNode();
                        h1.put("tipo", "Cosecha");
                        h1.put("fecha", "24 may");
                        h1.put("resumen", "12 kg · validada con peso");
                        
                        ObjectNode h2 = mapper.createObjectNode();
                        h2.put("tipo", "Visita");
                        h2.put("fecha", "18 may");
                        h2.put("resumen", "Reina vista, cría sana");
                        
                        ObjectNode h3 = mapper.createObjectNode();
                        h3.put("tipo", "Cosecha");
                        h3.put("fecha", "02 may");
                        h3.put("resumen", "9 kg · validada");
                        
                        historialArray.add(h1);
                        historialArray.add(h2);
                        historialArray.add(h3);
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
