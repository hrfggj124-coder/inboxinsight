-- Create a function to clean up expired rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_end < now()
  RETURNING 1 INTO deleted_count;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;