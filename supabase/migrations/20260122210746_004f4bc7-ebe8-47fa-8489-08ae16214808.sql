-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all operations on cases" ON public.cases;
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;
DROP POLICY IF EXISTS "Allow all operations on chat_history" ON public.chat_history;
DROP POLICY IF EXISTS "Allow all operations on event_participants" ON public.event_participants;
DROP POLICY IF EXISTS "Allow all operations on event_attachments" ON public.event_attachments;

-- Documents table policies - users can only access their own documents
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Cases table policies - users can only access their own cases
CREATE POLICY "Users can view their own cases"
ON public.cases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
ON public.cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
ON public.cases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
ON public.cases FOR DELETE
USING (auth.uid() = user_id);

-- Events table policies - users can only access their own events
CREATE POLICY "Users can view their own events"
ON public.events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.events FOR DELETE
USING (auth.uid() = user_id);

-- Chat history table policies - users can only access their own chat history
CREATE POLICY "Users can view their own chat history"
ON public.chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history"
ON public.chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
ON public.chat_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Event participants policies - access through event ownership
CREATE POLICY "Users can view participants of their own events"
ON public.event_participants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_participants.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can add participants to their own events"
ON public.event_participants FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_participants.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update participants of their own events"
ON public.event_participants FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_participants.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete participants of their own events"
ON public.event_participants FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_participants.event_id 
  AND events.user_id = auth.uid()
));

-- Event attachments policies - access through event ownership
CREATE POLICY "Users can view attachments of their own events"
ON public.event_attachments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_attachments.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can add attachments to their own events"
ON public.event_attachments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_attachments.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update attachments of their own events"
ON public.event_attachments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_attachments.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete attachments of their own events"
ON public.event_attachments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_attachments.event_id 
  AND events.user_id = auth.uid()
));