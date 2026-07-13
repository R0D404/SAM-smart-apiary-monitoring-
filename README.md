# API RESTful - Smart Apiary Monitoring (SAM)

Este documento describe la API RESTful del sistema **SAM (Smart Apiary Monitoring)** y proporciona instrucciones claras sobre cómo probar los distintos endpoints utilizando **Postman**.

La API está construida en **Java con Javalin** y devuelve y recibe los datos exclusivamente en formato **JSON**.

---

## 🚀 Requisitos Previos (Para probar en Postman)

El sistema SAM cuenta con seguridad de sesiones mediante cookies. Para poder realizar peticiones a los endpoints protegidos (que son casi todos los de gestión), primero debes iniciar sesión (autenticarte) para que Postman guarde tu cookie de sesión.

### Paso 1: Iniciar Sesión en Postman
1. Abre Postman y crea una nueva petición **POST**.
2. URL: `http://localhost:7070/api/auth/login`
3. Ve a la pestaña **Body**, selecciona **raw** y luego **JSON**.
4. Pega el siguiente cuerpo:
   ```json
   {
       "username": "admin@sam.com",
       "password": "1234"
   }
   ```
5. Haz clic en **Send**. Deberías recibir un código `200 OK`. Postman automáticamente guardará la cookie `JSESSIONID` para tus siguientes peticiones.

---

## 📚 Endpoints Disponibles (CRUD)

A continuación se listan todos los módulos y las operaciones disponibles.

> **Nota:** Reemplaza `{id}` en las URLs por el número identificador real (ej. `1`, `2`, `3`) que desees modificar o eliminar.

### 1. Gestión de Usuarios (`/api/gestion/usuarios`)
Administración de las cuentas de apicultores y administradores.

* **GET** `/api/gestion/usuarios`
  * **Descripción:** Lista todos los usuarios del sistema.
  * **Body:** Ninguno.

* **POST** `/api/gestion/usuarios`
  * **Descripción:** Crea un nuevo usuario.
  * **Body (JSON):**
    ```json
    {
      "nombre": "Juan Pérez",
      "email": "juan@sam.com",
      "password": "password123",
      "rol_id": 2
    }
    ```

* **PUT** `/api/gestion/usuarios/{id}`
  * **Descripción:** Actualiza los datos de un usuario existente.
  * **Body (JSON):**
    ```json
    {
      "nombre": "Juan Pérez Actualizado",
      "email": "juan.nuevo@sam.com",
      "rol_id": 2,
      "activo": true
    }
    ```

* **DELETE** `/api/gestion/usuarios/{id}`
  * **Descripción:** Elimina (o da de baja) a un usuario.
  * **Body:** Ninguno.

---

### 2. Gestión de Colmenas (`/api/gestion/colmenas`)
Administración del inventario de colmenas.

* **GET** `/api/gestion/colmenas`
  * **Descripción:** Lista todas las colmenas.

* **POST** `/api/gestion/colmenas`
  * **Descripción:** Registra una nueva colmena.
  * **Body (JSON):**
    ```json
    {
      "apiario_id": 1,
      "codigo": "C-100",
      "ecotipo": "Apis mellifera",
      "estado": "activa"
    }
    ```

* **PUT** `/api/gestion/colmenas/{id}`
  * **Descripción:** Actualiza los datos de una colmena.
  * **Body (JSON):**
    ```json
    {
      "apiario_id": 1,
      "codigo": "C-100",
      "ecotipo": "Scutellata",
      "estado": "inactiva"
    }
    ```

* **DELETE** `/api/gestion/colmenas/{id}`
  * **Descripción:** Elimina una colmena del sistema.

---

### 3. Gestión de Apiarios (`/api/gestion/apiarios`)
Control de los terrenos / apiarios.

* **GET** `/api/gestion/apiarios`
  * **Descripción:** Lista todos los apiarios.

* **POST** `/api/gestion/apiarios`
  * **Descripción:** Crea un nuevo apiario.
  * **Body (JSON):**
    ```json
    {
      "nombre": "Apiario Sur",
      "estado": "Jalisco",
      "municipio": "Guadalajara",
      "localidad": "Centro",
      "microclimaId": 2
    }
    ```

* **PUT** `/api/gestion/apiarios/{id}`
  * **Descripción:** Modifica la información de un apiario.
  * **Body (JSON):**
    ```json
    {
      "nombre": "Apiario Sur Renovado",
      "estado": "Jalisco",
      "municipio": "Tonalá",
      "localidad": "Norte",
      "microclimaId": 2
    }
    ```

* **DELETE** `/api/gestion/apiarios/{id}`
  * **Descripción:** Elimina un apiario.

---

### 4. Alertas del Sistema (`/api/alertas`)
Historial de alertas generadas por los sensores (módulos ESP-32).

* **GET** `/api/alertas`
  * **Descripción:** Lista el historial de alertas.

* **POST** `/api/alertas`
  * **Descripción:** Crea una nueva alerta (generalmente lo haría el hardware, pero puedes probarlo).
  * **Body (JSON):**
    ```json
    {
      "colmena_id": 1,
      "tipo": "Temperatura",
      "nivel": "critica",
      "mensaje": "Temperatura excede 38°C",
      "atendida": false
    }
    ```

* **PUT** `/api/alertas/{id}`
  * **Descripción:** Marca una alerta como atendida/resuelta.
  * **Body (JSON):**
    ```json
    {
      "atendida": true
    }
    ```

* **DELETE** `/api/alertas/{id}`
  * **Descripción:** Borra una alerta.

---

### 5. Historial de Visitas (`/api/visitas`)
Bitácora de inspecciones y visitas a los apiarios.

* **GET** `/api/visitas`
  * **Descripción:** Obtiene las últimas visitas/sesiones registradas.

* **POST** `/api/visitas`
  * **Descripción:** Registra una nueva inspección manual.
  * **Body (JSON):**
    ```json
    {
      "apiario_id": 1,
      "usuario_id": 1,
      "tipo": "Inspección de rutina",
      "fecha": "2026-10-15",
      "hora_inicio": "09:30:00"
    }
    ```

* **PUT** `/api/visitas/{id}`
  * **Descripción:** Actualiza los detalles de la visita.
  * **Body (JSON):**
    ```json
    {
      "tipo": "Cosecha de Miel",
      "fecha": "2026-10-16"
    }
    ```

* **DELETE** `/api/visitas/{id}`
  * **Descripción:** Elimina el registro de una visita.

---

### 6. Historial de Cosechas (`/api/cosechas`)
Módulo de recolección de miel y métricas calculadas.

* **GET** `/api/cosechas`
  * **Descripción:** Lista todo el historial de las cosechas cruzado con los nombres de los apicultores y sus fechas.

* **GET** `/api/cosechas/resumen`
  * **Descripción:** Retorna métricas generales (Total de temporada, Promedio por colmena y % de validación con sensor).

* **GET** `/api/cosechas/grafica`
  * **Descripción:** Agrupa la producción total (kg) por cada colmena para graficar.

---

## 💡 Consejos para Pruebas
- Si alguna petición te devuelve **Error 401: No autorizado** o te redirige a un HTML de login, significa que la sesión caducó o que reiniciaste el servidor en Java. Simplemente **vuelve a ejecutar el Paso 1** de Iniciar Sesión.
- Asegúrate de que en Postman el tipo de contenido al hacer envíos (POST/PUT) esté estrictamente en `JSON (application/json)`.
