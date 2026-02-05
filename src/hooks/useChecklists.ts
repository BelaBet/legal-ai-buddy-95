import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type ChecklistPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ChecklistContext = 'case' | 'client' | 'general';

export interface ChecklistTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  context: ChecklistContext;
  category: string | null;
  priority: ChecklistPriority;
  recurrence: RecurrenceType;
  recurrence_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: ChecklistTemplateItem[];
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  order_index: number;
  days_before_deadline: number;
  is_required: boolean;
  created_at: string;
}

export interface Checklist {
  id: string;
  user_id: string;
  template_id: string | null;
  case_id: string | null;
  client_name: string | null;
  title: string;
  description: string | null;
  context: ChecklistContext;
  priority: ChecklistPriority;
  status: ChecklistStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  items?: ChecklistItem[];
  case?: { title: string; case_number: string } | null;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistAlert {
  id: string;
  user_id: string;
  checklist_id: string | null;
  checklist_item_id: string | null;
  alert_type: string;
  alert_date: string;
  is_sent: boolean;
  sent_at: string | null;
  message: string | null;
  created_at: string;
}

// Hook for Templates
export function useChecklistTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checklist-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select(`
          *,
          items:checklist_template_items(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChecklistTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<ChecklistTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items'> & { items?: Omit<ChecklistTemplateItem, 'id' | 'template_id' | 'created_at'>[] }) => {
      const { items, ...templateData } = template;
      
      const { data: newTemplate, error: templateError } = await supabase
        .from("checklist_templates")
        .insert({ ...templateData, user_id: user!.id })
        .select()
        .single();

      if (templateError) throw templateError;

      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("checklist_template_items")
          .insert(items.map((item, index) => ({
            ...item,
            template_id: newTemplate.id,
            order_index: item.order_index ?? index,
          })));

        if (itemsError) throw itemsError;
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChecklistTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("checklist_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Template atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("checklist_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Template excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir template: " + error.message);
    },
  });
}

// Hook for Checklists
export function useChecklists(filters?: { status?: ChecklistStatus; context?: ChecklistContext }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checklists", user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from("checklists")
        .select(`
          *,
          items:checklist_items(*),
          case:cases(title, case_number)
        `)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.context) {
        query = query.eq("context", filters.context);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Checklist[];
    },
    enabled: !!user,
  });
}

export function useChecklist(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checklist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select(`
          *,
          items:checklist_items(*),
          case:cases(title, case_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Checklist;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (checklist: Omit<Checklist, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'items' | 'case'> & { items?: Omit<ChecklistItem, 'id' | 'checklist_id' | 'created_at' | 'updated_at'>[] }) => {
      const { items, ...checklistData } = checklist;
      
      const { data: newChecklist, error: checklistError } = await supabase
        .from("checklists")
        .insert({ ...checklistData, user_id: user!.id })
        .select()
        .single();

      if (checklistError) throw checklistError;

      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("checklist_items")
          .insert(items.map((item, index) => ({
            ...item,
            checklist_id: newChecklist.id,
            order_index: item.order_index ?? index,
          })));

        if (itemsError) throw itemsError;
      }

      return newChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Checklist criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar checklist: " + error.message);
    },
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Checklist> & { id: string }) => {
      const { error } = await supabase
        .from("checklists")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar checklist: " + error.message);
    },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("checklists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Checklist excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir checklist: " + error.message);
    },
  });
}

// Hook for Checklist Items
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChecklistItem> & { id: string }) => {
      const { error } = await supabase
        .from("checklist_items")
        .update({
          ...updates,
          completed_at: updates.is_completed ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ChecklistItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("checklist_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      toast.success("Item adicionado!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar item: " + error.message);
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      toast.success("Item removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover item: " + error.message);
    },
  });
}

// Create checklist from template
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      dueDate, 
      caseId, 
      clientName 
    }: { 
      templateId: string; 
      dueDate?: string; 
      caseId?: string; 
      clientName?: string;
    }) => {
      // Fetch template with items
      const { data: template, error: templateError } = await supabase
        .from("checklist_templates")
        .select(`*, items:checklist_template_items(*)`)
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Create checklist
      const { data: newChecklist, error: checklistError } = await supabase
        .from("checklists")
        .insert({
          user_id: user!.id,
          template_id: templateId,
          case_id: caseId || null,
          client_name: clientName || null,
          title: template.title,
          description: template.description,
          context: template.context,
          priority: template.priority,
          status: 'pending',
          due_date: dueDate || null,
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create items from template
      if (template.items && template.items.length > 0) {
        const items = template.items.map((item: ChecklistTemplateItem) => ({
          checklist_id: newChecklist.id,
          title: item.title,
          description: item.description,
          order_index: item.order_index,
          is_required: item.is_required,
          is_completed: false,
          due_date: dueDate && item.days_before_deadline 
            ? new Date(new Date(dueDate).getTime() - item.days_before_deadline * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null,
        }));

        const { error: itemsError } = await supabase
          .from("checklist_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return newChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Checklist criado a partir do template!");
    },
    onError: (error) => {
      toast.error("Erro ao criar checklist: " + error.message);
    },
  });
}

// Alerts
export function useChecklistAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checklist-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_alerts")
        .select("*")
        .eq("is_sent", false)
        .lte("alert_date", new Date().toISOString())
        .order("alert_date", { ascending: true });

      if (error) throw error;
      return data as ChecklistAlert[];
    },
    enabled: !!user,
  });
}
