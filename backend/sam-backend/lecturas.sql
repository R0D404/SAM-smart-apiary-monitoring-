-- Eliminar datos de prueba previos si existen para no duplicar (opcional, pero mejor solo insertar)
-- Insertar lecturas de peso para el módulo 1 (Colmena 1) durante los últimos 7 días
INSERT IGNORE INTO LECTURA_SENSOR (modulo_id, tipo_sensor, valor, origen, timestamp_dispositivo) VALUES
(1, 'peso', 31.0, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)),
(1, 'peso', 31.2, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY)),
(1, 'peso', 31.5, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY)),
(1, 'peso', 32.1, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)),
(1, 'peso', 32.8, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)),
(1, 'peso', 33.4, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)),
(1, 'peso', 34.0, 'interna', CURRENT_DATE);

-- Insertar lecturas de peso para el módulo 2 (Colmena 2) durante los últimos 7 días
INSERT IGNORE INTO LECTURA_SENSOR (modulo_id, tipo_sensor, valor, origen, timestamp_dispositivo) VALUES
(2, 'peso', 35.0, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)),
(2, 'peso', 35.1, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY)),
(2, 'peso', 35.2, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY)),
(2, 'peso', 35.8, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)),
(2, 'peso', 36.3, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)),
(2, 'peso', 36.9, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)),
(2, 'peso', 37.5, 'interna', CURRENT_DATE);

-- Módulo 3 (Colmena 3)
INSERT IGNORE INTO LECTURA_SENSOR (modulo_id, tipo_sensor, valor, origen, timestamp_dispositivo) VALUES
(3, 'peso', 28.5, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)),
(3, 'peso', 29.0, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY)),
(3, 'peso', 29.8, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY)),
(3, 'peso', 30.5, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)),
(3, 'peso', 31.2, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY)),
(3, 'peso', 31.9, 'interna', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)),
(3, 'peso', 32.6, 'interna', CURRENT_DATE);

-- También insertamos un par de temperatura y humedad para que el promedio se muestre si es que se necesita.
INSERT IGNORE INTO LECTURA_SENSOR (modulo_id, tipo_sensor, valor, origen, timestamp_dispositivo) VALUES
(1, 'temp', 34.5, 'interna', CURRENT_DATE),
(2, 'temp', 35.1, 'interna', CURRENT_DATE),
(3, 'temp', 34.8, 'interna', CURRENT_DATE);
