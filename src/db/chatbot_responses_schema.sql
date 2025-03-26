-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Users can view chatbot responses" ON chatbot_responses;
DROP TABLE IF EXISTS chatbot_responses;

-- Create chatbot_responses table for storing predefined Q&A pairs
CREATE TABLE IF NOT EXISTS chatbot_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_chatbot_responses_question ON chatbot_responses USING gin(to_tsvector('english', question));
CREATE INDEX IF NOT EXISTS idx_chatbot_responses_category ON chatbot_responses(category);

-- Enable RLS
ALTER TABLE chatbot_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view responses
CREATE POLICY "Users can view chatbot responses"
    ON chatbot_responses
    FOR SELECT
    TO authenticated
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chatbot_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_chatbot_responses_updated_at
    BEFORE UPDATE
    ON chatbot_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_responses_updated_at();

-- Grant access to authenticated users
GRANT SELECT ON chatbot_responses TO authenticated;

-- Insert greeting responses
INSERT INTO chatbot_responses (question, answer, category) VALUES
('hello', 'Hello! Welcome to the Hostel Management System. How can I assist you today?', 'greetings'),
('hi', 'Hi there! How may I help you with your hostel-related queries?', 'greetings'),
('hey', 'Hey! Welcome to our hostel assistance. What can I do for you?', 'greetings'),
('good morning', 'Good morning! I hope you''re having a great day. How can I assist you?', 'greetings'),
('good afternoon', 'Good afternoon! How may I help you with your hostel needs today?', 'greetings'),
('good evening', 'Good evening! I''m here to help with any hostel-related questions you might have.', 'greetings'),
('greetings', 'Greetings! I''m your hostel assistant. What can I help you with?', 'greetings');