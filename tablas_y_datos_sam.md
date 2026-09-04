```sql
CREATE TABLE `ALERTA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `tipo` enum('umbral','tasa_cambio') NOT NULL,
  `nivel` enum('aviso','critico') NOT NULL,
  `mensaje` varchar(255) DEFAULT NULL,
  `enmascarada` tinyint(1) NOT NULL DEFAULT 0 ,
  `atendida` tinyint(1) NOT NULL DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`,`atendida`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `ALERTA` VALUES
(1,1,'umbral','critico','Internal temperature above 38°C',0,0,'2026-07-12 23:53:24'),
(2,2,'tasa_cambio','aviso','Sudden weight drop (-2kg/h)',0,0,'2026-07-12 23:53:24');

CREATE TABLE `APIARIO` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL ,
  `microclima_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` varchar(60) DEFAULT NULL ,
  `municipio` varchar(80) DEFAULT NULL ,
  `localidad` varchar(120) DEFAULT NULL ,
  `referencia` varchar(200) DEFAULT NULL ,
  `latitud` decimal(9,6) DEFAULT NULL ,
  `longitud` decimal(9,6) DEFAULT NULL ,
  `creado_en` date NOT NULL ,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `microclima_id` (`microclima_id`),
  CONSTRAINT `1` FOREIGN KEY (`admin_id`) REFERENCES `USUARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`microclima_id`) REFERENCES `CATALAGO_MICROCLIMA` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `APIARIO` VALUES
(1,1,4,'Apiario El Roble','cdmx','Tapachula','Ejido Raymundo','Rumbo al cerro',14.900000,-92.200000,'2026-07-12'),
(2,1,1,'Apiario Sur','Chiapas','Tuxtla','Centro','N/A',15.000000,-92.000000,'2026-07-12');

