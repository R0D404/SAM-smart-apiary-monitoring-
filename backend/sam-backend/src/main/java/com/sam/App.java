package com.sam;

import io.javalin.Javalin;
import com.sam.controladores.AuthControlador;
import static io.javalin.apibuilder.ApiBuilder.*;
public class App 
{
    public static void main( String[] args )
    {
        var app = Javalin.create(config -> {
            config.staticFiles.add(staticFiles -> {
                staticFiles.directory = "/home/emma/SAM";
                staticFiles.location = io.javalin.http.staticfiles.Location.EXTERNAL;
            });
        }).start(7070);

        app.routes(() -> {
            // Todas las rutas que empiecen con /api/auth
            path("/api/auth", () -> {
                // Delegamos la lógica al AuthControlador
                post("/login", AuthControlador::manejarLogin); 
            });  
                      
        });
    }
}
