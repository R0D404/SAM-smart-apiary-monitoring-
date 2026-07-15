package com.sam.controladores; // Este archivo pertenece al paquete controladores dentro de com.sam

// Importamos las herramientas que vamos a necesitar
import com.sam.Conexion;           // Nuestra clase de conexión a MySQL que ya hicimos
import io.javalin.http.Context;   // Context es el objeto de Javalin que representa la petición y la respuesta HTTP
import java.sql.Connection;        // Representa la conexión activa a la base de datos
import java.sql.PreparedStatement; // Para escribir consultas SQL seguras (evita inyección SQL)
import java.sql.ResultSet;         // Almacena los resultados que devuelve una consulta SQL

public class DiagnosticoController {

    // Método estático que Javalin va a llamar cuando el frontend pida /api/diagnostico/{id}
    public static void getDatosColmena(Context ctx) {

        // Leemos el {id} que viene en la URL, por ejemplo /api/diagnostico/C-01 -> colmenaCodigo = "C-01"
        String colmenaCodigo = ctx.pathParam("id");

        try {
            // Abrimos la conexión a MySQL usando nuestra clase Conexion
            Connection conn = Conexion.conectar();

            // ── CONSULTA 1: Últimas lecturas de los sensores ───────────────────────────────
            String sqlLecturas = """
                SELECT ls.tipo_sensor, ls.origen, ls.valor, ls.tasa_cambio, ls.nivel_alerta, ls.timestamp_dispositivo
                FROM LECTURA_SENSOR ls
                JOIN MODULO_MONITOREO mm ON ls.modulo_id = mm.id
                JOIN COLMENA c ON mm.colmena_id = c.id
                WHERE c.codigo = ?
                ORDER BY ls.timestamp_dispositivo DESC
                LIMIT 10
                """;

            PreparedStatement psLecturas = conn.prepareStatement(sqlLecturas);
            psLecturas.setString(1, colmenaCodigo);
            ResultSet rsLecturas = psLecturas.executeQuery();

            StringBuilder lecturas = new StringBuilder();
            while (rsLecturas.next()) {
                lecturas.append(rsLecturas.getString("tipo_sensor")).append(": ")
                        .append(rsLecturas.getDouble("valor")).append(" (")
                        .append(rsLecturas.getString("origen")).append(") ")
                        .append("nivel: ").append(rsLecturas.getString("nivel_alerta"))
                        .append("\n");
            }

            // ── CONSULTA 2: Datos generales de la colmena ─────────────────────────────────
            String sqlColmena = """
                SELECT c.codigo, c.ecotipo, c.estado,
                       a.nombre AS apiario, a.municipio, a.estado AS zona,
                       cat.nombre AS microclima
                FROM COLMENA c
                JOIN APIARIO a ON c.apiario_id = a.id
                LEFT JOIN CATALAGO_MICROCLIMA cat ON a.microclima_id = cat.id
                WHERE c.codigo = ?
                """;

            PreparedStatement psColmena = conn.prepareStatement(sqlColmena);
            psColmena.setString(1, colmenaCodigo);
            ResultSet rsColmena = psColmena.executeQuery();

            String codigo = colmenaCodigo, ecotipo = "", zona = "", microclima = "", apiario = "";
            if (rsColmena.next()) {
                codigo     = rsColmena.getString("codigo");
                ecotipo    = rsColmena.getString("ecotipo");
                zona       = rsColmena.getString("zona");
                microclima = rsColmena.getString("microclima");
                apiario    = rsColmena.getString("apiario");
            }

            // ── CONSULTA 3: Últimas alertas de la colmena ─────────────────────────────────
            String sqlAlertas = """
                SELECT a.tipo, a.nivel, a.mensaje, a.timestamp
                FROM ALERTA a
                JOIN COLMENA c ON a.colmena_id = c.id
                WHERE c.codigo = ?
                ORDER BY a.timestamp DESC
                LIMIT 5
                """;

            PreparedStatement psAlertas = conn.prepareStatement(sqlAlertas);
            psAlertas.setString(1, colmenaCodigo);
            ResultSet rsAlertas = psAlertas.executeQuery();

            StringBuilder alertas = new StringBuilder();
            while (rsAlertas.next()) {
                alertas.append(rsAlertas.getString("nivel")).append(" - ")
                       .append(rsAlertas.getString("mensaje")).append("\n");
            }

            // ── CONSULTA 4: Últimas visitas de campo ──────────────────────────────────────
            String sqlVisitas = """
                SELECT v.estado_colonia, v.reina_vista, v.notas
                FROM VISITA v
                JOIN COLMENA c ON v.colmena_id = c.id
                WHERE c.codigo = ?
                ORDER BY v.hora_inicio DESC
                LIMIT 3
                """;

            PreparedStatement psVisitas = conn.prepareStatement(sqlVisitas);
            psVisitas.setString(1, colmenaCodigo);
            ResultSet rsVisitas = psVisitas.executeQuery();

            StringBuilder visitas = new StringBuilder();
            while (rsVisitas.next()) {
                visitas.append("Estado colonia: ").append(rsVisitas.getString("estado_colonia"))
                       .append(", Reina vista: ").append(rsVisitas.getBoolean("reina_vista"))
                       .append(", Notas: ").append(rsVisitas.getString("notas"))
                       .append("\n");
            }

            // ── CONSULTA 5: Últimas cosechas ──────────────────────────────────────────────
            String sqlCosechas = """
                SELECT co.kg_miel, co.calidad
                FROM COSECHA co
                JOIN COLMENA c ON co.colmena_id = c.id
                WHERE c.codigo = ?
                ORDER BY co.id DESC
                LIMIT 3
                """;

            PreparedStatement psCosechas = conn.prepareStatement(sqlCosechas);
            psCosechas.setString(1, colmenaCodigo);
            ResultSet rsCosechas = psCosechas.executeQuery();

            StringBuilder cosechas = new StringBuilder();
            while (rsCosechas.next()) {
                cosechas.append(rsCosechas.getDouble("kg_miel")).append(" kg - ")
                        .append(rsCosechas.getString("calidad")).append("\n");
            }

            // ── ARMAR EL JSON DE RESPUESTA ─────────────────────────────────────────────────
            String json = String.format("""
                {
                    "colmena": "%s",
                    "ecotipo": "%s",
                    "apiario": "%s",
                    "zona": "%s",
                    "microclima": "%s",
                    "lecturas": "%s",
                    "alertas": "%s",
                    "visitas": "%s",
                    "cosechas": "%s"
                }
                """,
                codigo, ecotipo, apiario, zona, microclima,
                lecturas.toString().replace("\n", "\\n").replace("\"", "'"),
                alertas.toString().replace("\n", "\\n").replace("\"", "'"),
                visitas.toString().replace("\n", "\\n").replace("\"", "'"),
                cosechas.toString().replace("\n", "\\n").replace("\"", "'")
            );

            conn.close();

            ctx.contentType("application/json");
            ctx.result(json);

        } catch (Exception e) {
            ctx.status(500).result("Error: " + e.getMessage());
        }
    }
}