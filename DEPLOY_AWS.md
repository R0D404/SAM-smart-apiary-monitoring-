# AWS (Amazon Web Services) Deployment Guide

This guide details the complete step-by-step process for packaging your Java server (SAM Backend) into a `.jar` file and deploying it professionally on an AWS server (EC2).

---

## 1. Prepare the Project (Locally)

Before uploading your system, we need to package it into a single "Executable" file (Fat JAR). Javalin and Maven allow doing this very easily.

Open a terminal on your computer, go to your backend path and compile the code:

```bash
cd /home/emma/SAM/backend/sam-backend
mvn clean compile assembly:single
```

> **Note:** For `assembly:single` to work optimally, your `pom.xml` file must have the `maven-assembly-plugin` configured to package the JAR with all its dependencies. The result will be a file (for example, `sam-backend-1.0-jar-with-dependencies.jar`) inside the `target/` folder.

---

## 2. Create Server on AWS (EC2)

1. Enter your **AWS** console.
2. Go to the **EC2** service and click **Launch Instance**.
3. Name: `Servidor-SAM`.
4. Operating System (AMI): **Ubuntu Server 24.04 LTS** (most recommended and simplest).
5. Instance type: `t2.micro` (free and sufficient to start).
6. **Key pair:** Create a new key pair named `sam-key`. AWS will download a `sam-key.pem` file. Keep it safe, do not lose it!
7. **Network settings (Security Group):** Allow **SSH** traffic (port 22) from anywhere and, very importantly, **add a custom TCP rule for port 7070** (where your app runs) and another for port 80 (HTTP) if you plan to use a domain later.
8. Launch the instance.

---

## 3. Connect to the AWS Instance

Open your terminal in Linux (where you downloaded your `sam-key.pem` file):

```bash
# Change the permissions of your security key so AWS does not reject it
chmod 400 sam-key.pem

# Connect via SSH (Replace "IP_PUBLICA_AWS" with the IP EC2 gave you)
ssh -i "sam-key.pem" ubuntu@IP_PUBLICA_AWS
```

---

## 4. Install Java and Databases (On AWS)

Once inside the AWS terminal, update the server and install Java and MariaDB:

```bash
# Update the package manager
sudo apt update && sudo apt upgrade -y

# Install Java (The same or higher than you use locally, for example Java 21)
sudo apt install openjdk-21-jdk -y

# Check Java version
java -version

# Install MariaDB Database
sudo apt install mariadb-server -y
```

> **Important:** Remember to configure your database by running `sudo mysql_secure_installation`.

### 4.1. Migrate your Local Database to AWS
To avoid creating all the tables from scratch, we will export the database you already have on your computer and upload it to AWS.

1. **On your local computer**, export the database to a SQL file:
   ```bash
   mysqldump -u root -p SAM_DB > sam_db_backup.sql
   ```
2. Upload the SQL file to your AWS server using SCP:
   ```bash
   scp -i "sam-key.pem" sam_db_backup.sql ubuntu@IP_PUBLICA_AWS:/home/ubuntu/
   ```
3. **Inside the AWS server**, enter MariaDB and create the empty database:
   ```bash
   sudo mysql -u root -p
   # Inside MySQL write:
   CREATE DATABASE SAM_DB;
   CREATE USER 'emma'@'localhost' IDENTIFIED BY 'your_password_here';
   GRANT ALL PRIVILEGES ON SAM_DB.* TO 'emma'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
4. Finally, on AWS, import the uploaded file into the newly created database:
   ```bash
   mysql -u root -p SAM_DB < /home/ubuntu/sam_db_backup.sql
   ```

---

## 5. Upload Files to the AWS Server

Do not close your connection to AWS, but open **another new tab** of your local terminal to transfer files from your computer to AWS using `scp` (Secure Copy over SSH).

```bash
# 1. Upload the entire frontend folder to the root of the ubuntu user in AWS
scp -i "sam-key.pem" -r /home/emma/SAM/frontend ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 2. Also upload your index.html and any other loose interface files
scp -i "sam-key.pem" /home/emma/SAM/index.html ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 3. Upload the generated JAR (your compiled Backend)
scp -i "sam-key.pem" /home/emma/SAM/backend/sam-backend/target/sam-backend-1.0-jar-with-dependencies.jar ubuntu@IP_PUBLICA_AWS:/home/ubuntu/

# 4. Upload your .env configuration file
scp -i "sam-key.pem" /home/emma/SAM/backend/sam-backend/.env ubuntu@IP_PUBLICA_AWS:/home/ubuntu/
```

---

## 6. Configure the App as a "Service" (So it doesn't turn off)

If you run your normal Java and close the console, the application will shut down. We need to configure it as a Linux service on AWS (Systemd).

Go back to your SSH console connected to AWS and create a service file:

```bash
sudo nano /etc/systemd/system/sam-backend.service
```

Inside the file, paste the following:

```ini
[Unit]
Description=SAM Backend Service
After=network.target mariadb.service

[Service]
User=ubuntu
# The base path where the app will look for the front and the .env
WorkingDirectory=/home/ubuntu
# Command to execute the JAR
ExecStart=/usr/bin/java -jar /home/ubuntu/sam-backend-1.0-jar-with-dependencies.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and close (`Ctrl+O`, `Enter`, `Ctrl+X`).

And finally, start your system perpetually:

```bash
# Reload the Linux daemon so it sees the new service
sudo systemctl daemon-reload

# Enable it to start automatically every time you turn on or restart the AWS server
sudo systemctl enable sam-backend.service

# Start the application right now
sudo systemctl start sam-backend.service

# Check if it started without errors
sudo systemctl status sam-backend.service
```

---

## Done!

Your SAM system is now live in the cloud. 

To access it, simply open your web browser and type:
`http://PUBLIC_AWS_IP:7070`

If you later want to see if someone visits your page or what your system is doing behind the scenes (console log), just type on the AWS server:
```bash
sudo journalctl -u sam-backend.service -f
```
