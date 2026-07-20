package com.sam;

import java.sql.Connection;
import java.sql.DriverManager;
import io.github.cdimascio.dotenv.Dotenv;

public class Conexion {

    private static String URL = "jdbc:mariadb://localhost:3306/SAM";
    private static String USUARIO = "root";
    private static String PASSWORD = "0981";

    static {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            if (dotenv.get("DB_URL") != null) URL = dotenv.get("DB_URL");
            if (dotenv.get("DB_USER") != null) USUARIO = dotenv.get("DB_USER");
            if (dotenv.get("DB_PASSWORD") != null) PASSWORD = dotenv.get("DB_PASSWORD");
        } catch (Exception e) {
            System.out.println("No se pudo cargar .env en Conexion, usando defaults.");
        }
    }

    public static Connection conectar() {
        try {
            Connection conn = DriverManager.getConnection(URL, USUARIO, PASSWORD);
            System.out.println("Conexión exitosa a la BD");
            return conn;
        } catch (Exception e) {
            System.out.println("Error al conectar: " + e.getMessage());
            return null;
        }
    }
}