-- Enum para tipos de recorrência
CREATE TYPE public.recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- Enum para status de checklist
CREATE TYPE public.checklist_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');

-- Enum para prioridade
CREATE TYPE public.checklist_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Enum para contexto do checklist
CREATE TYPE public.checklist_context AS ENUM ('case', 'client', 'general');

-- Tabela de Templates de Checklists
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context checklist_context NOT NULL DEFAULT 'general',
  category TEXT,
  priority checklist_priority NOT NULL DEFAULT 'medium',
  recurrence recurrence_type NOT NULL DEFAULT 'none',
  recurrence_day INTEGER, -- Dia do mês para recorrência mensal, dia da semana para semanal
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens de Template
CREATE TABLE public.checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  days_before_deadline INTEGER DEFAULT 0, -- Dias antes do prazo principal
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Checklists (instâncias geradas)
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  context checklist_context NOT NULL DEFAULT 'general',
  priority checklist_priority NOT NULL DEFAULT 'medium',
  status checklist_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens de Checklist
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Histórico de Obrigações (para a base de conhecimento)
CREATE TABLE public.obligation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE SET NULL,
  client_name TEXT,
  obligation_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  was_on_time BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Alertas/Triggers
CREATE TABLE public.checklist_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'reminder', -- reminder, deadline, overdue
  alert_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para checklist_templates
CREATE POLICY "Users can view their own templates" ON public.checklist_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.checklist_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.checklist_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.checklist_templates FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para checklist_template_items
CREATE POLICY "Users can view items of their templates" ON public.checklist_template_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.checklist_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can create items in their templates" ON public.checklist_template_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.checklist_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can update items in their templates" ON public.checklist_template_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.checklist_templates WHERE id = template_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete items from their templates" ON public.checklist_template_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.checklist_templates WHERE id = template_id AND user_id = auth.uid()));

-- Políticas RLS para checklists
CREATE POLICY "Users can view their own checklists" ON public.checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own checklists" ON public.checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checklists" ON public.checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own checklists" ON public.checklists FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para checklist_items
CREATE POLICY "Users can view items of their checklists" ON public.checklist_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.checklists WHERE id = checklist_id AND user_id = auth.uid()));
CREATE POLICY "Users can create items in their checklists" ON public.checklist_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.checklists WHERE id = checklist_id AND user_id = auth.uid()));
CREATE POLICY "Users can update items in their checklists" ON public.checklist_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.checklists WHERE id = checklist_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete items from their checklists" ON public.checklist_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.checklists WHERE id = checklist_id AND user_id = auth.uid()));

-- Políticas RLS para obligation_history
CREATE POLICY "Users can view their own history" ON public.obligation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own history" ON public.obligation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own history" ON public.obligation_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.obligation_history FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para checklist_alerts
CREATE POLICY "Users can view their own alerts" ON public.checklist_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own alerts" ON public.checklist_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.checklist_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.checklist_alerts FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();