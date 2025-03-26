-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
        CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'collected', 'cancelled');
    END IF;
END
$$;

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    nutritional_info JSONB,
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_type meal_type NOT NULL,
    menu_item_id UUID REFERENCES menu_items(id),
    serving_date DATE NOT NULL,
    serving_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    current_orders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create meal_orders table
CREATE TABLE IF NOT EXISTS meal_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES meal_plans(id),
    status order_status NOT NULL DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create meal_preferences table for AI recommendations
CREATE TABLE IF NOT EXISTS meal_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    dietary_restrictions TEXT[],
    allergies TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, menu_item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(serving_date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_type ON meal_plans(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_orders_student ON meal_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_meal_orders_status ON meal_orders(status);
CREATE INDEX IF NOT EXISTS idx_meal_preferences_student ON meal_preferences(student_id);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can view meal plans') THEN
        CREATE POLICY "Students can view meal plans"
            ON meal_plans FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can place orders') THEN
        CREATE POLICY "Students can place orders"
            ON meal_orders FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can view their own orders') THEN
        CREATE POLICY "Students can view their own orders"
            ON meal_orders FOR SELECT
            TO authenticated
            USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Students can manage their preferences') THEN
        CREATE POLICY "Students can manage their preferences"
            ON meal_preferences
            FOR ALL
            TO authenticated
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin can manage all meal plans') THEN
        CREATE POLICY "Admin can manage all meal plans"
            ON meal_plans
            FOR ALL
            TO authenticated
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin can manage all orders') THEN
        CREATE POLICY "Admin can manage all orders"
            ON meal_orders
            FOR ALL
            TO authenticated
            USING (EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            ));
    END IF;
END
$$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_meal_plans') THEN
        CREATE TRIGGER handle_updated_at_meal_plans
            BEFORE UPDATE ON meal_plans
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_meal_orders') THEN
        CREATE TRIGGER handle_updated_at_meal_orders
            BEFORE UPDATE ON meal_orders
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_meal_preferences') THEN
        CREATE TRIGGER handle_updated_at_meal_preferences
            BEFORE UPDATE ON meal_preferences
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_menu_items') THEN
        CREATE TRIGGER handle_updated_at_menu_items
            BEFORE UPDATE ON menu_items
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END
$$;

-- Grant access to authenticated users
GRANT ALL ON meal_plans TO authenticated;
GRANT ALL ON meal_orders TO authenticated;
GRANT ALL ON meal_preferences TO authenticated;
GRANT ALL ON menu_items TO authenticated;