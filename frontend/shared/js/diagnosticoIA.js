// ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
// Aquí pones tu API Key de Gemini — nunca la compartas públicamente
const GEMINI_API_KEY = "AQ.Ab8RN6KRP0r_hTANlkxfbj0qFj6C_KZh5EbzttbnSbt9XcUFKA";

// URL de tu API Java — el {id} se reemplaza dinámicamente
const API_SAM = "/api/diagnostico";

// ID de la colmena — obtenido desde la URL (?id=3), fallback a 1
const urlParams = new URLSearchParams(window.location.search);
const COLMENA_ID = urlParams.get('id') || 1;

// ── REFERENCIAS AL HTML ──────────────────────────────────────────────────────
// Guardamos referencias a los elementos del HTML que vamos a modificar
const nombreColmena  = document.getElementById("nombre-colmena");
const ctxLecturas    = document.getElementById("ctx-lecturas");
const ctxEcotipo     = document.getElementById("ctx-ecotipo");
const ctxZona        = document.getElementById("ctx-zona");
const ctxMicroclima  = document.getElementById("ctx-microclima");
const ctxAlertas     = document.getElementById("ctx-alertas");
const ctxVisitas     = document.getElementById("ctx-visitas");
const ctxCosechas    = document.getElementById("ctx-cosechas");
const estadoValor    = document.getElementById("estado-valor");
const causaProbable  = document.getElementById("causa-probable");
const accionesLista  = document.getElementById("acciones-lista");
const btnDiagnostico = document.getElementById("btn-diagnostico");

// ── VARIABLE GLOBAL ──────────────────────────────────────────────────────────
// Aquí guardamos los datos de la API para usarlos después al llamar a Gemini
let datosDeLaColmena = null;

// ── FUNCIÓN 1: CARGAR DATOS DE LA API JAVA ──────────────────────────────────
// Esta función llama a nuestra API Java y llena el panel izquierdo con los datos
async function cargarDatosColmena() {
    try {
        // fetch hace una petición HTTP GET a nuestra API Java
        // await espera a que llegue la respuesta antes de continuar
        const respuesta = await fetch(`${API_SAM}/${COLMENA_ID}`);

        // .json() convierte el texto JSON que llegó en un objeto JavaScript
        const datos = await respuesta.json();

        // Guardamos los datos en la variable global para usarlos después
        datosDeLaColmena = datos;

        // Llenamos el HTML con los datos que llegaron de la BD
        nombreColmena.textContent = datos.colmena;
        ctxEcotipo.textContent    = datos.ecotipo   || "No registrado";
        ctxZona.textContent       = datos.zona      || "No registrada";
        ctxMicroclima.textContent = datos.microclima|| "No registrado";

        // Las lecturas vienen como texto con \n, las convertimos a lista visual
        // split("\n") divide el texto en un arreglo por cada salto de línea
        // filter(l => l) elimina las líneas vacías
        if (datos.lecturas) {
            ctxLecturas.textContent = datos.lecturas.replace(/\\n/g, " | ");
        }

        if (datos.alertas) {
            ctxAlertas.textContent = datos.alertas.replace(/\\n/g, " | ");
        } else {
            ctxAlertas.textContent = "Sin alertas activas";
        }

        if (datos.visitas) {
            ctxVisitas.textContent = datos.visitas.replace(/\\n/g, " | ");
        }

        if (datos.cosechas) {
            ctxCosechas.textContent = datos.cosechas.replace(/\\n/g, " | ");
        }

    } catch (error) {
        // Si algo falla (servidor apagado, error de red) mostramos el error
        console.error("Error al cargar datos:", error);
        estadoValor.textContent = "Error al conectar con el servidor";
    }
}

// ── FUNCIÓN 2: LLAMAR A GEMINI ───────────────────────────────────────────────
// Esta función arma el prompt con los datos de la colmena y se lo manda a Gemini
async function generarDiagnostico() {

    if (!datosDeLaColmena) {
        alert("Espera a que carguen los datos de la colmena");
        return;
    }

    // Deshabilitamos el botón mientras carga
    btnDiagnostico.disabled = true;
    btnDiagnostico.textContent = "Generando diagnóstico...";
    estadoValor.textContent = "Analizando datos...";

    try {
        // Ahora llamamos a NUESTRA API Java, no a Groq directamente
        // La API Java es la que tiene la key guardada en el .env de forma segura
        const respuesta = await fetch("/api/groq/diagnostico", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Mandamos los datos de la colmena como texto plano
            // El Java los recibe con ctx.body() y los manda a Groq
            body: JSON.stringify(datosDeLaColmena)
        });

        // Leemos la respuesta como texto porque ya viene como JSON limpio
        const texto = await respuesta.text();

        // Limpiamos por si viene con bloques de markdown
        const textoLimpio = texto
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Convertimos el texto a objeto JavaScript
        const diagnostico = JSON.parse(textoLimpio);

        // Llenamos el HTML con el diagnóstico
        estadoValor.textContent   = diagnostico.estado;
        causaProbable.textContent = diagnostico.causa_probable;

        // Limpiamos y llenamos la lista de acciones
        accionesLista.innerHTML = "";
        diagnostico.acciones.forEach(accion => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="dot dot-amarillo"></span> ${accion}`;
            accionesLista.appendChild(li);
        });

    } catch (error) {
        console.error("Error:", error);
        estadoValor.textContent = "Error al generar el diagnóstico. Intenta de nuevo.";
    } finally {
        btnDiagnostico.disabled = false;
        btnDiagnostico.textContent = "Generar nuevo diagnóstico";
    }
}

// ── EVENTOS ──────────────────────────────────────────────────────────────────
// Cuando se haga clic en el botón, llamamos a generarDiagnostico
btnDiagnostico.addEventListener("click", generarDiagnostico);

// ── INICIO ───────────────────────────────────────────────────────────────────
// Cuando carga la página, lo primero que hace es cargar los datos de la colmena
cargarDatosColmena();