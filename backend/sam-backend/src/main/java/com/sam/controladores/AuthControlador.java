package com.sam.controladores;

import io.javalin.http.Context;
import com.sam.modelos.Credenciales;
import org.mindrot.jbcrypt.BCrypt;
import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class AuthControlador {

    // Carga de forma segura los valores desde el archivo .env
    private static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL"); 
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD");

    public static void manejarLogin(Context ctx) {
        Credenciales credenciales = ctx.bodyAsClass(Credenciales.class);
        String inputUsername = credenciales.getUsername();
        String inputPassword = credenciales.getPassword();

        // Evitar buscar si vienen vacíos
        if (inputUsername == null || inputPassword == null) {
            ctx.status(400).json("{\"mensaje\": \"Faltan credenciales\"}");
            return;
        }

        // Conectar a MariaDB
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            // Asumiendo que tu tabla se llama 'usuarios' y las columnas 'email' y 'password'
            // Modifica "SELECT password_hash FROM USUARIO WHERE email = ?" si tu tabla es diferente.
            String sql = "SELECT u.password_hash, r.nombre AS rol FROM USUARIO u JOIN CATALAGO_ROL r ON u.rol_id = r.id WHERE u.email = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, inputUsername);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        // Obtener el hash y el rol de la base de datos
                        String hashGuardado = rs.getString("password_hash");
                        String rol = rs.getString("rol");
                        
                        // Verificar la contraseña usando BCrypt
                        if (BCrypt.checkpw(inputPassword, hashGuardado)) {
                            // Crear la sesión del usuario
                            ctx.sessionAttribute("usuarioLogueado", inputUsername);
                            ctx.sessionAttribute("rolUsuario", rol);
                            ctx.status(200).json("{\"mensaje\": \"Login exitoso\", \"rol\": \"" + rol + "\"}");
                            return;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno de conexión a base de datos\"}");
            return;
        }

        // Si llega aquí, es porque no encontró el usuario o la contraseña no coincidió
        ctx.status(401).json("{\"mensaje\": \"Credenciales inválidas\"}");
    }

    private static final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public static void obtenerMiCuenta(Context ctx) {
        String email = ctx.sessionAttribute("usuarioLogueado");
        if (email == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "SELECT nombre, email FROM USUARIO WHERE email = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, email);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        com.fasterxml.jackson.databind.node.ObjectNode res = mapper.createObjectNode();
                        res.put("nombre", rs.getString("nombre"));
                        res.put("email", rs.getString("email"));
                        res.put("telefono", "+52 961 123 4567"); // placeholder
                        ctx.status(200).json(res);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
            return;
        }
        ctx.status(404).json("{\"mensaje\": \"Usuario no encontrado\"}");
    }

    public static void actualizarMiCuenta(Context ctx) {
        String emailActual = ctx.sessionAttribute("usuarioLogueado");
        if (emailActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try {
            com.fasterxml.jackson.databind.JsonNode body = mapper.readTree(ctx.body());
            String nuevoNombre = body.get("nombre").asText();
            String nuevoEmail = body.get("email").asText();
            String pwdActual = body.has("pwdActual") ? body.get("pwdActual").asText() : "";
            String pwdNueva = body.has("pwdNueva") ? body.get("pwdNueva").asText() : "";

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                // Verificar si se va a cambiar la contraseña
                if (!pwdNueva.isEmpty() && !pwdActual.isEmpty()) {
                    String sqlPwd = "SELECT password_hash FROM USUARIO WHERE email = ?";
                    try (PreparedStatement stmtPwd = conn.prepareStatement(sqlPwd)) {
                        stmtPwd.setString(1, emailActual);
                        try (ResultSet rs = stmtPwd.executeQuery()) {
                            if (rs.next()) {
                                String hashGuardado = rs.getString("password_hash");
                                if (!BCrypt.checkpw(pwdActual, hashGuardado)) {
                                    ctx.status(400).json("{\"mensaje\": \"Contraseña actual incorrecta\"}");
                                    return;
                                }
                            }
                        }
                    }

                    // Actualizar nombre, email y contraseña
                    String sqlUpdate = "UPDATE USUARIO SET nombre = ?, email = ?, password_hash = ? WHERE email = ?";
                    try (PreparedStatement stmtUpdate = conn.prepareStatement(sqlUpdate)) {
                        stmtUpdate.setString(1, nuevoNombre);
                        stmtUpdate.setString(2, nuevoEmail);
                        stmtUpdate.setString(3, BCrypt.hashpw(pwdNueva, BCrypt.gensalt()));
                        stmtUpdate.setString(4, emailActual);
                        stmtUpdate.executeUpdate();
                    }
                } else {
                    // Actualizar solo nombre y email
                    String sqlUpdate = "UPDATE USUARIO SET nombre = ?, email = ? WHERE email = ?";
                    try (PreparedStatement stmtUpdate = conn.prepareStatement(sqlUpdate)) {
                        stmtUpdate.setString(1, nuevoNombre);
                        stmtUpdate.setString(2, nuevoEmail);
                        stmtUpdate.setString(3, emailActual);
                        stmtUpdate.executeUpdate();
                    }
                }

                // Actualizar email de la sesión si cambió
                ctx.sessionAttribute("usuarioLogueado", nuevoEmail);

                ctx.status(200).json("{\"mensaje\": \"Datos actualizados correctamente\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno\"}");
        }
    }

    public static void manejarLogout(Context ctx) {
        ctx.req().getSession().invalidate();
        ctx.status(200).json("{\"mensaje\": \"Sesión cerrada\"}");
    }
}
