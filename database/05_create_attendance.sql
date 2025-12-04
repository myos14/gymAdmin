-- Tabla de asistencias (check-in/check-out)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricción: No puede haber check-out antes de check-in
    CONSTRAINT valid_checkout CHECK (check_out_time IS NULL OR check_out_time > check_in_time)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_subscription_id ON attendance(subscription_id);

-- Índice compuesto para buscar asistencias de un miembro en una fecha
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);