-- Insertar microclima (si no existe)
INSERT IGNORE INTO CATALAGO_MICROCLIMA (id, nombre, descripcion) VALUES (1, 'selva alta', 'Clima cálido húmedo');

-- Insertar Apiario
INSERT IGNORE INTO APIARIO (id, admin_id, microclima_id, nombre, estado, municipio, localidad, referencia, latitud, longitud, creado_en)
VALUES (1, 1, 1, 'Apiario El Roble', 'Chiapas', 'Tapachula', 'Ejido Raymundo', 'Rumbo al cerro', 14.9, -92.2, CURRENT_DATE);

-- Insertar Colmenas
INSERT IGNORE INTO COLMENA (id, apiario_id, codigo, ecotipo, estado, fecha_instalacion)
VALUES 
(1, 1, 'C-01', 'Hibrida', 'activa', CURRENT_DATE),
(2, 1, 'C-02', 'Italiana', 'activa', CURRENT_DATE),
(3, 1, 'C-03', 'Carniola', 'activa', CURRENT_DATE),
(4, 1, 'C-04', 'Hibrida', 'activa', CURRENT_DATE);

-- Insertar Modulos
INSERT IGNORE INTO MODULO_MONITOREO (id, colmena_id, identificador, tipo, estado)
VALUES
(1, 1, 'ESP32-A1', 'interno_ambiental', 'activo'),
(2, 2, 'ESP32-A2', 'interno', 'activo'),
(3, 3, 'ESP32-A3', 'interno', 'activo');

-- Insertar Alertas (algunas no atendidas)
INSERT IGNORE INTO ALERTA (id, colmena_id, tipo, nivel, mensaje, atendida)
VALUES
(1, 1, 'umbral', 'critico', 'Temperatura interna por encima de 38°C', false),
(2, 2, 'tasa_cambio', 'aviso', 'Caída brusca de peso (-2kg/h)', false);

-- Insertar Sesión y Cosecha
INSERT IGNORE INTO SESION_VISITA (id, apiario_id, usuario_id, tipo, fecha, hora_inicio)
VALUES (1, 1, 1, 'cosecha', CURRENT_DATE, '08:00:00');

INSERT IGNORE INTO COSECHA (id, colmena_id, sesion_id, kg_miel, calidad)
VALUES
(1, 1, 1, 25.5, 'Primera calidad'),
(2, 2, 1, 30.0, 'Primera calidad'),
(3, 3, 1, 18.2, 'Segunda calidad');