CREATE TABLE `APIARIO_APICULTOR` (
  `apiario_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `asignado_en` date NOT NULL,
  PRIMARY KEY (`apiario_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `APIARIO_APICULTOR` VALUES
(1,2,'2026-07-12'),
(2,3,'2026-07-12');

CREATE TABLE `CATALAGO_MICROCLIMA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL ,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `CATALAGO_MICROCLIMA` VALUES
(1,'selva alta','Clima cálido húmedo'),
(2,'Selva baja','Clima cálido subhúmedo con temporada seca'),
(3,'Bosque templado','Clima templado con lluvias en verano'),
(4,'Bosque mesófilo','Bosque de niebla, alta humedad'),
(5,'Matorral xerófilo','Clima árido y semiárido'),
(6,'Pastizal','Zonas semiáridas y templadas'),
(7,'Manglar','Zonas costeras con alta salinidad y humedad');

CREATE TABLE `CATALAGO_ROL` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL ,
  `descripcion` varchar(150) DEFAULT NULL ,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `CATALAGO_ROL` VALUES
(1,'admin','administrador del negocio apicola'),
(2,'apicultor','apicultor encargado de los apiarios a los que sea asignados');

CREATE TABLE `COLMENA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) NOT NULL,
  `codigo` varchar(40) NOT NULL ,
  `ecotipo` varchar(80) DEFAULT NULL ,
  `estado` varchar(30) NOT NULL DEFAULT 'activa',
  `fecha_instalacion` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `apiario_id` (`apiario_id`,`codigo`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `COLMENA` VALUES
(1,1,'C-01','Hibrida','activa','2026-07-12'),
(2,1,'C-02','Italiana','activa','2026-07-12'),
(3,1,'C-03','Carniola','activa','2026-07-12'),
(5,1,'C-04','Hibrida','activa','2026-07-12');

CREATE TABLE `COSECHA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `sesion_id` int(11) NOT NULL,
  `kg_miel` decimal(6,2) NOT NULL,
  `calidad` varchar(40) DEFAULT NULL,
  `validado_con_peso` tinyint(1) NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`sesion_id`) REFERENCES `SESION_VISITA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `COSECHA` VALUES
(1,1,1,25.50,'Primera calidad',0),
(2,2,1,30.00,'Primera calidad',0),
(3,3,1,18.20,'Segunda calidad',0);

CREATE TABLE `LECTURA_SENSOR` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `modulo_id` int(11) NOT NULL,
  `tipo_sensor` varchar(30) NOT NULL ,
  `origen` enum('interna','externa') NOT NULL ,
  `valor` decimal(10,3) NOT NULL,
  `tasa_cambio` decimal(8,4) DEFAULT NULL ,
  `nivel_alerta` enum('normal','aviso','critico') NOT NULL DEFAULT 'normal',
  `timestamp_dispositivo` timestamp NOT NULL ,
  `timestamp_servidor` timestamp NOT NULL DEFAULT current_timestamp() ,
  PRIMARY KEY (`id`),
  KEY `modulo_id` (`modulo_id`,`timestamp_dispositivo`),
  CONSTRAINT `1` FOREIGN KEY (`modulo_id`) REFERENCES `MODULO_MONITOREO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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

CREATE TABLE `MODULO_MONITOREO` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL ,
  `identificador` varchar(60) DEFAULT NULL ,
  `tipo` enum('interno','interno_ambiental') NOT NULL,
  `estado` enum('activo','fallo','retirado') NOT NULL DEFAULT 'activo',
  `fecha_instalacion` date DEFAULT NULL,
  `ultimo_fallo` varchar(150) DEFAULT NULL ,
  `fecha_fallo` date DEFAULT NULL ,
  PRIMARY KEY (`id`),
  UNIQUE KEY `colmena_id` (`colmena_id`),
  UNIQUE KEY `identificador` (`identificador`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `MODULO_MONITOREO` VALUES
(1,1,'ESP32-A1','interno_ambiental','activo',NULL,NULL,NULL),
(2,2,'ESP32-A2','interno','activo',NULL,NULL,NULL),
(3,3,'ESP32-A3','interno','activo',NULL,NULL,NULL);

CREATE TABLE `SESION_VISITA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL ,
  `tipo` enum('visita','cosecha') NOT NULL,
  `fecha` date NOT NULL ,
  `hora_inicio` time NOT NULL,
  `hora_fin` time DEFAULT NULL ,
  `cierre_automatico` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `apiario_id` (`apiario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `SESION_VISITA` VALUES
(1,1,1,'cosecha','2026-07-12','08:00:00',NULL,0);

CREATE TABLE `UMBRAL_CONFIG` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiario_id` int(11) DEFAULT NULL ,
  `tipo_sensor` varchar(30) NOT NULL,
  `franja_hora` tinyint(4) DEFAULT NULL ,
  `valor_min` decimal(10,3) DEFAULT NULL,
  `valor_max` decimal(10,3) DEFAULT NULL,
  `tasa_max_hora` decimal(8,4) DEFAULT NULL ,
  PRIMARY KEY (`id`),
  KEY `apiario_id` (`apiario_id`),
  CONSTRAINT `1` FOREIGN KEY (`apiario_id`) REFERENCES `APIARIO` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
INSERT INTO `USUARIO` VALUES
(1,1,'Emmanuel U.','admin@sam.com','$2a$10$hBJkahyyq/Wtzis4DBRfyOQsaWjpuDSZmjZc.tO17.ZPA9uBoIA9G',1,'2026-07-12'),
(2,2,'Rodrigo G.','rodrigo@sam.com','hash',1,'2026-07-12'),
(3,2,'Edgar S.','edgar@sam.com','hash',1,'2026-07-12'),
(4,2,'Andrea L.','andrea@sam.com','hash',0,'2026-07-12');

CREATE TABLE `VISITA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `colmena_id` int(11) NOT NULL,
  `sesion_id` int(11) NOT NULL,
  `hora_inicio` time DEFAULT NULL ,
  `hora_fin` time DEFAULT NULL ,
  `estado_colonia` varchar(60) DEFAULT NULL,
  `reina_vista` tinyint(1) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `colmena_id` (`colmena_id`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `1` FOREIGN KEY (`colmena_id`) REFERENCES `COLMENA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`sesion_id`) REFERENCES `SESION_VISITA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```