-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = CURRENT_TIMESTAMP; 
    RETURN NEW; 
END; 
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at 
BEFORE UPDATE ON members 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();