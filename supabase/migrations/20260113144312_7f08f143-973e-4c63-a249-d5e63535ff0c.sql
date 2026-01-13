-- Create rate limits table for persistent tracking across cold starts
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_ip TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_ip, function_name, window_start)
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (client_ip, function_name, window_end);

-- Create index for cleanup of expired records
CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits (window_end);

-- Enable RLS (only service role should access this)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access
-- This ensures rate limit data is protected

-- Create function to clean up expired rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_end < (now() - INTERVAL '5 minutes')
  RETURNING count(*) INTO deleted_count;
  
  RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();