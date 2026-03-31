
CREATE POLICY "No direct access to admin_otps" ON public.admin_otps FOR ALL TO public USING (false) WITH CHECK (false);
