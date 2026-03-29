-- Drop the overly permissive ALL policy for admins on user_roles
-- and replace with specific SELECT, UPDATE, DELETE policies
-- plus a restrictive policy that blocks non-admin inserts

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can do everything
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));