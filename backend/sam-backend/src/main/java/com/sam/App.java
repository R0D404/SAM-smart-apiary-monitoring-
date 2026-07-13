package com.sam;

import io.javalin.Javalin;
import com.sam.controladores.AuthControlador;
import com.sam.controladores.DashboardControlador;
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

        // Filtro de seguridad: Proteger todas las rutas de administrador
        app.before(ctx -> {
            String path = ctx.path();
            if (path.startsWith("/frontend/admin") || path.startsWith("/api/dashboard")) {
                if (ctx.sessionAttribute("usuarioLogueado") == null) {
                    ctx.redirect("/index.html");
                }
            }
        });

        app.routes(() -> {
            // Todas las rutas que empiecen con /api/auth
            path("/api/auth", () -> {
                // Delegamos la lógica al AuthControlador
                post("/login", AuthControlador::manejarLogin); 
            });  
            
            path("/api/dashboard", () -> {
                get(DashboardControlador::obtenerDashboard);
            });
        });
    }
}
