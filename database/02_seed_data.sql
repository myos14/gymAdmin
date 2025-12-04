-- Datos de prueba
-- 1. Usuarios
INSERT INTO users (email, password_hash, role) VALUES
('admin@gym.com', 'temporal_hash', 'admin'),
('recepcion@gym.com', 'temporal_hash', 'empleado');

-- 2. Clientes
INSERT INTO members (first_name, last_name_paternal, last_name_maternal, phone, email) VALUES
('Cristiano', 'Ronaldo', 'Aveiro', '2221234567', 'cris.ronaldo@gmail.com'),
('Spider', 'Man', NULL, '2227654321', 'spider.man@gmail.com'),
('Luis', 'Miguel', NULL, '2229876543', 'luis.miguel@gmail.com'),
('Oscar', 'Romero', 'Hernández', '2223456789', 'oscar.romero@gmail.com');

-- 3. Planes de suscripción
INSERT INTO plans (name, price, duration_days, description) VALUES
('Visita', 40.00, 1, 'Acceso único por un día'),
('Mensual', 350, 30, 'Acceso por 30 días'),
('Bimestral', 600.00, 60, 'Acceso por 2 meses'),
('Semestral', 1699.00, 180, 'Acceso por 6 meses'),
('Anual', 2999.00, 365, 'Acceso por 1 año');

-- 4. Pagos
INSERT INTO payments (member_id, plan_id, amount, expiration_date, payment_method) VALUES
(1, 2, 350.00, '2025-12-11', 'efectivo'),
(2, 4, 1699.00, '2026-05-11', 'transferencia'),
(3, 1, 40.00, '2025-11-12', 'efectivo'),
(4, 3, 600.00, '2026-02-09', 'tarjeta');