# SAM (Smart Apiary Monitoring) Project Documentation

Welcome to the official technical documentation of the **SAM** system. This document serves as a guide to understand the software architecture, the project structure, the Backend code (Java) and Frontend (HTML/CSS/JS).

---

## 1. System Architecture

SAM is a full-stack web application designed under the **Client-Server** architecture pattern.

* **Database:** MariaDB (Relational). Stores users, hives, apiaries, climate data, and monitoring logs.
* **Backend:** Written in **Java 26** using the lightweight framework **Javalin** and pure **JDBC** for the database connection (without heavy ORMs). Provides a **RESTful API**.
* **Frontend:** Developed without complex frameworks (Vanilla HTML5, CSS3, JS ES6). It communicates asynchronously with the Backend via the native `fetch()` API.
* **Authentication:** Based on native sessions handled by Javalin (`JSESSIONID`) stored in cookies.

---

## 2. Folder Structure (Overview)

```text
/home/emma/SAM/
├── backend/
│   └── sam-backend/               # Java Server (Maven Project)
│       ├── pom.xml                # Dependencies (Javalin, MariaDB, Jackson, Dotenv)
│       ├── .env                   # Environment variables (DB Credentials)
│       └── src/main/java/com/sam/
│           ├── App.java           # Main entry point and central router
│           └── controladores/     # RESTful Controllers (Business Logic)
│
├── frontend/                      # Client Application
│   ├── admin/                     # Main HTML views
│   └── shared/                    # Shared resources
│       ├── css/                   # Styles by module (Separated modules)
│       ├── js/                    # Client logic per view
│       └── assets/                # Images and logos
│
├── index.html                     # Login Screen (Root)
├── README.md                      # API / Postman Instructions
└── DOCUMENTACION.md               # This file
```

---

## 3. Backend (Java Javalin)

The SAM backend acts as a bridge between the user view and the Database. All key classes reside in `com.sam.controladores`.

### 3.1 `App.java` (Core)
It is the main file that initializes the server on port `7070`.
* **Configures static files:** Points to the `/home/emma/SAM` folder to serve HTML, CSS, and JS.
* **Security Filter (`app.before`):** A *middleware* that intercepts all requests to protected URLs (`/frontend/admin/*` and `/api/*`) to ensure the user has a valid session (`usuarioLogueado`).
* **Central Router:** Defines all routes and delegates operations to the corresponding `Controlador` class.

### 3.2 Logic Controllers (CRUD and Dashboards)
All controllers read the `.env` to extract credentials, connect to MariaDB using Java's `DriverManager` and return responses in `application/json` format processed by the `Jackson` library (`ObjectMapper`, `ObjectNode`, `ArrayNode`).

1. **`AuthControlador.java`**: Handles login (`/api/auth/login`), verifies the hash or password, initializes the Jetty session and redirects to the global dashboard.
2. **`DashboardControlador.java`**: Calculates global statistics (total yield, active alerts, etc.) querying multiple tables (`APIARIO`, `COLMENA`, `ALERTA`).
3. **`DashboardApiarioControlador.java` / `DashboardColmenaControlador.java`**: Filter information and statistical sensors of particular items through their IDs.
4. **CRUD Modules (Create, Read, Update, Delete)**:
   * **`GestionUsuariosControlador.java`**: Manages accounts (Beekeepers/Admin).
   * **`GestionApiariosControlador.java`**: Manages locations (Supports editing and creation).
   * **`GestionColmenasControlador.java`**: Manages individual boxes and linked ESP-32 modules (Supports editing and creation).
   * **`AlertasControlador.java`**: Alert history and attention flags.
   * **`VisitasControlador.java`**: Log of manual operations and visits.
   * **`CosechasControlador.java`**: API that groups honey yields and generates data for graphs crossing visits and hives.

---

## 4. Frontend (HTML, CSS and Vanilla JavaScript)

The Frontend is designed to be modern, dark ("dark mode"), modular and fluid.

### 4.1 Visual Design (CSS)
* The **`base.css`** file contains global CSS variables (gold colors, grays, typography) and base components like buttons and menus.
* In **`layout.css`** resides the main architecture (the container box `app-shell`, the sidebar `sidebar`, the header `topbar`).
* Individual files like **`gestionUsuarios.css`** or **`historialVisita.css`** add specific visual rules for their tables or floating windows (Modals).

### 4.2 Dynamic Logic (JavaScript)
All frontend JS files work by connecting to the backend. They follow this basic execution flow:
1. `document.addEventListener('DOMContentLoaded', ...)`: Waits for the HTML to load.
2. Makes an asynchronous **`fetch()`** to a URL (`/api/gestion/...`).
3. Processes the `res.json()`.
4. Uses **`document.createElement`** or **`innerHTML`** to generate dynamic table rows (`<tr>`, `<td>`), calculate avatar colors (by name) or badges according to states (Critical, Excellent).
5. Listens to click events from Modal windows to show/hide the "Create New" forms, and intelligently switches to "Edit" mode by sending `PUT` requests when necessary.

### 4.3 HTML Views (`/frontend/admin`)
1. **`dashboard.html`**: General summary of all the company's apiaries.
2. **`dashboardApiario.html`**: Detailed view of a specific apiary (climate, general health of that enclosure).
3. **`dashboardColmena.html`**: The deepest level; the real-time internal statistics of temperature/humidity/weight of a single hive sent by an ESP-32.
4. **Management Views** (`gestionUsuarios.html`, `gestionColmenas.html`, `gestionApiarios.html`): Interfaces where user-level CRUDs are managed and operated through dark superimposed visual modals.
5. **Log Views** (`alertas.html`, `historialVisita.html`, `historialCosechas.html`): Interactive logs. `historialCosechas.html` stands out by including analytics and automatic bar charts.

---

## 5. Complete Flow of a Requirement (Example: View Users)
To understand how all the code collaborates, here is the flow that occurs when you open "User Management":

1. The user enters `gestionUsuarios.html` in their browser.
2. The browser downloads `gestionUsuarios.html`, `base.css`, `layout.css`, and `gestionUsuarios.js`.
3. Upon finishing loading the view visually, the JS (`gestionUsuarios.js`) triggers `cargarUsuarios()`, which internally executes a `fetch('/api/gestion/usuarios')`.
4. The request arrives at the Javalin Server in `App.java`, intercepted by the line `get("/usuarios", com.sam.controladores.GestionUsuariosControlador::listarUsuarios);`.
5. `GestionUsuariosControlador.java` verifies if the user has an open session. If so, it connects to MariaDB.
6. Executes a `SELECT` in SQL using multiple `JOIN`s to obtain names, roles, and apiaries (comma separated `GROUP_CONCAT`).
7. Java transforms the results into a JSON array tree with Jackson (`ArrayNode`) and responds `200 OK` sending the JSON.
8. On the client side (JS), the `fetch` promise is resolved, we iterate over each user using `datos.forEach` and dynamically generate each row of the table (and an avatar with their initials). The table paints itself in front of the user's eyes.

And that's how robust and fast the SAM system is!
