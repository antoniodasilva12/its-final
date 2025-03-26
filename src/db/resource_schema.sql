-- Create resource_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS resource_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    room_number TEXT NOT NULL,
    electricity_kwh DECIMAL(10,2) NOT NULL,
    water_liters DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, room_number, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resource_usage_student ON resource_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_resource_usage_date ON resource_usage(date);
CREATE INDEX IF NOT EXISTS idx_resource_usage_room ON resource_usage(room_number);

-- Enable RLS
ALTER TABLE resource_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Students can view their own resource usage" ON resource_usage;
    DROP POLICY IF EXISTS "Students can insert their own resource usage" ON resource_usage;
    DROP POLICY IF EXISTS "Students can update their own resource usage" ON resource_usage;
    DROP POLICY IF EXISTS "Admins can view all resource usage" ON resource_usage;
    
    -- Create new policies
    CREATE POLICY "Students can view their own resource usage"
        ON resource_usage FOR SELECT
        TO authenticated
        USING (auth.uid() = student_id);

    CREATE POLICY "Students can insert their own resource usage"
        ON resource_usage FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = student_id);

    CREATE POLICY "Students can update their own resource usage"
        ON resource_usage FOR UPDATE
        TO authenticated
        USING (auth.uid() = student_id);

    CREATE POLICY "Admins can view all resource usage"
        ON resource_usage FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END
$$;

-- Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'handle_resource_usage_updated_at'
    ) THEN
        CREATE TRIGGER handle_resource_usage_updated_at
            BEFORE UPDATE ON resource_usage
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END
$$;

-- Grant access to authenticated users
GRANT ALL ON resource_usage TO authenticated; 