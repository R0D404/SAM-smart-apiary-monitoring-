package com.sam.controladores; // Este archivo pertenece al paquete controladores dentro de com.sam

// Importamos las herramientas que vamos a necesitar
import com.sam.Conexion;           // Nuestra clase de conexión a MySQL que ya hicimos
import io.javalin.http.Context;   // Context es el objeto de Javalin que representa la petición y la respuesta HTTP
import java.sql.Connection;        // Representa la conexión activa a la base de datos
import java.sql.PreparedStatement; // Para escribir consultas SQL seguras (evita inyección SQL)
import java.sql.ResultSet;         // Almacena los resultados que devuelve una consulta SQL

public class DiagnosticoController {

    // Método estático que Javalin va a llamar cuando el frontend pida /api/diagnostico/{id}
    // Context ctx contiene todo: la petición que llegó, los parámetros de la URL y la respuesta que vamos a mandar
    public static void getDatosColmena(Context ctx) {

        // Leemos el {id} que viene en la URL, por ejemplo /api/diagnostico/3 → colmenaId = 3
        // parseInt convierte el texto "3" al número entero 3
        int colmenaId = Integer.parseInt(ctx.pathParam("id"));

        // Todo lo que haga con la BD va dentro de try/catch
        // Si algo falla (BD caída, id inválido) el catch lo atrapa y manda un error 500
        try {
            // Abrimos la conexión a MySQL usando nuestra clase Conexion
            Connection conn = Conexion.conectar();

            // ── CONSULTA 1: Últimas lecturas de los sensores ───────────────────────────────
            // Text block (las tres comillas) permite escribir SQL en varias líneas sin concatenar Strings
            // El signo ? es un parámetro que después llenamos con setInt() — esto evita inyección SQL
            String sqlLecturas = """
                SELECT tipo_sensor, origen, valor, tasa_cambio, nivel_alerta, timestamp_dispositivo
                FROM LECTURA_SENSOR ls
                JOIN MODULO_MONITOREO mm ON ls.modulo_id = mm.id
                WHERE mm.colmena_id = ?
                ORDER BY timestamp_dispositivo DESC
                LIMIT 10
                """;

            // PreparedStatement prepara la consulta y la deja lista para ejecutar
            PreparedStatement psLecturas = conn.prepareStatement(sqlLecturas);
            // Aquí reemplazamos el primer ? con el id de la colmena que llegó en la URL
            psLecturas.setInt(1, colmenaId);
            // executeQuery() ejecuta el SELECT y guarda los resultados en rsLecturas
            ResultSet rsLecturas = psLecturas.executeQuery();

            // StringBuilder es más eficiente que String para concatenar texto en un ciclo
            StringBuilder lecturas = new StringBuilder();
            // next() avanza fila por fila en los resultados, como recorrer una tabla
            while (rsLecturas.next()) {
                // getString() y getDouble() leen el valor de cada columna por su nombre
                lecturas.append(rsLecturas.getString("tipo_sensor")).append(": ")
                        .append(rsLecturas.getDouble("valor")).append(" (")
                        .append(rsLecturas.getString("origen")).append(") ")
                        .append("nivel: ").append(rsLecturas.getString("nivel_alerta"))
                        .append("\n"); // Salto de línea para separar cada lectura
            }

            // ── CONSULTA 2: Datos generales de la colmena ─────────────────────────────────
            // JOIN une varias tablas en una sola consulta para no hacer varias llamadas a la BD
            // LEFT JOIN en microclima porque puede ser NULL (colmena sin microclima asignado)
            String sqlColmena = """
                SELECT c.codigo, c.ecotipo, c.estado,
                       a.nombre AS apiario, a.municipio, a.estado AS zona,
                       cat.nombre AS microclima
                FROM COLMENA c
                JOIN APIARIO a ON c.apiario_id = a.id
                LEFT JOIN CATALAGO_MICROCLIMA cat ON a.microclima_id = cat.id
                WHERE c.id = ?
                """;

            PreparedStatement psColmena = conn.prepareStatement(sqlColmena);
            psColmena.setInt(1, colmenaId);
            ResultSet rsColmena = psColmena.executeQuery();

            // Declaramos las variables vacías por si la colmena no existe en la BD
            String codigo = "", ecotipo = "", zona = "", microclima = "", apiario = "";
            // if en lugar de while porque esperamos solo una fila (una colmena por id)
            if (rsColmena.next()) {
                codigo     = rsColmena.getString("codigo");
                ecotipo    = rsColmena.getString("ecotipo");
                zona       = rsColmena.getString("zona");
                microclima = rsColmena.getString("microclima");
                apiario    = rsColmena.getString("apiario");
            }

            // ── CONSULTA 3: Últimas alertas de la colmena ─────────────────────────────────
            // Traemos las 5 alertas más recientes para darle contexto a la IA
            String sqlAlertas = """
                SELECT tipo, nivel, mensaje, timestamp
                FROM ALERTA
                WHERE colmena_id = ?
                ORDER BY timestamp DESC
                LIMIT 5
                """;

            PreparedStatement psAlertas = conn.prepareStatement(sqlAlertas);
            psAlertas.setInt(1, colmenaId);
            ResultSet rsAlertas = psAlertas.executeQuery();

            StringBuilder alertas = new StringBuilder();
            while (rsAlertas.next()) {
                // Concatenamos nivel y mensaje para que la IA entienda qué pasó
                alertas.append(rsAlertas.getString("nivel")).append(" - ")
                       .append(rsAlertas.getString("mensaje")).append("\n");
            }

            // ── CONSULTA 4: Últimas visitas de campo ──────────────────────────────────────
            // Las visitas dan contexto humano: qué vio el apicultor cuando revisó la colmena
            String sqlVisitas = """
                SELECT estado_colonia, reina_vista, notas
                FROM VISITA
                WHERE colmena_id = ?
                ORDER BY hora_inicio DESC
                LIMIT 3
                """;

            PreparedStatement psVisitas = conn.prepareStatement(sqlVisitas);
            psVisitas.setInt(1, colmenaId);
            ResultSet rsVisitas = psVisitas.executeQuery();

            StringBuilder visitas = new StringBuilder();
            while (rsVisitas.next()) {
                visitas.append("Estado colonia: ").append(rsVisitas.getString("estado_colonia"))
                       .append(", Reina vista: ").append(rsVisitas.getBoolean("reina_vista"))
                       .append(", Notas: ").append(rsVisitas.getString("notas"))
                       .append("\n");
            }

            // ── CONSULTA 5: Últimas cosechas ──────────────────────────────────────────────
            // Los kg cosechados ayudan a la IA a entender la productividad reciente
            String sqlCosechas = """
                SELECT kg_miel, calidad
                FROM COSECHA
                WHERE colmena_id = ?
                ORDER BY id DESC
                LIMIT 3
                """;

            PreparedStatement psCosechas = conn.prepareStatement(sqlCosechas);
            psCosechas.setInt(1, colmenaId);
            ResultSet rsCosechas = psCosechas.executeQuery();

            StringBuilder cosechas = new StringBuilder();
            while (rsCosechas.next()) {
                cosechas.append(rsCosechas.getDouble("kg_miel")).append(" kg - ")
                        .append(rsCosechas.getString("calidad")).append("\n");
            }

            // ── ARMAR EL JSON DE RESPUESTA ─────────────────────────────────────────────────
            // String.format() reemplaza cada %s con el valor correspondiente en orden
            // replace("\n", "\\n") convierte los saltos de línea reales a texto \\n
            // para que el JSON sea válido (los saltos de línea rompen el JSON)
            // replace("\"", "'") reemplaza comillas dobles por simples por la misma razón
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

            // Cerramos la conexión cuando ya no la necesitamos — importante para no saturar MySQL
            conn.close();

            // Le decimos al navegador que la respuesta es JSON
            ctx.contentType("application/json");
            // Mandamos el JSON como respuesta HTTP al frontend
            ctx.result(json);

        } catch (Exception e) {
            // Si algo falló mandamos código 500 (error interno) con el mensaje del error
            // Útil para debuggear sin que el servidor se caiga completamente
            ctx.status(500).result("Error: " + e.getMessage());
        }
    }
}