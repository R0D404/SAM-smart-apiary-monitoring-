package com.sam.controladores;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonArray;
import io.github.cdimascio.dotenv.Dotenv;
import io.javalin.http.Context;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GroqController {

    // Cargamos las variables del .env
    private static final Dotenv dotenv = Dotenv.load();
    private static final String API_KEY  = dotenv.get("GROQ_API_KEY");
    private static final String GROQ_URL = dotenv.get("GROQ_URL");
    private static final String MODEL    = dotenv.get("GROQ_MODEL");

    public static void generarDiagnostico(Context ctx) {
        try {
            // Leemos el body que mandó el frontend
            String bodyRecibido = ctx.body();
            System.out.println("Body recibido: " + bodyRecibido);

            // Parseamos el JSON que llegó para extraer los datos
            JsonObject datos = JsonParser.parseString(bodyRecibido).getAsJsonObject();

            // Armamos el prompt con los datos de la colmena
            String prompt = "Eres un experto en apicultura. Analiza estos datos y genera un diagnostico.\n" +
                "Colmena: " + getStr(datos, "colmena") + "\n" +
                "Ecotipo: " + getStr(datos, "ecotipo") + "\n" +
                "Apiario: " + getStr(datos, "apiario") + "\n" +
                "Zona: " + getStr(datos, "zona") + "\n" +
                "Microclima: " + getStr(datos, "microclima") + "\n" +
                "Lecturas: " + getStr(datos, "lecturas") + "\n" +
                "Alertas: " + getStr(datos, "alertas") + "\n" +
                "Visitas: " + getStr(datos, "visitas") + "\n" +
                "Cosechas: " + getStr(datos, "cosechas") + "\n\n" +
                "Responde UNICAMENTE en este formato JSON sin texto extra:\n" +
                "{\n" +
                "  \"estado\": \"frase corta del estado general\",\n" +
                "  \"causa_probable\": \"explicacion de la causa\",\n" +
                "  \"acciones\": [\"accion 1\", \"accion 2\", \"accion 3\"]\n" +
                "}";

            // Usamos Gson para armar el JSON de Groq de forma segura
            // Así evitamos problemas con comillas y caracteres especiales
            JsonObject mensaje = new JsonObject();
            mensaje.addProperty("role", "user");
            mensaje.addProperty("content", prompt);

            JsonArray mensajes = new JsonArray();
            mensajes.add(mensaje);

            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", MODEL);
            requestBody.add("messages", mensajes);
            requestBody.addProperty("temperature", 0.7);

            String jsonBody = requestBody.toString();
            System.out.println("Mandando a Groq: " + jsonBody.substring(0, Math.min(200, jsonBody.length())));

            // Hacemos la petición a Groq con límites de tiempo (timeout) para evitar bloqueos indefinidos
            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(30))
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .timeout(java.time.Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

            System.out.println("Respuesta de Groq status: " + response.statusCode());
            System.out.println("Respuesta de Groq body: " + response.body().substring(0, Math.min(300, response.body().length())));

            if (response.statusCode() == 200) {
                // Extraemos el contenido de la respuesta de Groq
                JsonObject respuestaGroq = JsonParser.parseString(response.body()).getAsJsonObject();
                String contenido = respuestaGroq
                    .getAsJsonArray("choices")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("message")
                    .get("content").getAsString();

                System.out.println("Contenido extraído: " + contenido);

                // Limpiamos el contenido por si Groq puso bloques markdown
                String limpio = contenido
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

                ctx.contentType("application/json");
                ctx.result(limpio);
            } else {
                ctx.status(response.statusCode())
                   .result("Error de Groq: " + response.body());
            }

        } catch (java.net.http.HttpTimeoutException e) {
            System.out.println("Tiempo de espera agotado al conectar con Groq: " + e.getMessage());
            ctx.status(504).result("Error de Groq: Tiempo de espera agotado al conectar con el servicio.");
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).result("Error interno: " + e.getMessage());
        }
    }

    // Método auxiliar para obtener un String del JSON de forma segura
    // Si el campo no existe o es null devuelve "No disponible"
    private static String getStr(JsonObject obj, String key) {
        try {
            if (obj.has(key) && !obj.get(key).isJsonNull()) {
                return obj.get(key).getAsString();
            }
        } catch (Exception e) {
            return "No disponible";
        }
        return "No disponible";
    }
}