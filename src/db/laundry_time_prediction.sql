-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS get_peak_times;
DROP FUNCTION IF EXISTS suggest_laundry_time;
DROP MATERIALIZED VIEW IF EXISTS hourly_request_stats;

-- Create materialized view for hourly request statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_request_stats AS
WITH hourly_counts AS (
    SELECT 
        EXTRACT(DOW FROM pickup_time) as day_of_week,
        EXTRACT(HOUR FROM pickup_time) as hour_of_day,
        COUNT(*) as request_count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_processing_time
    FROM laundry_requests
    WHERE status != 'pending'
    GROUP BY day_of_week, hour_of_day
)
SELECT 
    day_of_week,
    hour_of_day,
    request_count,
    avg_processing_time,
    request_count / NULLIF(SUM(request_count) OVER (PARTITION BY day_of_week), 0) * 100 as hourly_load_percentage
FROM hourly_counts;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_hourly_stats_day_hour 
ON hourly_request_stats(day_of_week, hour_of_day);

-- Function to get peak times for a specific day
CREATE OR REPLACE FUNCTION get_peak_times(target_day INTEGER)
RETURNS TABLE (
    hour_of_day INTEGER,
    load_level TEXT,
    request_count BIGINT,
    avg_processing_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hrs.hour_of_day::INTEGER,
        CASE
            WHEN hrs.hourly_load_percentage >= 15 THEN 'peak'
            WHEN hrs.hourly_load_percentage >= 8 THEN 'moderate'
            ELSE 'off-peak'
        END as load_level,
        hrs.request_count,
        hrs.avg_processing_time
    FROM hourly_request_stats hrs
    WHERE hrs.day_of_week = target_day
    ORDER BY hrs.hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest best laundry time
CREATE OR REPLACE FUNCTION suggest_laundry_time(
    target_date TIMESTAMP WITH TIME ZONE,
    window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    suggested_time TIMESTAMP WITH TIME ZONE,
    load_level TEXT,
    expected_wait_time DOUBLE PRECISION
) AS $$
DECLARE
    target_day INTEGER;
    current_hour INTEGER;
BEGIN
    target_day := EXTRACT(DOW FROM target_date);
    current_hour := EXTRACT(HOUR FROM target_date);
    
    RETURN QUERY
    WITH time_slots AS (
        SELECT 
            target_date + (h || ' hours')::interval as slot_time,
            EXTRACT(HOUR FROM (target_date + (h || ' hours')::interval)) as hour,
            hrs.hourly_load_percentage,
            hrs.avg_processing_time
        FROM generate_series(0, window_hours) h
        LEFT JOIN hourly_request_stats hrs
        ON hrs.day_of_week = EXTRACT(DOW FROM (target_date + (h || ' hours')::interval))
        AND hrs.hour_of_day = EXTRACT(HOUR FROM (target_date + (h || ' hours')::interval))
    )
    SELECT 
        ts.slot_time,
        CASE
            WHEN ts.hourly_load_percentage >= 15 THEN 'peak'
            WHEN ts.hourly_load_percentage >= 8 THEN 'moderate'
            ELSE 'off-peak'
        END,
        COALESCE(ts.avg_processing_time, 1.0)
    FROM time_slots ts
    WHERE ts.hourly_load_percentage IS NOT NULL
    ORDER BY ts.hourly_load_percentage ASC, ts.avg_processing_time ASC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_peak_times(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_laundry_time(TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;
GRANT SELECT ON hourly_request_stats TO authenticated;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_laundry_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_request_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to refresh stats when laundry requests are updated
CREATE OR REPLACE FUNCTION trigger_refresh_laundry_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_laundry_stats();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'refresh_laundry_stats_trigger'
    ) THEN
        CREATE TRIGGER refresh_laundry_stats_trigger
        AFTER INSERT OR UPDATE OR DELETE
        ON laundry_requests
        FOR EACH STATEMENT
        EXECUTE FUNCTION trigger_refresh_laundry_stats();
    END IF;
END
$$;