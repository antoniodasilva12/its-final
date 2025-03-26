-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Students can view their own maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Students can create maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Admins can view all maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Admins can update maintenance requests" ON maintenance_requests;
DROP TABLE IF EXISTS maintenance_requests;
DROP TYPE IF EXISTS request_priority;
DROP TYPE IF EXISTS request_status;

-- Create enum types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_priority') THEN
        CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    END IF;
END
$$;

-- Create maintenance_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    room_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_student ON maintenance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);

-- Enable RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies (wrapped in DO block to handle existing policies)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Students can view their own maintenance requests" ON maintenance_requests;
    DROP POLICY IF EXISTS "Students can create maintenance requests" ON maintenance_requests;
    DROP POLICY IF EXISTS "Admins can view all maintenance requests" ON maintenance_requests;
    DROP POLICY IF EXISTS "Admins can update maintenance requests" ON maintenance_requests;
    
    -- Create new policies
    CREATE POLICY "Students can view their own maintenance requests"
        ON maintenance_requests FOR SELECT
        TO authenticated
        USING (auth.uid() = student_id);

    CREATE POLICY "Students can create maintenance requests"
        ON maintenance_requests FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = student_id);

    CREATE POLICY "Admins can view all maintenance requests"
        ON maintenance_requests FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );

    CREATE POLICY "Admins can update maintenance requests"
        ON maintenance_requests FOR UPDATE
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
        -- Log the error (will appear in Supabase logs)
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END
$$;

-- Create or replace the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'handle_maintenance_updated_at'
    ) THEN
        CREATE TRIGGER handle_maintenance_updated_at
            BEFORE UPDATE ON maintenance_requests
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END
$$;

-- Grant access to authenticated users
GRANT ALL ON maintenance_requests TO authenticated; 