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
    private static final Dotenv dotenv = Dotenv.configure().directory("/home/emma/SAM/backend/sam-backend").load();
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
            String sql = "SELECT password_hash FROM USUARIO WHERE email = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, inputUsername);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        // Obtener el hash de la base de datos
                        String hashGuardado = rs.getString("password_hash");
                        
                        // Verificar la contraseña usando BCrypt
                        if (BCrypt.checkpw(inputPassword, hashGuardado)) {
                            // Crear la sesión del usuario
                            ctx.sessionAttribute("usuarioLogueado", inputUsername);
                            ctx.status(200).json("{\"mensaje\": \"Login exitoso\"}");
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
}
