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

    // Se eliminó Dotenv de aquí porque Conexion.java ya se encarga de la BD

    public static void manejarLogin(Context ctx) {
        Credenciales credenciales = ctx.bodyAsClass(Credenciales.class);
        String inputUsername = credenciales.getUsername();
        String inputPassword = credenciales.getPassword();

        // Evitar buscar si vienen vacíos
        if (inputUsername == null || inputPassword == null) {
            ctx.status(400).json("{\"mensaje\": \"Faltan credenciales\"}");
            return;
        }

        // Conectar a MariaDB usando la clase Conexion
        try (Connection conn = com.sam.Conexion.conectar()) {
            
            if (conn == null) {
                ctx.status(500).json("{\"mensaje\": \"No se pudo conectar a la base de datos\"}");
                return;
            }

            // Asumiendo que tu tabla se llama 'USUARIO' y las columnas 'email' y 'password_hash'
            String sql = "SELECT u.password_hash, r.nombre as rol FROM USUARIO u JOIN CATALAGO_ROL r ON u.rol_id = r.id WHERE u.email = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, inputUsername);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String hashGuardado = rs.getString("password_hash");
                        String rol = rs.getString("rol");
                        
                        if (BCrypt.checkpw(inputPassword, hashGuardado)) {
                            ctx.sessionAttribute("usuarioLogueado", inputUsername);
                            ctx.sessionAttribute("rol", rol);
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
}
