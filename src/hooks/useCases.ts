import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Case {
  id: string;
  case_number: string;
  title: string;
  client: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Usuário não autenticado");
  return user;
}

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      await requireUser();
      const { data, error } = await supabase.from("cases").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Case[];
    },
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (caseData: { case_number: string; title: string; client: string; type?: string; status?: string }) => {
      const user = await requireUser();
      const { data, error } = await supabase.from("cases").insert({
        case_number: caseData.case_number.trim(),
        title: caseData.title.trim(),
        client: caseData.client.trim(),
        type: caseData.type || "Cível",
        status: caseData.status || "active",
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso criado com sucesso!");
    },
    onError: (error) => toast.error(error.message || "Erro ao criar caso"),
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Case> & { id: string }) => {
      await requireUser();
      const safeUpdates = { ...updates };
      delete (safeUpdates as Partial<Case>).id;
      delete (safeUpdates as Partial<Case>).user_id;
      const { data, error } = await supabase.from("cases").update(safeUpdates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso atualizado!");
    },
    onError: (error) => toast.error(error.message || "Erro ao atualizar caso"),
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await requireUser();
      const { error } = await supabase.from("cases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Caso excluído!");
    },
    onError: (error) => toast.error(error.message || "Erro ao excluir caso"),
  });
}
