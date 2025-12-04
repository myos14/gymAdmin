-- Tabla de pagos
CREATE TABLE payment_records (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'otro'))
);

CREATE INDEX idx_payment_records_subscription_id ON payment_records(subscription_id);
CREATE INDEX idx_payment_records_member_id ON payment_records(member_id);
CREATE INDEX idx_payment_records_payment_date ON payment_records(payment_date);