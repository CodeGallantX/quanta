
-- Allow public INSERT access for admin signup
CREATE POLICY "Allow public admin signup" 
  ON public.admin_users 
  FOR INSERT 
  WITH CHECK (true);

-- Also allow SELECT for login verification
CREATE POLICY "Allow public admin login" 
  ON public.admin_users 
  FOR SELECT 
  USING (true);
