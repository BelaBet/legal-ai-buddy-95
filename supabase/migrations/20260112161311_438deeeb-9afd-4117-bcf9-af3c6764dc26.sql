-- Add new columns to events table for enhanced functionality
ALTER TABLE public.events
ADD COLUMN description text,
ADD COLUMN meeting_link text,
ADD COLUMN notification_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN notification_minutes_before integer DEFAULT 30;

-- Create event_participants table
CREATE TABLE public.event_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  invite_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create policy for event_participants
CREATE POLICY "Allow all operations on event_participants"
ON public.event_participants
FOR ALL
USING (true)
WITH CHECK (true);

-- Create event_attachments table
CREATE TABLE public.event_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on event_attachments
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy for event_attachments
CREATE POLICY "Allow all operations on event_attachments"
ON public.event_attachments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create storage bucket for event files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-files', 'event-files', false);

-- Storage policies for event files
CREATE POLICY "Authenticated users can upload event files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view event files"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their event files"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-files' AND auth.role() = 'authenticated');