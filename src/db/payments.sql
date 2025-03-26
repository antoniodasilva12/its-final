-- Drop existing objects
DROP POLICY IF EXISTS "Allow all" ON payments;
DROP TRIGGER IF EXISTS handle_updated_at ON payments;
DROP TABLE IF EXISTS payments;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  month TEXT NOT NULL,
  checkout_request_id TEXT,
  transaction_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for own payments"
  ON payments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Enable insert access for own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Enable update access for own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = student_id);

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON payments TO authenticated;
