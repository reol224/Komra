-- Create system_metrics table for storing real resource usage data
CREATE TABLE IF NOT EXISTS system_metrics (
  id SERIAL PRIMARY KEY,
  cpu_usage DECIMAL(5,2) NOT NULL,
  memory_usage DECIMAL(5,2) NOT NULL,
  disk_usage DECIMAL(5,2) NOT NULL,
  network_latency DECIMAL(8,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- Enable realtime for system metrics
ALTER PUBLICATION supabase_realtime ADD TABLE system_metrics;

-- Insert some sample historical data for demonstration
INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_latency, recorded_at) VALUES
  (25.5, 42.3, 28.7, 12.4, NOW() - INTERVAL '1 hour'),
  (28.2, 45.1, 29.2, 14.1, NOW() - INTERVAL '50 minutes'),
  (32.1, 48.7, 29.8, 15.8, NOW() - INTERVAL '40 minutes'),
  (29.8, 46.2, 30.1, 13.2, NOW() - INTERVAL '30 minutes'),
  (35.4, 52.3, 30.7, 18.5, NOW() - INTERVAL '20 minutes'),
  (31.2, 49.1, 31.2, 16.3, NOW() - INTERVAL '10 minutes');