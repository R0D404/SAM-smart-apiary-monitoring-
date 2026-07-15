# Guía de Despliegue en AWS (Amazon Web Services)

Esta guía detalla el proceso completo paso a paso para empaquetar tu servidor de Java (SAM Backend) en un archivo `.jar` y desplegarlo de forma profesional en un servidor de AWS (EC2).

---

## 1. Preparar el Proyecto (Localmente)

Antes de subir tu sistema, necesitamos empaquetarlo en un único archivo "Ejecutable" (Fat JAR). Javalin y Maven permiten hacer esto muy fácilmente.

Abre una terminal en tu computadora, ve a la ruta de tu backend y compila el código:

```bash
cd /home/emma/SAM/backend/sam-backend
mvn clean compile assembly:single
```

> **Nota:** Para que `assembly:single` funcione de manera óptima, tu archivo `pom.xml` debe tener configurado el plugin `maven-assembly-plugin` para empaquetar el JAR con todas sus dependencias. El resultado será un archivo (por ejemplo, `sam-backend-1.0-jar-with-dependencies.jar`) dentro de la carpeta `target/`.

---

## 2. Crear Servidor en AWS (EC2)

1. Ingresa a tu consola de **AWS**.
2. Ve al servicio **EC2** y dale a **Lanzar instancia (Launch Instance)**.
3. Nombre: `Servidor-SAM`.
4. Sistema Operativo (AMI): **Ubuntu Server 24.04 LTS** (es el más recomendado y sencillo).
5. Tipo de instancia: `t2.micro` (es gratuita y suficiente para empezar).
6. **Par de claves (Key pair):** Crea un nuevo par de claves llamado `sam-key`. AWS descargará un archivo `sam-key.pem`. ¡Guárdalo bien, no lo pierdas!
7. **Configuraciones de red (Security Group):** Permite el tráfico **SSH** (puerto 22) desde cualquier lugar y, muy importante, **agrega una regla TCP personalizada para el puerto 7070** (donde corre tu app) y otra para el puerto 80 (HTTP) si piensas usar un dominio más adelante.
8. Lanza la instancia.

---

## 3. Conectarse a la Instancia AWS

Abre tu terminal en Linux (en donde tengas descargado tu archivo `sam-key.pem`):

```bash
# Cambia los permisos de tu llave de seguridad para que AWS no la rechace
chmod 400 sam-key.pem

# Conéctate vía SSH (Sustituye "IP_PUBLICA_AWS" por la IP que te dio EC2)
ssh -i "sam-key.pem" ubuntu@IP_PUBLICA_AWS
```

---

## 4. Instalar Java y Bases de Datos (En AWS)

Una vez dentro de la terminal de AWS, actualiza el servidor e instala Java y MariaDB:

```bash
# Actualizar el gestor de paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Java (El mismo o superior al que usas localmente, por ejemplo Java 21)
sudo apt install openjdk-21-jdk -y

# Comprobar la versión de Java
java -version

# Instalar Base de Datos MariaDB
sudo apt install mariadb-server -y
```

> **Importante:** Recuerda configurar tu base de datos corriendo `sudo mysql_secure_installation`.

### 4.1. Migrar tu Base de Datos Local a AWS
Para no crear todas las tablas desde cero, vamos a exportar la base de datos que ya tienes en tu computadora y subirla a AWS.

1. **En tu computadora local**, exporta la base de datos a un archivo SQL:
   ```bash
   mysqldump -u root -p SAM_DB > sam_db_backup.sql
   ```
2. Sube el archivo SQL a tu servidor AWS usando SCP:
   ```bash
   scp -i "sam-key.pem" sam_db_backup.sql ubuntu@IP_PUBLICA_AWS:/home/ubuntu/
   ```
3. **Dentro del servidor AWS**, entra a MariaDB y crea la base de datos vacía:
   ```bash
   sudo mysql -u root -p
   # Dentro de MySQL escribe:
   CREATE DATABASE SAM_DB;
   CREATE USER 'emma'@'localhost' IDENTIFIED BY 'tu_contraseña_aqui';
   GRANT ALL PRIVILEGES ON SAM_DB.* TO 'emma'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
4. Finalmente, en AWS, importa el archivo que subiste hacia la base de datos recién creada:
   ```bash
   mysql -u root -p SAM_DB < /home/ubuntu/sam_db_backup.sql
   ```

---

## 5. Subir los Archivos al Servidor AWS

No cierres tu conexión a AWS, pero abre **otra pestaña nueva** de tu terminal local para transferir los archivos de tu computadora a AWS usando `scp` (Copiar sobre SSH).

```bash
# 1. Subir la carpeta frontend completa a la raíz del usuario ubuntu en AWS
scp -i "sam-key.pem" -r /home/emma/SAM/frontend ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 2. Subir también tu index.html y cualquier otro archivo suelto de la interfaz
scp -i "sam-key.pem" /home/emma/SAM/index.html ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 3. Subir el JAR generado (tu Backend compilado)
scp -i "sam-key.pem" /home/emma/SAM/backend/sam-backend/target/sam-backend-1.0-jar-with-dependencies.jar ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 4. Subir tu archivo de configuración .env
scp -i "sam-key.pem" /home/emma/SAM/backend/sam-backend/.env ubuntu@IP_PUBLICA_AWS:/home/ubuntu/
```

---

## 6. Configurar la App como un "Servicio" (Para que no se apague)

Si corres tu Java normal y cierras la consola, la aplicación se apagará. Necesitamos configurarlo como un servicio de Linux en AWS (Systemd).

Regresa a tu consola conectada por SSH a AWS y crea un archivo de servicio:

```bash
sudo nano /etc/systemd/system/sam-backend.service
```

Dentro del archivo, pega lo siguiente:

```ini
[Unit]
Description=SAM Backend Service
After=network.target mariadb.service

[Service]
User=ubuntu
# La ruta base donde la app buscará el front y el .env
WorkingDirectory=/home/ubuntu
# Comando para ejecutar el JAR
ExecStart=/usr/bin/java -jar /home/ubuntu/sam-backend-1.0-jar-with-dependencies.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Guarda y cierra (`Ctrl+O`, `Enter`, `Ctrl+X`).

Y finalmente, inicia tu sistema de forma perpetua:

```bash
# Recargar el demonio de Linux para que vea el nuevo servicio
sudo systemctl daemon-reload

# Habilitar que inicie solo cada vez que prendas o reinicies el servidor AWS
sudo systemctl enable sam-backend.service

# Iniciar la aplicación en este momento
sudo systemctl start sam-backend.service

# Revisar si arrancó sin errores
sudo systemctl status sam-backend.service
```

---

## 🎉 ¡Listo!

Tu sistema SAM ya está en vivo en la nube. 

Para acceder, solo debes abrir tu navegador web y teclear:
`http://IP_PUBLICA_AWS:7070`

Si más adelante quieres ver si alguien visita tu página o qué está haciendo tu sistema por detrás (log de consola), solo escribe en el servidor AWS:
```bash
sudo journalctl -u sam-backend.service -f
```
