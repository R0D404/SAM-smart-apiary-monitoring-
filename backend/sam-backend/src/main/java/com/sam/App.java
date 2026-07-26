package com.sam;

import io.javalin.Javalin;
import com.sam.controladores.AuthControlador;
import com.sam.controladores.DashboardControlador;
import com.sam.controladores.HistorialControlador;
import static io.javalin.apibuilder.ApiBuilder.*;

public class App 
{
    public static void main( String[] args )
    {
        // Cargar .env para obtener STATIC_DIR si existe
        io.github.cdimascio.dotenv.Dotenv dotenv = null;
        try {
            dotenv = io.github.cdimascio.dotenv.Dotenv.load();
        } catch(Exception e) {
            System.out.println("No se encontro archivo .env, usando defaults.");
        }
        
        final String staticDir = (dotenv != null && dotenv.get("STATIC_DIR") != null) 
                                  ? dotenv.get("STATIC_DIR") 
                                  : System.getProperty("user.dir");

        var app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
                cors.add(it -> {
                    it.anyHost();
                    it.allowCredentials = true;
                });
            });
            config.staticFiles.add(staticFiles -> {
                staticFiles.directory = staticDir;
                staticFiles.location = io.javalin.http.staticfiles.Location.EXTERNAL;
            });
        }).start(8080);

        // Filtro de seguridad: Proteger rutas y verificar roles
        app.before(ctx -> {
            String path = ctx.path();
            boolean isApi = path.startsWith("/api/") && !path.startsWith("/api/auth");
            boolean isAdminFront = path.startsWith("/frontend/admin");
            boolean isApicultorFront = path.startsWith("/frontend/apicultor");

            if (isApi || isAdminFront || isApicultorFront) {
                if (ctx.sessionAttribute("usuarioLogueado") == null) {
                    if (isApi) {
                        ctx.status(401).json("{\"mensaje\": \"No autorizado\"}");
                    } else {
                        ctx.redirect("/index.html");
                    }
                    return;
                }
            }

            String rol = ctx.sessionAttribute("rol");
            if (isAdminFront && !"admin".equals(rol)) {
                ctx.redirect("/frontend/apicultor/dashboardGlobal.html");
            }
            if (isApicultorFront && !"apicultor".equals(rol)) {
                ctx.redirect("/frontend/admin/dashboardGlobal.html");
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
                get("/apiario/{id}", com.sam.controladores.DashboardApiarioControlador::obtenerDashboardApiario);
                get("/colmena", com.sam.controladores.DashboardColmenaControlador::obtenerDashboardColmena);
            });
            
            path("/api/historial", () -> {
                get(HistorialControlador::obtenerHistorial);
            });
            
            path("/api/gestion", () -> {
                get("/apiarios", com.sam.controladores.GestionApiariosControlador::listarApiarios);
                post("/apiarios", com.sam.controladores.GestionApiariosControlador::crearApiario);
                put("/apiarios/{id}", com.sam.controladores.GestionApiariosControlador::actualizarApiario);
                delete("/apiarios/{id}", com.sam.controladores.GestionApiariosControlador::eliminarApiario);
                get("/microclimas", com.sam.controladores.GestionApiariosControlador::listarMicroclimas);
                
                get("/usuarios", com.sam.controladores.GestionUsuariosControlador::listarUsuarios);
                post("/usuarios", com.sam.controladores.GestionUsuariosControlador::crearUsuario);
                put("/usuarios/{id}", com.sam.controladores.GestionUsuariosControlador::actualizarUsuario);
                delete("/usuarios/{id}", com.sam.controladores.GestionUsuariosControlador::eliminarUsuario);
                
                get("/colmenas", com.sam.controladores.GestionColmenasControlador::listarColmenas);
                post("/colmenas", com.sam.controladores.GestionColmenasControlador::crearColmena);
                put("/colmenas/{id}", com.sam.controladores.GestionColmenasControlador::actualizarColmena);
                delete("/colmenas/{id}", com.sam.controladores.GestionColmenasControlador::eliminarColmena);
            });
            path("/api/alertas", () -> {
                get(com.sam.controladores.AlertasControlador::listarAlertas);
                post(com.sam.controladores.AlertasControlador::crearAlerta);
                put("/{id}", com.sam.controladores.AlertasControlador::actualizarAlerta);
                delete("/{id}", com.sam.controladores.AlertasControlador::eliminarAlerta);
            });
            path("/api/visitas", () -> {
                get(com.sam.controladores.VisitasControlador::listarVisitas);
                get("/cosechas", com.sam.controladores.VisitasControlador::listarCosechasVisitas);
                get("/mantenimiento", com.sam.controladores.VisitasControlador::listarMantenimientos);
                get("/apiarios", com.sam.controladores.VisitasControlador::listarApiariosDisponibles);
                post(com.sam.controladores.VisitasControlador::crearVisita);
                put("/{id}", com.sam.controladores.VisitasControlador::actualizarVisita);
                delete("/{id}", com.sam.controladores.VisitasControlador::eliminarVisita);
            });
            path("/api/cosechas", () -> {
                get("/resumen", com.sam.controladores.CosechasControlador::obtenerResumen);
                get("/grafica", com.sam.controladores.CosechasControlador::graficaProduccion);
                get(com.sam.controladores.CosechasControlador::listarCosechas);
            });

            path("/api/diagnostico", () -> {
                get("/{id}", com.sam.controladores.DiagnosticoController::getDatosColmena);
            });

            path("/api/perfil", () -> {
                post(com.sam.controladores.PerfilControlador::actualizarPerfil);
                post("/foto", com.sam.controladores.PerfilControlador::subirFoto);
            });

            path("/api/modulos", () -> {
                get("/{colmenaId}", com.sam.controladores.ModuloControlador::obtenerModulo);
                post("/{colmenaId}/mantenimiento", com.sam.controladores.ModuloControlador::registrarMantenimiento);
            });

            path("/api/umbrales", () -> {
                get(com.sam.controladores.UmbralesControlador::obtenerUmbrales);
                post(com.sam.controladores.UmbralesControlador::guardarUmbrales);
            });

            path("/api/datos", () -> {
                post(com.sam.controladores.TelemetriaControlador::recibirDatos);
            });

            path("/api/groq", () -> {
                post("/diagnostico", com.sam.controladores.GroqController::generarDiagnostico);
            });
        });
    }
}
