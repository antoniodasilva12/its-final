-- Drop existing objects if they exist
DROP MATERIALIZED VIEW IF EXISTS hourly_request_stats;
DROP POLICY IF EXISTS "Allow all" ON laundry_requests;
DROP TRIGGER IF EXISTS handle_updated_at ON laundry_requests;
DROP TABLE IF EXISTS laundry_requests;
DROP TABLE IF EXISTS laundry_time_slots;

-- Create laundry_time_slots table
CREATE TABLE IF NOT EXISTS laundry_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time_slot TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 5,
    current_load INTEGER NOT NULL DEFAULT 0,
    load_level TEXT CHECK (load_level IN ('off-peak', 'moderate', 'peak')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_slot_id UUID REFERENCES laundry_time_slots(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for time slots
CREATE INDEX IF NOT EXISTS idx_laundry_time_slots_time ON laundry_time_slots(time_slot);

-- Create laundry_requests table with time slot relationship
CREATE TABLE IF NOT EXISTS laundry_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    number_of_clothes INTEGER NOT NULL CHECK (number_of_clothes > 0),
    special_instructions TEXT,
    pickup_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'collected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_slot_id UUID REFERENCES laundry_time_slots(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_laundry_requests_student_id ON laundry_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_status ON laundry_requests(status);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_created_at ON laundry_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_time_slot ON laundry_requests(time_slot_id);

-- Enable RLS
ALTER TABLE laundry_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Students can view their own laundry requests"
            ON laundry_requests FOR SELECT
            USING (auth.uid() = student_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Students can insert their own laundry requests"
            ON laundry_requests FOR INSERT
            WITH CHECK (auth.uid() = student_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Admin can view all laundry requests"
            ON laundry_requests FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            ));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Admin can update any laundry request"
            ON laundry_requests FOR UPDATE
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            ));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_laundry') THEN
        CREATE TRIGGER handle_updated_at_laundry
            BEFORE UPDATE ON laundry_requests
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END
$$;

-- Grant access to authenticated users
GRANT ALL ON laundry_requests TO authenticated;
GRANT ALL ON laundry_time_slots TO authenticated;

-- Create function to update time slot load level
CREATE OR REPLACE FUNCTION update_time_slot_load_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate load level based on current_load vs capacity
    IF NEW.current_load >= NEW.capacity THEN
        NEW.load_level = 'peak';
    ELSIF NEW.current_load >= NEW.capacity * 0.7 THEN
        NEW.load_level = 'moderate';
    ELSE
        NEW.load_level = 'off-peak';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating load level
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_load_level') THEN
        CREATE TRIGGER update_load_level
            BEFORE INSERT OR UPDATE OF current_load ON laundry_time_slots
            FOR EACH ROW
            EXECUTE FUNCTION update_time_slot_load_level();
    END IF;
END
$$;