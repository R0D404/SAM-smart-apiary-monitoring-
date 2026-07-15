# Documentación del Proyecto SAM (Smart Apiary Monitoring)

Bienvenido a la documentación técnica oficial del sistema **SAM**. Este documento sirve como guía para comprender la arquitectura de software, la estructura del proyecto, el código Backend (Java) y Frontend (HTML/CSS/JS).

---

## 🏗️ 1. Arquitectura del Sistema

SAM es una aplicación web full-stack diseñada bajo el patrón de arquitectura **Cliente-Servidor**.

* **Base de Datos:** MariaDB (Relacional). Almacena usuarios, colmenas, apiarios, datos climáticos y registros de monitoreo.
* **Backend:** Escrito en **Java 26** utilizando el framework ligero **Javalin** y **JDBC** puro para la conexión a la base de datos (sin ORMs pesados). Proporciona una **API RESTful**.
* **Frontend:** Desarrollado sin frameworks complejos (Vanilla HTML5, CSS3, JS ES6). Se comunica asíncronamente con el Backend vía la API nativa de `fetch()`.
* **Autenticación:** Basada en sesiones nativas manejadas por Javalin (`JSESSIONID`) almacenadas en cookies.

---

## 📂 2. Estructura de Carpetas (Vista General)

```text
/home/emma/SAM/
├── backend/
│   └── sam-backend/               # Servidor de Java (Proyecto Maven)
│       ├── pom.xml                # Dependencias (Javalin, MariaDB, Jackson, Dotenv)
│       ├── .env                   # Variables de entorno (Credenciales de BD)
│       └── src/main/java/com/sam/
│           ├── App.java           # Punto de entrada principal y enrutador central
│           └── controladores/     # Controladores RESTful (Lógica de negocio)
│
├── frontend/                      # Aplicación Cliente
│   ├── admin/                     # Vistas HTML principales
│   └── shared/                    # Recursos compartidos
│       ├── css/                   # Estilos por módulo (Módulos separados)
│       ├── js/                    # Lógica de cliente por vista
│       └── assets/                # Imágenes y logos
│
├── index.html                     # Pantalla de Login (Raíz)
├── README.md                      # Instrucciones de API / Postman
└── DOCUMENTACION.md               # Este archivo
```

---

## ⚙️ 3. Backend (Java Javalin)

El backend de SAM actúa como puente entre la vista del usuario y la Base de Datos. Todas las clases clave residen en `com.sam.controladores`.

### 3.1 `App.java` (Core)
Es el archivo principal que inicializa el servidor en el puerto `7070`.
* **Configura archivos estáticos:** Apunta a la carpeta `/home/emma/SAM` para servir los HTML, CSS y JS.
* **Filtro de Seguridad (`app.before`):** Un *middleware* que intercepta todas las peticiones a URLs protegidas (`/frontend/admin/*` y `/api/*`) para asegurar que el usuario tenga una sesión válida (`usuarioLogueado`).
* **Router Central:** Define todas las rutas y delega las operaciones a la clase `Controlador` correspondiente.

### 3.2 Controladores de Lógica (CRUD y Dashboards)
Todos los controladores leen el `.env` para extraer credenciales, se conectan a MariaDB mediante `DriverManager` de Java y devuelven respuestas en formato `application/json` procesadas por la librería `Jackson` (`ObjectMapper`, `ObjectNode`, `ArrayNode`).

1. **`AuthControlador.java`**: Maneja el inicio de sesión (`/api/auth/login`), verifica el hash o contraseña, inicializa la sesión en Jetty y redirige al dashboard global.
2. **`DashboardControlador.java`**: Calcula estadísticas globales (rendimiento total, alertas activas, etc.) consultando a múltiples tablas (`APIARIO`, `COLMENA`, `ALERTA`).
3. **`DashboardApiarioControlador.java` / `DashboardColmenaControlador.java`**: Filtran información y sensores estadísticos de elementos particulares mediante sus IDs.
4. **Módulos CRUD (Create, Read, Update, Delete)**:
   * **`GestionUsuariosControlador.java`**: Administra cuentas (Apicultores/Admin).
   * **`GestionApiariosControlador.java`**: Administra ubicaciones (Soporta edición y creación).
   * **`GestionColmenasControlador.java`**: Administra cajas individuales y módulos ESP-32 vinculados (Soporta edición y creación).
   * **`AlertasControlador.java`**: Historial de avisos y marcas de atención.
   * **`VisitasControlador.java`**: Bitácora de operaciones manuales y visitas.
   * **`CosechasControlador.java`**: API que agrupa los rendimientos de miel y genera datos para gráficas cruzando visitas y colmenas.

