
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to generate notifications for a user based on their profile state
CREATE OR REPLACE FUNCTION public.generate_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If profile is incomplete (no skills), add a notification
  IF (NEW.skills IS NULL OR array_length(NEW.skills, 1) IS NULL) AND 
     NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = NEW.user_id AND type = 'profile_incomplete') THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.user_id, 'Complete your profile by adding skills for better internship matches.', 'profile_incomplete');
  END IF;

  -- If skills were just added/updated, notify about matching internships
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN
    -- Remove old profile_incomplete notification
    DELETE FROM notifications WHERE user_id = NEW.user_id AND type = 'profile_incomplete';
    
    -- Add a matching internships notification (replace old one)
    DELETE FROM notifications WHERE user_id = NEW.user_id AND type = 'skill_match';
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.user_id, 'New internships matching your skills: ' || array_to_string(NEW.skills[1:3], ', ') || '!', 'skill_match');
  END IF;

  -- If resume was just added
  IF NEW.resume_text IS NOT NULL AND NEW.resume_text != '' AND 
     (OLD.resume_text IS NULL OR OLD.resume_text = '') THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.user_id, 'Resume uploaded! Try AI analysis for personalized recommendations.', 'resume_added');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_update_notifications
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_notifications();

-- Generate welcome notification for new users
CREATE OR REPLACE FUNCTION public.generate_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (NEW.user_id, 'Welcome to InternAI! Add your skills to get started.', 'welcome');
  
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (NEW.user_id, 'Complete your profile by adding skills for better internship matches.', 'profile_incomplete');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_create_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_welcome_notification();
