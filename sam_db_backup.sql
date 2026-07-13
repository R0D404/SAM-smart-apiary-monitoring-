/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.3.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: SAM
-- ------------------------------------------------------
-- Server version	12.3.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `ALERTA`
--

DROP TABLE IF EXISTS `ALERTA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ALERTA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `tipo` enum('umbral','tasa_cambio') NOT NULL,
  `nivel` enum('aviso','critico') NOT NULL,
  `mensaje` varchar(255) DEFAULT NULL,
  `enmascarada` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE si surgió durante una sesión activa',
  `atendida` tinyint(1) NOT NULL DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`,`atendida`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ALERTA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ALERTA` WRITE;
/*!40000 ALTER TABLE `ALERTA` DISABLE KEYS */;
INSERT INTO `ALERTA` VALUES
(1,1,'umbral','critico','Temperatura interna por encima de 38°C',0,0,'2026-07-12 23:53:24'),
(2,2,'tasa_cambio','aviso','Caída brusca de peso (-2kg/h)',0,0,'2026-07-12 23:53:24');
/*!40000 ALTER TABLE `ALERTA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `APIARIO`
--

DROP TABLE IF EXISTS `APIARIO`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `APIARIO` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL COMMENT 'dueño que lo registró',
  `microclima_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` varchar(60) DEFAULT NULL COMMENT 'ej. Chiapas',
  `municipio` varchar(80) DEFAULT NULL COMMENT 'ej. Tapachula',
  `localidad` varchar(120) DEFAULT NULL COMMENT 'ej. Ejido Raymundo Enríquez',
  `referencia` varchar(200) DEFAULT NULL COMMENT 'calle / punto de referencia opcional',
  `latitud` decimal(9,6) DEFAULT NULL COMMENT 'para generar el link al mapa',
  `longitud` decimal(9,6) DEFAULT NULL COMMENT 'para generar el link al mapa',
  `creado_en` date NOT NULL COMMENT 'fecha de creación; tipo DATE',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `microclima_id` (`microclima_id`),
  CONSTRAINT `1` FOREIGN KEY (`admin_id`) REFERENCES `USUARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`microclima_id`) REFERENCES `CATALAGO_MICROCLIMA` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `APIARIO`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `APIARIO` WRITE;
/*!40000 ALTER TABLE `APIARIO` DISABLE KEYS */;
INSERT INTO `APIARIO` VALUES
(1,1,4,'Apiario El Roble','cdmx','Tapachula','Ejido Raymundo','Rumbo al cerro',14.900000,-92.200000,'2026-07-12'),
(2,1,1,'Apiario Sur','Chiapas','Tuxtla','Centro','N/A',15.000000,-92.000000,'2026-07-12');
/*!40000 ALTER TABLE `APIARIO` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `APIARIO_APICULTOR`
--

DROP TABLE IF EXISTS `APIARIO_APICULTOR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `APIARIO_APICULTOR` (
  `apiario_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `asignado_en` date NOT NULL,
  PRIMARY KEY (`apiario_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `APIARIO_APICULTOR`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `APIARIO_APICULTOR` WRITE;
/*!40000 ALTER TABLE `APIARIO_APICULTOR` DISABLE KEYS */;
INSERT INTO `APIARIO_APICULTOR` VALUES
(1,2,'2026-07-12'),
(2,3,'2026-07-12');
/*!40000 ALTER TABLE `APIARIO_APICULTOR` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `CATALAGO_MICROCLIMA`
--

DROP TABLE IF EXISTS `CATALAGO_MICROCLIMA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CATALAGO_MICROCLIMA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL COMMENT 'templado | húmedo | caluroso | frío de montaña ...',
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CATALAGO_MICROCLIMA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `CATALAGO_MICROCLIMA` WRITE;
/*!40000 ALTER TABLE `CATALAGO_MICROCLIMA` DISABLE KEYS */;
INSERT INTO `CATALAGO_MICROCLIMA` VALUES
(1,'selva alta','Clima cálido húmedo'),
(2,'Selva baja','Clima cálido subhúmedo con temporada seca'),
(3,'Bosque templado','Clima templado con lluvias en verano'),
(4,'Bosque mesófilo','Bosque de niebla, alta humedad'),
(5,'Matorral xerófilo','Clima árido y semiárido'),
(6,'Pastizal','Zonas semiáridas y templadas'),
(7,'Manglar','Zonas costeras con alta salinidad y humedad');
/*!40000 ALTER TABLE `CATALAGO_MICROCLIMA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `CATALAGO_ROL`
--

DROP TABLE IF EXISTS `CATALAGO_ROL`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CATALAGO_ROL` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL COMMENT 'admin | apicultor',
  `descripcion` varchar(150) DEFAULT NULL COMMENT 'Descripción de los permisos del rol',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CATALAGO_ROL`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `CATALAGO_ROL` WRITE;
/*!40000 ALTER TABLE `CATALAGO_ROL` DISABLE KEYS */;
INSERT INTO `CATALAGO_ROL` VALUES
(1,'admin','administrador del negocio apicola'),
(2,'apicultor','apicultor encargado de los apiarios a los que sea asignados');
/*!40000 ALTER TABLE `CATALAGO_ROL` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `COLMENA`
--

DROP TABLE IF EXISTS `COLMENA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `COLMENA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) NOT NULL,
  `codigo` varchar(40) NOT NULL COMMENT 'etiqueta legible: C-01, HIBRIDA-A...',
  `ecotipo` varchar(80) DEFAULT NULL COMMENT 'raza/subpoblación; opcional',
  `estado` varchar(30) NOT NULL DEFAULT 'activa',
  `fecha_instalacion` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `apiario_id` (`apiario_id`,`codigo`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `COLMENA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `COLMENA` WRITE;
/*!40000 ALTER TABLE `COLMENA` DISABLE KEYS */;
INSERT INTO `COLMENA` VALUES
(1,1,'C-01','Hibrida','activa','2026-07-12'),
(2,1,'C-02','Italiana','activa','2026-07-12'),
(3,1,'C-03','Carniola','activa','2026-07-12'),
(5,1,'C-04','Hibrida','activa','2026-07-12');
/*!40000 ALTER TABLE `COLMENA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `COSECHA`
--

DROP TABLE IF EXISTS `COSECHA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `COSECHA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `sesion_id` int(11) NOT NULL,
  `kg_miel` decimal(6,2) NOT NULL,
  `calidad` varchar(40) DEFAULT NULL,
  `validado_con_peso` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE si el sensor confirmó la caída de peso',
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`sesion_id`) REFERENCES `SESION_VISITA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `COSECHA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `COSECHA` WRITE;
/*!40000 ALTER TABLE `COSECHA` DISABLE KEYS */;
INSERT INTO `COSECHA` VALUES
(1,1,1,25.50,'Primera calidad',0),
(2,2,1,30.00,'Primera calidad',0),
(3,3,1,18.20,'Segunda calidad',0);
/*!40000 ALTER TABLE `COSECHA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `LECTURA_SENSOR`
--

DROP TABLE IF EXISTS `LECTURA_SENSOR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `LECTURA_SENSOR` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `modulo_id` int(11) NOT NULL,
  `tipo_sensor` varchar(30) NOT NULL COMMENT 'peso | temp | humedad',
  `origen` enum('interna','externa') NOT NULL COMMENT 'externa = ambiente del apiario',
  `valor` decimal(10,3) NOT NULL,
  `tasa_cambio` decimal(8,4) DEFAULT NULL COMMENT 'Δvalor / Δt_horas; NULL en la primera lectura',
  `nivel_alerta` enum('normal','aviso','critico') NOT NULL DEFAULT 'normal',
  `timestamp_dispositivo` timestamp NOT NULL COMMENT 'hora real de medición (UTC)',
  `timestamp_servidor` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'hora de recepción (UTC)',
  PRIMARY KEY (`id`),
  KEY `modulo_id` (`modulo_id`,`timestamp_dispositivo`),
  CONSTRAINT `1` FOREIGN KEY (`modulo_id`) REFERENCES `MODULO_MONITOREO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LECTURA_SENSOR`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `LECTURA_SENSOR` WRITE;
/*!40000 ALTER TABLE `LECTURA_SENSOR` DISABLE KEYS */;
INSERT INTO `LECTURA_SENSOR` VALUES
(1,1,'peso','interna',31.000,NULL,'normal','2026-07-06 06:00:00','2026-07-13 01:27:52'),
(2,1,'peso','interna',31.200,NULL,'normal','2026-07-07 06:00:00','2026-07-13 01:27:52'),
(3,1,'peso','interna',31.500,NULL,'normal','2026-07-08 06:00:00','2026-07-13 01:27:52'),
(4,1,'peso','interna',32.100,NULL,'normal','2026-07-09 06:00:00','2026-07-13 01:27:52'),
(5,1,'peso','interna',32.800,NULL,'normal','2026-07-10 06:00:00','2026-07-13 01:27:52'),
(6,1,'peso','interna',33.400,NULL,'normal','2026-07-11 06:00:00','2026-07-13 01:27:52'),
(7,1,'peso','interna',34.000,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52'),
(8,2,'peso','interna',35.000,NULL,'normal','2026-07-06 06:00:00','2026-07-13 01:27:52'),
(9,2,'peso','interna',35.100,NULL,'normal','2026-07-07 06:00:00','2026-07-13 01:27:52'),
(10,2,'peso','interna',35.200,NULL,'normal','2026-07-08 06:00:00','2026-07-13 01:27:52'),
(11,2,'peso','interna',35.800,NULL,'normal','2026-07-09 06:00:00','2026-07-13 01:27:52'),
(12,2,'peso','interna',36.300,NULL,'normal','2026-07-10 06:00:00','2026-07-13 01:27:52'),
(13,2,'peso','interna',36.900,NULL,'normal','2026-07-11 06:00:00','2026-07-13 01:27:52'),
(14,2,'peso','interna',37.500,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52'),
(15,3,'peso','interna',28.500,NULL,'normal','2026-07-06 06:00:00','2026-07-13 01:27:52'),
(16,3,'peso','interna',29.000,NULL,'normal','2026-07-07 06:00:00','2026-07-13 01:27:52'),
(17,3,'peso','interna',29.800,NULL,'normal','2026-07-08 06:00:00','2026-07-13 01:27:52'),
(18,3,'peso','interna',30.500,NULL,'normal','2026-07-09 06:00:00','2026-07-13 01:27:52'),
(19,3,'peso','interna',31.200,NULL,'normal','2026-07-10 06:00:00','2026-07-13 01:27:52'),
(20,3,'peso','interna',31.900,NULL,'normal','2026-07-11 06:00:00','2026-07-13 01:27:52'),
(21,3,'peso','interna',32.600,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52'),
(22,1,'temp','interna',34.500,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52'),
(23,2,'temp','interna',35.100,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52'),
(24,3,'temp','interna',34.800,NULL,'normal','2026-07-12 06:00:00','2026-07-13 01:27:52');
/*!40000 ALTER TABLE `LECTURA_SENSOR` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `MODULO_MONITOREO`
--

DROP TABLE IF EXISTS `MODULO_MONITOREO`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `MODULO_MONITOREO` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL COMMENT 'colmena donde está instalado el ESP32',
  `identificador` varchar(60) DEFAULT NULL COMMENT 'ID físico del dispositivo (MAC/serie)',
  `tipo` enum('interno','interno_ambiental') NOT NULL,
  `estado` enum('activo','fallo','retirado') NOT NULL DEFAULT 'activo',
  `fecha_instalacion` date DEFAULT NULL,
  `ultimo_fallo` varchar(150) DEFAULT NULL COMMENT 'descripción del último fallo, si hubo',
  `fecha_fallo` date DEFAULT NULL COMMENT 'cuándo se detectó el fallo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `colmena_id` (`colmena_id`),
  UNIQUE KEY `identificador` (`identificador`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MODULO_MONITOREO`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `MODULO_MONITOREO` WRITE;
/*!40000 ALTER TABLE `MODULO_MONITOREO` DISABLE KEYS */;
INSERT INTO `MODULO_MONITOREO` VALUES
(1,1,'ESP32-A1','interno_ambiental','activo',NULL,NULL,NULL),
(2,2,'ESP32-A2','interno','activo',NULL,NULL,NULL),
(3,3,'ESP32-A3','interno','activo',NULL,NULL,NULL);
/*!40000 ALTER TABLE `MODULO_MONITOREO` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `SESION_VISITA`
--

DROP TABLE IF EXISTS `SESION_VISITA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SESION_VISITA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL COMMENT 'apicultor que la abre',
  `tipo` enum('visita','cosecha') NOT NULL,
  `fecha` date NOT NULL COMMENT 'día de la sesión',
  `hora_inicio` time NOT NULL,
  `hora_fin` time DEFAULT NULL COMMENT 'NULL mientras la sesión sigue abierta',
  `cierre_automatico` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `apiario_id` (`apiario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SESION_VISITA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `SESION_VISITA` WRITE;
/*!40000 ALTER TABLE `SESION_VISITA` DISABLE KEYS */;
INSERT INTO `SESION_VISITA` VALUES
(1,1,1,'cosecha','2026-07-12','08:00:00',NULL,0);
/*!40000 ALTER TABLE `SESION_VISITA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `UMBRAL_CONFIG`
--

DROP TABLE IF EXISTS `UMBRAL_CONFIG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UMBRAL_CONFIG` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) DEFAULT NULL COMMENT 'NULL = umbral global de respaldo',
  `tipo_sensor` varchar(30) NOT NULL,
  `franja_hora` tinyint(4) DEFAULT NULL COMMENT '0-23; NULL = aplica todo el día',
  `valor_min` decimal(10,3) DEFAULT NULL,
  `valor_max` decimal(10,3) DEFAULT NULL,
  `tasa_max_hora` decimal(8,4) DEFAULT NULL COMMENT 'tope de tasa de cambio antes de alertar',
  PRIMARY KEY (`id`),
  KEY `apiario_id` (`apiario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UMBRAL_CONFIG`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `UMBRAL_CONFIG` WRITE;
/*!40000 ALTER TABLE `UMBRAL_CONFIG` DISABLE KEYS */;
/*!40000 ALTER TABLE `UMBRAL_CONFIG` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `USUARIO`
--

DROP TABLE IF EXISTS `USUARIO`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `USUARIO` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `1` FOREIGN KEY (`rol_id`) REFERENCES `CATALAGO_ROL` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USUARIO`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `USUARIO` WRITE;
/*!40000 ALTER TABLE `USUARIO` DISABLE KEYS */;
INSERT INTO `USUARIO` VALUES
(1,1,'Emmanuel U.','admin@sam.com','$2a$10$hBJkahyyq/Wtzis4DBRfyOQsaWjpuDSZmjZc.tO17.ZPA9uBoIA9G',1,'2026-07-12'),
(2,2,'Rodrigo G.','rodrigo@sam.com','hash',1,'2026-07-12'),
(3,2,'Edgar S.','edgar@sam.com','hash',1,'2026-07-12'),
(4,2,'Andrea L.','andrea@sam.com','hash',0,'2026-07-12');
/*!40000 ALTER TABLE `USUARIO` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `VISITA`
--

DROP TABLE IF EXISTS `VISITA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `VISITA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `sesion_id` int(11) NOT NULL,
  `hora_inicio` time DEFAULT NULL COMMENT 'momento en que empezó la revisión',
  `hora_fin` time DEFAULT NULL COMMENT 'momento en que terminó',
  `estado_colonia` varchar(60) DEFAULT NULL,
  `reina_vista` tinyint(1) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`sesion_id`) REFERENCES `SESION_VISITA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VISITA`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `VISITA` WRITE;
/*!40000 ALTER TABLE `VISITA` DISABLE KEYS */;
/*!40000 ALTER TABLE `VISITA` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-07-12 23:31:51
