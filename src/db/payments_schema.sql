-- Create the payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('mpesa', 'card', 'cash')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    transaction_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on student_id for faster lookups
CREATE INDEX IF NOT EXISTS payments_student_id_idx ON payments(student_id);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admin to see all payments
CREATE POLICY "Admin can view all payments" ON payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow admin to insert payments
CREATE POLICY "Admin can insert payments" ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow students to see only their own payments
CREATE POLICY "Students can view their own payments" ON payments
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Allow students to insert their own payments
CREATE POLICY "Students can insert their own payments" ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());
