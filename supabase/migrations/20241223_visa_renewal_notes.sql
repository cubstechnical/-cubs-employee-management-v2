-- Enhancement to visa history tracking to capture renewal notes
-- Adds a temporary column and updates trigger to use it

-- Add temporary column for renewal notes (will be cleared after trigger fires)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_table' AND column_name = 'temp_renewal_notes'
    ) THEN
        ALTER TABLE employee_table ADD COLUMN temp_renewal_notes TEXT;
    END IF;
END $$;

-- Update the trigger function to capture notes
CREATE OR REPLACE FUNCTION log_visa_change()
RETURNS TRIGGER AS $$
DECLARE
    old_status TEXT;
    new_status TEXT;
    change_type TEXT;
    renewal_notes TEXT;
BEGIN
    -- Calculate statuses
    old_status := calculate_visa_status(OLD.visa_expiry_date);
    new_status := calculate_visa_status(NEW.visa_expiry_date);
    
    -- Determine change type
    IF OLD.visa_expiry_date IS NULL AND NEW.visa_expiry_date IS NOT NULL THEN
        change_type := 'new_visa';
    ELSIF OLD.visa_expiry_date != NEW.visa_expiry_date THEN
        change_type := 'renewal';
    ELSIF old_status != new_status THEN
        change_type := 'status_change';
    ELSE
        -- No meaningful change, skip logging
        RETURN NEW;
    END IF;
    
    -- Capture renewal notes if provided
    renewal_notes := NEW.temp_renewal_notes;
    
    -- Insert history record
    INSERT INTO visa_history(
        employee_id,
        old_expiry_date,
        new_expiry_date,
        old_status,
        new_status,
        change_type,
        changed_at,
        notes
    ) VALUES (
        NEW.id,
        OLD.visa_expiry_date,
        NEW.visa_expiry_date,
        old_status,
        new_status,
        change_type,
        NOW(),
        renewal_notes
    );
    
    -- Clear the temporary notes field after logging
    NEW.temp_renewal_notes := NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON COLUMN employee_table.temp_renewal_notes IS 'Temporary column to pass renewal notes to visa history trigger. Cleared automatically after update.';
