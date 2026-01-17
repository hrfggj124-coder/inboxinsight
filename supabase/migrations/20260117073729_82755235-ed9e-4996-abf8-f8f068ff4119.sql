-- Add explicit RLS policy to block all public access to rate_limits table
-- This table should only be accessed by edge functions using the service role key

-- First, ensure RLS is enabled (it should already be, but this is idempotent)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Add a policy that blocks all SELECT access for regular users
-- Service role bypasses RLS, so edge functions will still work
CREATE POLICY "Block all public access to rate limits"
ON public.rate_limits
FOR SELECT
USING (false);

-- Add policies for other operations as well to be explicit
CREATE POLICY "Block all public inserts to rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block all public updates to rate limits"
ON public.rate_limits
FOR UPDATE
USING (false);

CREATE POLICY "Block all public deletes to rate limits"
ON public.rate_limits
FOR DELETE
USING (false);