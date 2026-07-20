package com.sam.controladores;

import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.util.Map;

public class PerfilControlador {
    
    public static void actualizarPerfil(Context ctx) {
        String usuarioActual = ctx.sessionAttribute("usuarioLogueado");
        if (usuarioActual == null) {
            ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
            return;
        }

        try {
            Map payload = ctx.bodyAsClass(Map.class);
            String nombre = (String) payload.get("nombre");
            String correo = (String) payload.get("correo");
            String pActual = payload.containsKey("pActual") ? (String) payload.get("pActual") : "";
            String pNueva = payload.containsKey("pNueva") ? (String) payload.get("pNueva") : "";

            boolean cambioPassword = pActual != null && !pActual.isEmpty() && pNueva != null && !pNueva.isEmpty();

            io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.load();
            String dbUrl = dotenv.get("DB_URL");
            String dbUser = dotenv.get("DB_USER");
            String dbPassword = dotenv.get("DB_PASSWORD");

            try (java.sql.Connection conn = java.sql.DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
                // Verificar contraseña actual si se quiere cambiar
                if (cambioPassword) {
                    String hashGuardado = null;
                    try (java.sql.PreparedStatement stmt = conn.prepareStatement("SELECT password_hash FROM USUARIO WHERE email = ?")) {
                        stmt.setString(1, usuarioActual);
                        try (java.sql.ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) {
                                hashGuardado = rs.getString("password_hash");
                            }
                        }
                    }

                    if (hashGuardado == null) {
                        ctx.status(404).json("{\"mensaje\": \"Usuario no encontrado\"}");
                        return;
                    }

                    // If BCrypt matches (or if it's plaintext in old data)
                    boolean passwordMatch = false;
                    if (hashGuardado.startsWith("$2a$")) {
                        passwordMatch = org.mindrot.jbcrypt.BCrypt.checkpw(pActual, hashGuardado);
                    } else {
                        passwordMatch = hashGuardado.equals(pActual);
                    }

                    if (!passwordMatch) {
                        ctx.status(400).json("{\"mensaje\": \"La contraseña actual es incorrecta\"}");
                        return;
                    }
                }

                String sql = "UPDATE USUARIO SET nombre = ?, email = ?";
                if (cambioPassword) {
                    sql += ", password_hash = ?";
                }
                sql += " WHERE email = ?";

                try (java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, nombre);
                    stmt.setString(2, correo);
                    
                    if (cambioPassword) {
                        String nuevoHash = org.mindrot.jbcrypt.BCrypt.hashpw(pNueva, org.mindrot.jbcrypt.BCrypt.gensalt());
                        stmt.setString(3, nuevoHash);
                        stmt.setString(4, usuarioActual);
                    } else {
                        stmt.setString(3, usuarioActual);
                    }
                    stmt.executeUpdate();
                    
                    // Actualizar sesión si cambió el correo
                    if (!correo.equals(usuarioActual)) {
                        ctx.sessionAttribute("usuarioLogueado", correo);
                    }
                }
            }
            
            ctx.status(200).json("{\"mensaje\": \"Perfil actualizado correctamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error interno al actualizar el perfil\"}");
        }
    }

    public static void subirFoto(Context ctx) {
        try {
            UploadedFile foto = ctx.uploadedFile("foto");
            if (foto != null) {
                System.out.println("Foto recibida: " + foto.filename());
                
                // TODO: Guardar archivo en sistema de archivos local o bucket y actualizar BD
                
                ctx.status(200).json("{\"mensaje\": \"Foto de perfil actualizada\"}");
            } else {
                ctx.status(400).json("{\"mensaje\": \"No se recibió ninguna foto\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json("{\"mensaje\": \"Error al procesar la foto\"}");
        }
    }
}
