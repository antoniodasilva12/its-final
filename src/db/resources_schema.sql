-- Create the resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    status TEXT NOT NULL CHECK (status IN ('available', 'low', 'out_of_stock')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS resources_status_idx ON resources(status);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS resources_created_at_idx ON resources(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admin to see all resources
CREATE POLICY "Admin can view all resources" ON resources
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow admin to insert resources
CREATE POLICY "Admin can insert resources" ON resources
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow admin to update resources
CREATE POLICY "Admin can update resources" ON resources
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow admin to delete resources
CREATE POLICY "Admin can delete resources" ON resources
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create a trigger to update the status based on quantity
CREATE OR REPLACE FUNCTION update_resource_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on quantity
    IF NEW.quantity = 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= 5 THEN
        NEW.status = 'low';
    ELSE
        NEW.status = 'available';
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_resource_status_trigger
    BEFORE INSERT OR UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_status();

-- Insert some sample resources
INSERT INTO resources (name, description, quantity) VALUES
    ('Bed Sheets', 'Standard single bed sheets', 50),
    ('Pillows', 'Memory foam pillows', 30),
    ('Blankets', 'Warm winter blankets', 40),
    ('Towels', 'Bath towels', 25),
    ('Cleaning Supplies', 'General cleaning materials', 100)
ON CONFLICT DO NOTHING;