---

## 🎨 4. Frontend (HTML, CSS y JavaScript Vanilla)

El Frontend está diseñado para ser moderno, oscuro ("dark mode"), modular y fluido.

### 4.1 Diseño Visual (CSS)
* El archivo **`base.css`** contiene variables CSS globales (colores dorados, grises, tipografía) y componentes base como botones y menús.
* En **`layout.css`** se encuentra la arquitectura principal (la caja contenedora `app-shell`, la barra lateral `sidebar`, el encabezado `topbar`).
* Archivos individuales como **`gestionUsuarios.css`** o **`historialVisita.css`** añaden reglas visuales específicas para sus tablas o ventanas flotantes (Modales).

### 4.2 Lógica Dinámica (JavaScript)
Todos los archivos JS del frontend funcionan conectándose al backend. Siguen este flujo de ejecución básico:
1. `document.addEventListener('DOMContentLoaded', ...)`: Espera a que el HTML cargue.
2. Hace un **`fetch()`** asíncrono a una URL (`/api/gestion/...`).
3. Procesa el `res.json()`.
4. Utiliza **`document.createElement`** o **`innerHTML`** para generar las filas de tablas dinámicas (`<tr>`, `<td>`), calcular colores de avatares (por nombre) o badges según estados (Crítico, Excelente).
5. Escucha eventos click de ventanas Modales para mostrar/ocultar los formularios de "Crear Nuevo", e inteligentemente cambia a modo "Editar" enviando peticiones `PUT` cuando es necesario.

### 4.3 Vistas HTML (`/frontend/admin`)
1. **`dashboard.html`**: Resumen general de todos los apiarios de la empresa.
2. **`dashboardApiario.html`**: Vista detallada de un apiario en concreto (clima, salud general de ese recinto).
3. **`dashboardColmena.html`**: Lo más profundo; la estadística interna de temperatura/humedad/peso en tiempo real de una sola colmena enviada por un ESP-32.
4. **Vistas de Gestión** (`gestionUsuarios.html`, `gestionColmenas.html`, `gestionApiarios.html`): Interfaces donde se administran y operan los CRUD a nivel usuario a través de modales visuales oscuros sobrepuestos.
5. **Vistas de Registros** (`alertas.html`, `historialVisita.html`, `historialCosechas.html`): Bitácoras interactivas. `historialCosechas.html` destaca por incluir analíticas y gráficas de barras automáticas.

---

## 🛠️ 5. Flujo Completo de un Requerimiento (Ejemplo: Ver Usuarios)
Para entender cómo todo el código colabora, aquí el flujo que ocurre cuando abres "Gestión de Usuarios":

1. El usuario entra a `gestionUsuarios.html` en su navegador.
2. El navegador descarga `gestionUsuarios.html`, `base.css`, `layout.css`, y `gestionUsuarios.js`.
3. Al terminar de cargar la vista visualmente, el JS (`gestionUsuarios.js`) dispara `cargarUsuarios()`, que internamente ejecuta un `fetch('/api/gestion/usuarios')`.
4. La petición llega al Javalin Server en `App.java`, interceptada por la línea `get("/usuarios", com.sam.controladores.GestionUsuariosControlador::listarUsuarios);`.
5. `GestionUsuariosControlador.java` verifica si el usuario tiene sesión abierta. De ser así, se conecta a MariaDB.
6. Ejecuta un `SELECT` en SQL usando múltiples `JOIN` para obtener los nombres, roles y apiarios (separados por coma `GROUP_CONCAT`).
7. El Java transforma los resultados a un árbol JSON de tipo array con Jackson (`ArrayNode`) y responde `200 OK` mandando el JSON.
8. En el lado del cliente (JS), la promesa de `fetch` se resuelve, iteramos cada usuario usando `datos.forEach` y generamos dinámicamente cada fila de la tabla (y un avatar con sus iniciales). La tabla se pinta sola frente a los ojos del usuario.

¡Y así de robusto y veloz es el sistema SAM!
