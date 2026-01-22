-- Fix RLS policies to require authenticated role instead of allowing anonymous access

-- ============ CASES TABLE ============
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;

CREATE POLICY "Users can view their own cases" ON public.cases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases" ON public.cases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases" ON public.cases
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases" ON public.cases
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ CHAT_HISTORY TABLE ============
DROP POLICY IF EXISTS "Users can view their own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can create their own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can update their own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.chat_history;

CREATE POLICY "Users can view their own chat history" ON public.chat_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history" ON public.chat_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history" ON public.chat_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" ON public.chat_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ DOCUMENTS TABLE ============
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ EVENTS TABLE ============
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ EVENT_PARTICIPANTS TABLE ============
DROP POLICY IF EXISTS "Users can view participants of their own events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can add participants to their own events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can update participants of their own events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can delete participants of their own events" ON public.event_participants;

CREATE POLICY "Users can view participants of their own events" ON public.event_participants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_participants.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can add participants to their own events" ON public.event_participants
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = event_participants.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can update participants of their own events" ON public.event_participants
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_participants.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can delete participants of their own events" ON public.event_participants
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_participants.event_id AND events.user_id = auth.uid()));

-- ============ EVENT_ATTACHMENTS TABLE ============
DROP POLICY IF EXISTS "Users can view attachments of their own events" ON public.event_attachments;
DROP POLICY IF EXISTS "Users can add attachments to their own events" ON public.event_attachments;
DROP POLICY IF EXISTS "Users can update attachments of their own events" ON public.event_attachments;
DROP POLICY IF EXISTS "Users can delete attachments of their own events" ON public.event_attachments;

CREATE POLICY "Users can view attachments of their own events" ON public.event_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can add attachments to their own events" ON public.event_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can update attachments of their own events" ON public.event_attachments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can delete attachments of their own events" ON public.event_attachments
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()));

-- ============ PROFILES TABLE ============
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ USER_ROLES TABLE ============
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all user roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ FEATURE_REQUESTS TABLE ============
DROP POLICY IF EXISTS "Users can view their own requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.feature_requests;

CREATE POLICY "Users can view their own requests" ON public.feature_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON public.feature_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON public.feature_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all requests" ON public.feature_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all requests" ON public.feature_requests
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ CLICKUP_INTEGRATIONS TABLE ============
DROP POLICY IF EXISTS "Supremo users can view their own ClickUp integration" ON public.clickup_integrations;
DROP POLICY IF EXISTS "Supremo users can insert their own ClickUp integration" ON public.clickup_integrations;
DROP POLICY IF EXISTS "Supremo users can update their own ClickUp integration" ON public.clickup_integrations;
DROP POLICY IF EXISTS "Supremo users can delete their own ClickUp integration" ON public.clickup_integrations;

CREATE POLICY "Supremo users can view their own ClickUp integration" ON public.clickup_integrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND has_role(auth.uid(), 'supremo'::app_role));

CREATE POLICY "Supremo users can insert their own ClickUp integration" ON public.clickup_integrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'supremo'::app_role));

CREATE POLICY "Supremo users can update their own ClickUp integration" ON public.clickup_integrations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND has_role(auth.uid(), 'supremo'::app_role));

CREATE POLICY "Supremo users can delete their own ClickUp integration" ON public.clickup_integrations
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND has_role(auth.uid(), 'supremo'::app_role));

-- ============ STORAGE POLICIES ============
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'event-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload to their own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-files' AND (storage.foldername(name))[1] = auth.uid()::text);